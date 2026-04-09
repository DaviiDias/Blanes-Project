import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  Board,
  BoardCard,
  BoardList,
  CreateBoardInput,
  CreateCardInput,
  CreateListInput,
  UpdateCardInput,
  Workspace,
} from "@/domain/boards/types";

interface BoardsState {
  workspace: Workspace;
  boards: Board[];
  lists: BoardList[];
  cards: BoardCard[];
  createBoard: (input: Omit<CreateBoardInput, "workspaceId"> & { workspaceId?: string }) => Board;
  updateBoardTitle: (boardId: string, title: string) => void;
  getBoardById: (boardId: string) => Board | undefined;
  getListsByBoardId: (boardId: string) => BoardList[];
  getCardsByListId: (listId: string) => BoardCard[];
  createList: (input: CreateListInput) => BoardList;
  updateListTitle: (listId: string, title: string) => void;
  moveListBefore: (boardId: string, draggingListId: string, targetListId: string) => void;
  createCard: (input: CreateCardInput) => BoardCard;
  moveCardToList: (cardId: string, targetListId: string) => void;
  updateCard: (input: UpdateCardInput) => void;
  toggleCardCompletion: (cardId: string) => void;
}

const DEFAULT_WORKSPACE: Workspace = {
  id: "workspace-main",
  name: "Area de trabalho Blanes",
  currentUser: "Chewie",
  collaborators: ["Chewie", "Aline", "Thiago", "Mariana"],
};

const seedBoards: Board[] = [
  {
    id: "board-product-roadmap",
    title: "Roadmap do Produto",
    color: "#2f8f74",
    workspaceId: DEFAULT_WORKSPACE.id,
    createdAt: new Date().toISOString(),
  },
  {
    id: "board-sprint-planning",
    title: "Planejamento Sprint 24",
    color: "#2f6fe4",
    workspaceId: DEFAULT_WORKSPACE.id,
    createdAt: new Date().toISOString(),
  },
  {
    id: "board-tech-debt",
    title: "Debitos Tecnicos",
    color: "#ca7b1f",
    workspaceId: DEFAULT_WORKSPACE.id,
    createdAt: new Date().toISOString(),
  },
];

const seedLists: BoardList[] = [
  {
    id: "list-backlog",
    boardId: "board-product-roadmap",
    title: "Backlog",
    order: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "list-refinement",
    boardId: "board-product-roadmap",
    title: "Refinamento",
    order: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: "list-doing",
    boardId: "board-product-roadmap",
    title: "Em andamento",
    order: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: "list-sprint-backlog",
    boardId: "board-sprint-planning",
    title: "Sprint backlog",
    order: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "list-sprint-progress",
    boardId: "board-sprint-planning",
    title: "Executando",
    order: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: "list-debt-priority",
    boardId: "board-tech-debt",
    title: "Prioridade alta",
    order: 0,
    createdAt: new Date().toISOString(),
  },
];

const seedCards: BoardCard[] = [
  {
    id: "card-prd-notifications",
    boardId: "board-product-roadmap",
    listId: "list-backlog",
    title: "Definir PRD de notificacoes de entrega",
    description: "Consolidar escopo, metricas e impactos para o fluxo de notificacoes.",
    createdBy: "Chewie",
    assignees: ["Chewie", "Aline"],
    priority: "high",
    completed: false,
    order: 0,
    startDateISO: new Date().toISOString(),
    endDateISO: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "card-api-contract",
    boardId: "board-product-roadmap",
    listId: "list-refinement",
    title: "Aprovar contrato frontend para scheduler",
    createdBy: "Aline",
    assignees: ["Aline"],
    priority: "medium",
    completed: false,
    order: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "card-kanban-columns",
    boardId: "board-product-roadmap",
    listId: "list-doing",
    title: "Implementar fluxo de colunas dinamicas",
    createdBy: "Chewie",
    assignees: ["Chewie", "Thiago"],
    priority: "low",
    completed: true,
    order: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "card-sprint-goal",
    boardId: "board-sprint-planning",
    listId: "list-sprint-backlog",
    title: "Definir objetivo da sprint e criterios",
    createdBy: "Thiago",
    assignees: ["Thiago"],
    priority: "high",
    completed: false,
    order: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "card-types-cleanup",
    boardId: "board-tech-debt",
    listId: "list-debt-priority",
    title: "Padronizar tipos compartilhados do dominio",
    createdBy: "Aline",
    assignees: ["Aline", "Chewie"],
    priority: "medium",
    completed: false,
    order: 0,
    createdAt: new Date().toISOString(),
  },
];

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getCardOrder(card: Pick<BoardCard, "order">) {
  if (typeof card.order === "number" && Number.isFinite(card.order)) {
    return card.order;
  }

  return 0;
}

