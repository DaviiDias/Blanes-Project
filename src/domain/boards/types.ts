export interface Workspace {
  id: string;
  name: string;
  currentUser: string;
  collaborators: string[];
}

export interface Board {
  id: string;
  title: string;
  color: string;
  workspaceId: string;
  createdAt: string;
}

export interface CreateBoardInput {
  title: string;
  color: string;
  workspaceId: string;
}

export interface BoardList {
  id: string;
  boardId: string;
  title: string;
  order: number;
  createdAt: string;
}

export interface CreateListInput {
  boardId: string;
  title: string;
}

export type BoardCardPriority = "low" | "medium" | "high";

export interface BoardCard {
  id: string;
  boardId: string;
  listId: string;
  title: string;
  description?: string;
  createdBy?: string;
  assignees: string[];
  priority: BoardCardPriority;
  completed: boolean;
  order: number;
  startDateISO?: string;
  endDateISO?: string;
  createdAt: string;
}

export interface CreateCardInput {
  boardId: string;
  listId: string;
  title: string;
  description?: string;
  createdBy?: string;
  assignees?: string[];
  priority?: BoardCardPriority;
  startDateISO?: string;
  endDateISO?: string;
}

export interface UpdateCardInput {
  cardId: string;
  title: string;
  description?: string;
  createdBy?: string;
  assignees?: string[];
  priority: BoardCardPriority;
  startDateISO?: string;
  endDateISO?: string;
}
