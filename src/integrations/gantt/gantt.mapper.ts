import type {
  GanttDataset,
  GanttLinkData,
  GanttTaskData,
  KanbanTimelineCard,
} from "@/integrations/gantt/gantt.types";

const ROOT_PARENT_ID = 0;

function toGanttDate(dateISO: string) {
  const date = new Date(dateISO);

  if (Number.isNaN(date.getTime())) {
    return dateISO;
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function toIsoFromGanttDate(ganttDate: string) {
  const normalized = ganttDate.includes("T") ? ganttDate : ganttDate.replace(" ", "T");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

export function toGanttDataset(cards: KanbanTimelineCard[], links: GanttLinkData[] = []): GanttDataset {
  const data: GanttTaskData[] = cards.map((card) => ({
    id: card.id,
    text: card.title,
    description: card.description,
    created_by: card.createdBy,
    assignees: card.assignees,
    priority: card.priority,
    start_date: toGanttDate(card.startDateISO),
    end_date: toGanttDate(card.endDateISO),
    progress: card.progress ?? 0,
    parent: card.parentId ?? ROOT_PARENT_ID,
  }));

  return { data, links };
}

export function fromGanttTask(
  task: Pick<
    GanttTaskData,
    "id" | "text" | "description" | "created_by" | "assignees" | "priority" | "start_date" | "end_date" | "progress" | "parent"
  >
): KanbanTimelineCard {
  return {
    id: String(task.id),
    title: task.text,
    description: task.description,
    createdBy: task.created_by,
    assignees: task.assignees,
    priority: task.priority,
    startDateISO: toIsoFromGanttDate(task.start_date),
    endDateISO: toIsoFromGanttDate(task.end_date),
    progress: task.progress,
    parentId: task.parent,
  };
}
