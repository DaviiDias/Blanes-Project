import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { Link, useParams } from "react-router-dom";

import { useBoardsStore } from "@/domain/boards/store/useBoardsStore";
import { toGanttDataset } from "@/integrations/gantt/gantt.mapper";

import { CardDetailsModal } from "../components/CardDetailsModal";
import { CreateListModal } from "../components/CreateListModal";
import { FrappeGanttChart } from "../components/FrappeGanttChart";
import { KanbanListColumn } from "../components/KanbanListColumn";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const KANBAN_LIST_TITLE_MAX_LENGTH = 52;

function toUtcDayValue(dateISO: string) {
  const parsed = new Date(dateISO);

  if (Number.isNaN(parsed.getTime())) {
    return 0;
  }

  return Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
}

function formatSchedulerDate(dateISO: string) {
  const parsed = new Date(dateISO);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function formatSchedulerTime(dateISO: string) {
  const parsed = new Date(dateISO);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPriorityLabel(priority: "low" | "medium" | "high") {
  if (priority === "high") {
    return "Alta";
  }

  if (priority === "medium") {
    return "Media";
  }

  return "Baixa";
}

function getPriorityChannels(priority: "low" | "medium" | "high") {
  if (priority === "high") {
    return ["in-app", "webhook"] as const;
  }

  if (priority === "medium") {
    return ["in-app"] as const;
  }

  return ["in-app"] as const;
}

function toAssigneesLabel(assignees?: string[]) {
  if (!Array.isArray(assignees) || assignees.length === 0) {
    return "Nao definido";
  }

  return assignees.join(", ");
}

function toFrappeDate(dateISO: string) {
  const parsed = new Date(dateISO);

  if (Number.isNaN(parsed.getTime())) {
    return dateISO;
  }

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function deriveTimelineDates(card: {
  startDateISO?: string;
  endDateISO?: string;
  createdAt: string;
  order: number;
}) {
  const fallbackStart = new Date(card.createdAt);

  if (Number.isNaN(fallbackStart.getTime())) {
    return null;
  }

  const orderOffset = Number.isFinite(card.order) ? card.order : 0;
  fallbackStart.setUTCDate(fallbackStart.getUTCDate() + orderOffset * 2);

  const normalizedStart = card.startDateISO ?? card.endDateISO ?? fallbackStart.toISOString();
  const parsedStart = new Date(normalizedStart);

  if (Number.isNaN(parsedStart.getTime())) {
    return null;
  }

  const startValue = toUtcDayValue(parsedStart.toISOString()) || toUtcDayValue(fallbackStart.toISOString());
  const normalizedEnd = card.endDateISO ?? new Date(startValue + MS_PER_DAY).toISOString();
  const parsedEnd = new Date(normalizedEnd);

  if (Number.isNaN(parsedEnd.getTime())) {
    return null;
  }

  const endValue = Math.max(toUtcDayValue(parsedEnd.toISOString()), startValue);
  const safeEndValue = endValue === startValue ? startValue + MS_PER_DAY : endValue;

  return {
    startDateISO: new Date(startValue).toISOString(),
    endDateISO: new Date(safeEndValue).toISOString(),
    reminderDateISO: new Date(Math.max(startValue, safeEndValue - MS_PER_DAY)).toISOString(),
    durationDays: Math.max(1, Math.round((safeEndValue - startValue) / MS_PER_DAY) + 1),
  };
}

export function BoardPage() {
  const { boardId = "" } = useParams();
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
  const [isGanttModalOpen, setIsGanttModalOpen] = useState(false);
  const [isSchedulerModalOpen, setIsSchedulerModalOpen] = useState(false);
  const [isPayloadModalOpen, setIsPayloadModalOpen] = useState(false);
  const [draggingListId, setDraggingListId] = useState<string | null>(null);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [isBoardPanning, setIsBoardPanning] = useState(false);
  const [payloadFeedback, setPayloadFeedback] = useState("");
  const boardTitleInputRef = useRef<HTMLInputElement | null>(null);
  const boardScrollRef = useRef<HTMLDivElement | null>(null);
  const boardPanRef = useRef({
    active: false,
    pointerStartX: 0,
    startScrollLeft: 0,
  });

  const board = useBoardsStore((state) => state.getBoardById(boardId));
  const workspace = useBoardsStore((state) => state.workspace);
  const lists = useBoardsStore((state) =>
    state.lists
      .filter((list) => list.boardId === boardId)
      .sort((a, b) => a.order - b.order)
  );
  const cards = useBoardsStore((state) => state.cards);
  const createList = useBoardsStore((state) => state.createList);
  const updateListTitle = useBoardsStore((state) => state.updateListTitle);
  const moveListBefore = useBoardsStore((state) => state.moveListBefore);
  const createCard = useBoardsStore((state) => state.createCard);
  const updateBoardTitle = useBoardsStore((state) => state.updateBoardTitle);
  const moveCardToList = useBoardsStore((state) => state.moveCardToList);
  const updateCard = useBoardsStore((state) => state.updateCard);
  const toggleCardCompletion = useBoardsStore((state) => state.toggleCardCompletion);

  const resolvedBoardId = board?.id ?? boardId;

  const cardsByListId = useMemo(() => {
    const grouped: Record<string, typeof cards> = {};

    cards
      .filter((card) => card.boardId === resolvedBoardId)
      .forEach((card) => {
        if (!grouped[card.listId]) {
          grouped[card.listId] = [];
        }

        grouped[card.listId].push(card);
      });

    Object.values(grouped).forEach((group) => {
      group.sort((a, b) => {
        const orderA = typeof a.order === "number" && Number.isFinite(a.order) ? a.order : 0;
        const orderB = typeof b.order === "number" && Number.isFinite(b.order) ? b.order : 0;
        return orderA - orderB || a.createdAt.localeCompare(b.createdAt);
      });
    });

    return grouped;
  }, [resolvedBoardId, cards]);

  const activeCard = useMemo(
    () => cards.find((card) => card.id === activeCardId && card.boardId === resolvedBoardId) ?? null,
    [activeCardId, resolvedBoardId, cards]
  );

  const timelineCards = useMemo(
    () =>
      cards
        .filter((card) => card.boardId === resolvedBoardId)
        .map((card) => {
          const derivedDates = deriveTimelineDates(card);

          if (!derivedDates) {
            return null;
          }

          return {
            id: card.id,
            title: card.title,
            description: card.description,
            createdBy: card.createdBy,
            assignees: card.assignees,
            priority: card.priority,
            completed: card.completed,
            startDateISO: derivedDates.startDateISO,
            endDateISO: derivedDates.endDateISO,
            progress: card.completed ? 1 : 0,
          };
        })
        .filter((card): card is NonNullable<typeof card> => Boolean(card)),
    [resolvedBoardId, cards]
  );

  const ganttPreview = useMemo(() => toGanttDataset(timelineCards), [timelineCards]);
  const payloadJson = useMemo(() => JSON.stringify(ganttPreview, null, 2), [ganttPreview]);

  const payloadSummary = useMemo(() => {
    const startDates = timelineCards
      .map((card) => new Date(card.startDateISO).getTime())
      .filter((value) => Number.isFinite(value));
    const endDates = timelineCards
      .map((card) => new Date(card.endDateISO).getTime())
      .filter((value) => Number.isFinite(value));

    const firstStart = startDates.length > 0 ? new Date(Math.min(...startDates)) : null;
    const lastEnd = endDates.length > 0 ? new Date(Math.max(...endDates)) : null;

    return {
      cards: ganttPreview.data.length,
      links: ganttPreview.links.length,
      openCards: timelineCards.filter((card) => !card.completed).length,
      completedCards: timelineCards.filter((card) => card.completed).length,
      firstStart: firstStart ? firstStart.toLocaleDateString("pt-BR") : "-",
      lastEnd: lastEnd ? lastEnd.toLocaleDateString("pt-BR") : "-",
    };
  }, [ganttPreview.data.length, ganttPreview.links.length, timelineCards]);

  const boardPageStyle = useMemo(
    () =>
      ({
        "--board-tone": board?.color ?? "#1d4ed8",
      }) as CSSProperties,
    [board?.color]
  );

  const frappeTasks = useMemo(
    () =>
      timelineCards.map((card) => ({
        id: card.id,
        name: card.title,
        start: toFrappeDate(card.startDateISO),
        end: toFrappeDate(card.endDateISO),
        progress: Math.round((card.progress ?? 0) * 100),
        description: card.description,
        createdBy: card.createdBy,
        assignees: card.assignees,
        priority: card.priority,
      })),
    [timelineCards]
  );

  const schedulerEvents = useMemo(
    () =>
      cards
        .filter((card) => card.boardId === resolvedBoardId)
        .map((card) => {
          const derivedDates = deriveTimelineDates(card);

          if (!derivedDates) {
            return null;
          }

          return {
            id: card.id,
            title: card.title,
            createdBy: card.createdBy,
            assignees: card.assignees,
            priority: card.priority,
            deliveryDateISO: derivedDates.endDateISO,
            reminderDateISO: derivedDates.reminderDateISO,
            channels: getPriorityChannels(card.priority),
            description: card.description,
          };
        })
        .filter((event): event is NonNullable<typeof event> => Boolean(event)),
      [cards, resolvedBoardId]
  );

  useEffect(() => {
    if (!board) {
      return;
    }

    setDraftTitle(board.title);
  }, [board]);

  useEffect(() => {
    if (!isTitleEditing) {
      return;
    }

    boardTitleInputRef.current?.focus();
    boardTitleInputRef.current?.select();
  }, [isTitleEditing]);

  useEffect(() => {
    if (!isBoardPanning) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!boardPanRef.current.active || !boardScrollRef.current) {
        return;
      }

      const deltaX = event.clientX - boardPanRef.current.pointerStartX;
      boardScrollRef.current.scrollLeft = boardPanRef.current.startScrollLeft - deltaX;
    };

    const stopPanning = () => {
      boardPanRef.current.active = false;
      setIsBoardPanning(false);
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopPanning);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopPanning);
      document.body.style.userSelect = "";
    };
  }, [isBoardPanning]);

  if (!board) {
    return (
      <section className="board-page">
        <div className="board-placeholder">
          <h2>Quadro nao encontrado</h2>
          <p>
            O quadro solicitado nao existe neste workspace. Volte para a pagina de
            <Link to="/" className="inline-link">
              {" "}
              Quadros
            </Link>
            .
          </p>
        </div>
      </section>
    );
  }

  const handleCreateList = (title: string) => {
    createList({
      boardId: board.id,
      title,
    });
  };

  const commitBoardTitle = () => {
    const nextTitle = draftTitle.trim();

    if (nextTitle.length >= 2 && nextTitle !== board.title) {
      updateBoardTitle(board.id, nextTitle);
    }

    setDraftTitle(nextTitle.length >= 2 ? nextTitle : board.title);
    setIsTitleEditing(false);
  };

  const handleCreateCard = (listId: string, title: string) => {
    createCard({
      boardId: board.id,
      listId,
      title,
    });
  };

  const handleCardDrop = (targetListId: string) => {
    if (!draggingCardId) {
      return;
    }

    moveCardToList(draggingCardId, targetListId);
    setDraggingCardId(null);
  };

  const handleListDrop = (targetListId: string) => {
    if (!draggingListId) {
      return;
    }

    moveListBefore(board.id, draggingListId, targetListId);
    setDraggingListId(null);
  };

  const handleBoardMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !boardScrollRef.current) {
      return;
    }

    const target = event.target as HTMLElement;
    const isInteractive = Boolean(
      target.closest(
        "button, input, textarea, select, a, label, .kanban-card, .kanban-list, .kanban-add-list-tile"
      )
    );

    if (isInteractive) {
      return;
    }

    boardPanRef.current = {
      active: true,
      pointerStartX: event.clientX,
      startScrollLeft: boardScrollRef.current.scrollLeft,
    };

    setIsBoardPanning(true);
    document.body.style.userSelect = "none";
  };

  const handleCopyPayload = async () => {
    try {
      await navigator.clipboard.writeText(payloadJson);
      setPayloadFeedback("Payload copiado para a area de transferencia.");
    } catch {
      setPayloadFeedback("Nao foi possivel copiar automaticamente. Use a selecao manual.");
    }
  };

  const handleDownloadPayload = () => {
    const blob = new Blob([payloadJson], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `payload-tecnico-${board.id}.json`;
    link.click();

    URL.revokeObjectURL(url);
    setPayloadFeedback("Arquivo JSON baixado.");
  };

  return (
    <section className="board-page board-page--tinted" style={boardPageStyle}>
      <header className="board-context-header" aria-label="Cabecalho do quadro">
        <div className="board-context-header__left">
          <p className="workspace-kicker">Quadro Kanban</p>

          {isTitleEditing ? (
            <input
              ref={boardTitleInputRef}
              className="board-title-input"
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              onBlur={commitBoardTitle}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitBoardTitle();
                }

                if (event.key === "Escape") {
                  setDraftTitle(board.title);
                  setIsTitleEditing(false);
                }
              }}
              aria-label="Nome do quadro"
            />
          ) : (
            <button
              type="button"
              className="board-title-button"
              onClick={() => setIsTitleEditing(true)}
            >
              {board.title}
            </button>
          )}
        </div>

        <div className="board-context-header__actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsCreateListModalOpen(true)}
          >
            Adicionar outra lista
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsGanttModalOpen(true)}
          >
            Grafico de Gantt
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsSchedulerModalOpen(true)}
          >
            Scheduler
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsPayloadModalOpen(true)}
          >
            Payload tecnico
          </button>
        </div>
      </header>

      {lists.length === 0 ? (
        <article className="board-placeholder">
          <h2>Este quadro ainda nao possui listas</h2>
          <p>Crie a primeira lista para iniciar o fluxo de cards e acompanhamento da sprint.</p>
          <div className="board-placeholder-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsCreateListModalOpen(true)}
            >
              Adicionar primeira lista
            </button>
          </div>
        </article>
      ) : (
        <div
          ref={boardScrollRef}
          className={`kanban-board${isBoardPanning ? " is-drag-scrolling" : ""}`}
          role="list"
          aria-label="Listas do quadro"
          onMouseDown={handleBoardMouseDown}
        >
          {lists.map((list) => (
            <KanbanListColumn
              key={list.id}
              list={list}
              cards={cardsByListId[list.id] ?? []}
              listTitleMaxLength={KANBAN_LIST_TITLE_MAX_LENGTH}
              onUpdateListTitle={updateListTitle}
              onCreateCard={handleCreateCard}
              onToggleCard={toggleCardCompletion}
              onOpenCardDetails={setActiveCardId}
              onListDragStart={setDraggingListId}
              onListDragEnd={() => setDraggingListId(null)}
              onListDrop={handleListDrop}
              draggingListId={draggingListId}
              onCardDragStart={setDraggingCardId}
              onCardDragEnd={() => setDraggingCardId(null)}
              onCardDrop={handleCardDrop}
              draggingCardId={draggingCardId}
            />
          ))}

          <button
            type="button"
            className="kanban-add-list-tile"
            onClick={() => setIsCreateListModalOpen(true)}
          >
            + Adicionar outra lista
          </button>
        </div>
      )}

      <CreateListModal
        isOpen={isCreateListModalOpen}
        onClose={() => setIsCreateListModalOpen(false)}
        onCreate={handleCreateList}
      />

      {isGanttModalOpen && (
        <div className="modal-overlay" onClick={() => setIsGanttModalOpen(false)}>
          <article className="modal modal-xl" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header className="modal-header">
              <h2>Grafico de Gantt</h2>
              <button type="button" className="modal-close" aria-label="Fechar" onClick={() => setIsGanttModalOpen(false)}>
                x
              </button>
            </header>

            <article className="gantt-panel">
              <div className="panel-header">
                <h3>Timeline Gantt</h3>
                <span>{frappeTasks.length} tasks</span>
              </div>

              <FrappeGanttChart tasks={frappeTasks} />
            </article>
          </article>
        </div>
      )}

      {isSchedulerModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSchedulerModalOpen(false)}>
          <article className="modal modal-xl" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header className="modal-header">
              <h2>Scheduler</h2>
              <button
                type="button"
                className="modal-close"
                aria-label="Fechar"
                onClick={() => setIsSchedulerModalOpen(false)}
              >
                x
              </button>
            </header>

            <article className="scheduler-panel">
              <div className="panel-header">
                <h3>Fila do Scheduler</h3>
                <span>{schedulerEvents.length} eventos</span>
              </div>

              {schedulerEvents.length > 0 ? (
                <div className="scheduler-list">
                  {schedulerEvents.map((event) => (
                    <article key={event.id} className="scheduler-event">
                      <div className="scheduler-event-top">
                        <strong className="scheduler-event-title">{event.title}</strong>
                        <span className="scheduler-chip">Cronicle</span>
                      </div>

                      <div className="scheduler-event-meta">
                        <span>
                          Entrega {formatSchedulerDate(event.deliveryDateISO)} {formatSchedulerTime(event.deliveryDateISO)}
                        </span>
                        <span>
                          Alerta {formatSchedulerDate(event.reminderDateISO)} {formatSchedulerTime(event.reminderDateISO)}
                        </span>
                        <span>Prioridade {getPriorityLabel(event.priority)}</span>
                        <span>Criado por {event.createdBy?.trim() || "Nao definido"}</span>
                        <span>Atuando {toAssigneesLabel(event.assignees)}</span>
                      </div>

                      <div className="scheduler-event-chips">
                        {event.channels.map((channel) => (
                          <span key={channel} className="scheduler-chip scheduler-chip-soft">
                            {channel}
                          </span>
                        ))}
                      </div>

                      {event.description && <p className="scheduler-event-description">{event.description}</p>}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="scheduler-empty">Nenhum evento disponivel para Scheduler.</p>
              )}
            </article>
          </article>
        </div>
      )}

      {isPayloadModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPayloadModalOpen(false)}>
          <article className="modal modal-xl" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header className="modal-header">
              <div>
                <h2>Payload tecnico</h2>
                <p className="modal-subtitle">Exportacao tecnica do dataset do quadro para integracoes e testes.</p>
              </div>
              <div className="payload-header-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCopyPayload}>
                  Copiar JSON
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleDownloadPayload}>
                  Baixar JSON
                </button>
                <button
                  type="button"
                  className="modal-close"
                  aria-label="Fechar"
                  onClick={() => setIsPayloadModalOpen(false)}
                >
                  x
                </button>
              </div>
            </header>

            <div className="payload-summary-grid">
              <article className="payload-summary-card">
                <span>Tasks</span>
                <strong>{payloadSummary.cards}</strong>
              </article>
              <article className="payload-summary-card">
                <span>Links</span>
                <strong>{payloadSummary.links}</strong>
              </article>
              <article className="payload-summary-card">
                <span>Em aberto</span>
                <strong>{payloadSummary.openCards}</strong>
              </article>
              <article className="payload-summary-card">
                <span>Concluidas</span>
                <strong>{payloadSummary.completedCards}</strong>
              </article>
              <article className="payload-summary-card">
                <span>Inicio</span>
                <strong>{payloadSummary.firstStart}</strong>
              </article>
              <article className="payload-summary-card">
                <span>Entrega final</span>
                <strong>{payloadSummary.lastEnd}</strong>
              </article>
            </div>

            {payloadFeedback && <p className="payload-feedback">{payloadFeedback}</p>}

            <pre className="payload-preview">{payloadJson}</pre>
          </article>
        </div>
      )}

      <CardDetailsModal
        isOpen={Boolean(activeCard)}
        card={activeCard}
        onClose={() => setActiveCardId(null)}
        onSave={updateCard}
        currentUser={workspace.currentUser}
        collaborators={workspace.collaborators}
      />
    </section>
  );
}