export const useBoardsStore = create<BoardsState>()(
  persist(
    (set, get) => ({
      workspace: DEFAULT_WORKSPACE,
      boards: seedBoards,
      lists: seedLists,
      cards: seedCards,
      createBoard: (input) => {
        const nextBoard: Board = {
          id: createId("board"),
          title: input.title.trim(),
          color: input.color,
          workspaceId: input.workspaceId ?? get().workspace.id,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          boards: [nextBoard, ...state.boards],
        }));

        return nextBoard;
      },
      updateBoardTitle: (boardId, title) => {
        const nextTitle = title.trim();

        if (nextTitle.length < 2) {
          return;
        }

        set((state) => ({
          boards: state.boards.map((board) =>
            board.id === boardId
              ? {
                  ...board,
                  title: nextTitle,
                }
              : board
          ),
        }));
      },
      getBoardById: (boardId) => get().boards.find((board) => board.id === boardId),
      getListsByBoardId: (boardId) =>
        get()
          .lists.filter((list) => list.boardId === boardId)
          .sort((a, b) => a.order - b.order),
      getCardsByListId: (listId) =>
        get()
          .cards.filter((card) => card.listId === listId)
          .sort((a, b) => getCardOrder(a) - getCardOrder(b) || a.createdAt.localeCompare(b.createdAt)),
      createList: (input) => {
        const title = input.title.trim();

        const maxOrder = get()
          .lists.filter((list) => list.boardId === input.boardId)
          .reduce((max, list) => Math.max(max, list.order), -1);

        const nextList: BoardList = {
          id: createId("list"),
          boardId: input.boardId,
          title,
          order: maxOrder + 1,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          lists: [...state.lists, nextList],
        }));

        return nextList;
      },
      updateListTitle: (listId, title) => {
        const nextTitle = title.trim();

        if (nextTitle.length < 2) {
          return;
        }

        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === listId
              ? {
                  ...list,
                  title: nextTitle,
                }
              : list
          ),
        }));
      },
      moveListBefore: (boardId, draggingListId, targetListId) => {
        if (draggingListId === targetListId) {
          return;
        }

        set((state) => {
          const boardLists = state.lists
            .filter((list) => list.boardId === boardId)
            .sort((a, b) => a.order - b.order);

          const draggingIndex = boardLists.findIndex((list) => list.id === draggingListId);
          const targetIndex = boardLists.findIndex((list) => list.id === targetListId);

          if (draggingIndex < 0 || targetIndex < 0) {
            return state;
          }

          const reordered = [...boardLists];
          const [draggingList] = reordered.splice(draggingIndex, 1);
          reordered.splice(targetIndex, 0, draggingList);

          const nextOrderMap = new Map(reordered.map((list, index) => [list.id, index]));

          return {
            lists: state.lists.map((list) => {
              const nextOrder = nextOrderMap.get(list.id);

              if (nextOrder === undefined) {
                return list;
              }

              return {
                ...list,
                order: nextOrder,
              };
            }),
          };
        });
      },
      createCard: (input) => {
        const maxOrder = get()
          .cards.filter((card) => card.listId === input.listId)
          .reduce((max, card) => Math.max(max, getCardOrder(card)), -1);

        const nextCard: BoardCard = {
          id: createId("card"),
          boardId: input.boardId,
          listId: input.listId,
          title: input.title.trim(),
          description: input.description?.trim() || undefined,
          createdBy: input.createdBy?.trim() || get().workspace.currentUser,
          assignees: Array.isArray(input.assignees)
            ? input.assignees.map((name) => name.trim()).filter(Boolean)
            : [],
          priority: input.priority ?? "medium",
          completed: false,
          order: maxOrder + 1,
          startDateISO: input.startDateISO,
          endDateISO: input.endDateISO,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          cards: [...state.cards, nextCard],
        }));

        return nextCard;
      },
      moveCardToList: (cardId, targetListId) => {
        const cardToMove = get().cards.find((card) => card.id === cardId);

        if (!cardToMove || cardToMove.listId === targetListId) {
          return;
        }

        const nextOrder =
          get()
            .cards.filter((card) => card.listId === targetListId)
            .reduce((max, card) => Math.max(max, getCardOrder(card)), -1) + 1;

        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === cardId
              ? {
                  ...card,
                  listId: targetListId,
                  order: nextOrder,
                }
              : card
          ),
        }));
      },
      updateCard: (input) => {
        const cleanTitle = input.title.trim();
        const cleanDescription = input.description?.trim();

        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === input.cardId
              ? {
                  ...card,
                  title: cleanTitle,
                  description: cleanDescription || undefined,
                  createdBy: input.createdBy?.trim() || card.createdBy || get().workspace.currentUser,
                  assignees: Array.isArray(input.assignees)
                    ? input.assignees.map((name) => name.trim()).filter(Boolean)
                    : [],
                  priority: input.priority,
                  startDateISO: input.startDateISO,
                  endDateISO: input.endDateISO,
                }
              : card
          ),
        }));
      },
      toggleCardCompletion: (cardId) => {
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === cardId
              ? {
                  ...card,
                  completed: !card.completed,
                }
              : card
          ),
        }));
      },
    }),
    {
      name: "blanes-suite.boards",
      version: 3,
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== "object") {
          return persistedState as BoardsState;
        }

        const rawState = persistedState as Partial<BoardsState>;
        const migratedCards = Array.isArray(rawState.cards)
          ? rawState.cards.map((card, index) => ({
              ...card,
              description: card.description ?? undefined,
              createdBy: typeof card.createdBy === "string" ? card.createdBy : undefined,
              assignees: Array.isArray(card.assignees)
                ? card.assignees.map((name) => String(name).trim()).filter(Boolean)
                : [],
              priority: card.priority ?? "medium",
              order: typeof card.order === "number" && Number.isFinite(card.order) ? card.order : index,
            }))
          : [];

        return {
          ...rawState,
          workspace: {
            ...DEFAULT_WORKSPACE,
            ...(rawState.workspace as Workspace | undefined),
            collaborators:
              Array.isArray(rawState.workspace?.collaborators) && rawState.workspace.collaborators.length
                ? Array.from(new Set(rawState.workspace.collaborators.map((name) => String(name).trim()).filter(Boolean)))
                : DEFAULT_WORKSPACE.collaborators,
            currentUser:
              typeof rawState.workspace?.currentUser === "string" && rawState.workspace.currentUser.trim()
                ? rawState.workspace.currentUser.trim()
                : DEFAULT_WORKSPACE.currentUser,
          },
          cards: migratedCards,
        } as BoardsState;
      },
      partialize: (state) => ({
        boards: state.boards,
        lists: state.lists,
        cards: state.cards,
      }),
    }
  )
);
