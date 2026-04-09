export interface KanbanTimelineCard {
  id: string;
  title: string;
  description?: string;
  createdBy?: string;
  assignees?: string[];
  priority?: "low" | "medium" | "high";
  startDateISO: string;
  endDateISO: string;
  progress?: number;
  parentId?: string | number;
}

export interface GanttTaskData {
  id: string | number;
  text: string;
  description?: string;
  created_by?: string;
  assignees?: string[];
  priority?: "low" | "medium" | "high";
  start_date: string;
  end_date: string;
  progress: number;
  parent: string | number;
}

export interface GanttLinkData {
  id: string | number;
  source: string | number;
  target: string | number;
  type: "0" | "1" | "2" | "3";
}

export interface GanttDataset {
  data: GanttTaskData[];
  links: GanttLinkData[];
}
