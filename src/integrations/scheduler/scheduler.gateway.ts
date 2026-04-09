export type NotificationChannel = "email" | "in-app" | "webhook";

export interface CardScheduleRequest {
  cardId: string;
  boardId: string;
  title: string;
  description?: string;
  deliveryDateISO: string;
  reminderDateISO?: string;
  channels: NotificationChannel[];
}

export interface ScheduledEventRef {
  provider: "cronicle";
  eventId: string;
  latestJobIds?: string[];
}

export type SchedulerJobStatus = "queued" | "running" | "success" | "failed";

export interface SchedulerGateway {
  upsertCardDeadlineEvent(input: CardScheduleRequest): Promise<ScheduledEventRef>;
  runEventNow(eventId: string): Promise<string[]>;
  getJobStatus(jobId: string): Promise<SchedulerJobStatus>;
}
