import type {
  CardScheduleRequest,
  ScheduledEventRef,
  SchedulerGateway,
  SchedulerJobStatus,
} from "@/integrations/scheduler/scheduler.gateway";

interface CronicleGatewayOptions {
  baseUrl: string;
  apiKey: string;
  defaultCategoryId?: string;
  defaultPluginId?: string;
  defaultTarget?: string;
  webHookUrl?: string;
}

type CronicleResponse<T extends object = Record<string, never>> = {
  code: number | string;
  description?: string;
} & T;

type CronicleJob = {
  complete?: number;
  code?: number;
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "");
}

function parseDateParts(isoDate: string) {
  const parsed = new Date(isoDate);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Data invalida para agendamento: ${isoDate}`);
  }

  return {
    years: [parsed.getUTCFullYear()],
    months: [parsed.getUTCMonth() + 1],
    days: [parsed.getUTCDate()],
    hours: [parsed.getUTCHours()],
    minutes: [parsed.getUTCMinutes()],
  };
}

function assertCronicleSuccess<T extends object>(response: CronicleResponse<T>) {
  if (response.code !== 0) {
    throw new Error(response.description ?? "Erro inesperado ao acessar Cronicle API.");
  }
}

export class CronicleHttpGateway implements SchedulerGateway {
  private readonly baseUrl: string;

  constructor(private readonly options: CronicleGatewayOptions) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
  }

  async upsertCardDeadlineEvent(input: CardScheduleRequest): Promise<ScheduledEventRef> {
    const timing = parseDateParts(input.deliveryDateISO);

    const response = await this.request<{ id: string }>("create_event", {
      title: `[KANBAN] ${input.title} (${input.cardId})`,
      enabled: 1,
      category: this.options.defaultCategoryId ?? "general",
      plugin: this.options.defaultPluginId ?? "shellplug",
      target: this.options.defaultTarget ?? "all",
      timezone: "UTC",
      timing,
      notes: input.description ?? "Evento criado pelo frontend do Kanban",
      params: {
        cardId: input.cardId,
        boardId: input.boardId,
        channels: input.channels,
        reminderDateISO: input.reminderDateISO,
      },
      web_hook: this.options.webHookUrl ?? "",
    });

    assertCronicleSuccess(response);

    return {
      provider: "cronicle",
      eventId: response.id,
    };
  }

  async runEventNow(eventId: string): Promise<string[]> {
    const response = await this.request<{ ids: string[] }>("run_event", { id: eventId });
    assertCronicleSuccess(response);

    return response.ids;
  }

  async getJobStatus(jobId: string): Promise<SchedulerJobStatus> {
    const response = await this.request<{ job?: CronicleJob }>("get_job_status", { id: jobId });
    assertCronicleSuccess(response);

    if (!response.job) {
      return "queued";
    }

    if (response.job.complete !== 1) {
      return "running";
    }

    return response.job.code === 0 ? "success" : "failed";
  }

  private async request<T extends object>(
    endpoint: string,
    payload: Record<string, unknown>
  ): Promise<CronicleResponse<T>> {
    const response = await fetch(`${this.baseUrl}/api/app/${endpoint}/v1`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.options.apiKey,
      },
      body: JSON.stringify({ ...payload, api_key: this.options.apiKey }),
    });

    if (!response.ok) {
      throw new Error(`Falha de rede ao acessar Cronicle API: ${response.status}`);
    }

    return (await response.json()) as CronicleResponse<T>;
  }
}
