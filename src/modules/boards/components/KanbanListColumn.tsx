import { FormEvent, useEffect, useRef, useState } from "react";

import type { BoardCard, BoardList } from "@/domain/boards/types";

interface KanbanListColumnProps {
  list: BoardList;
  cards: BoardCard[];
  listTitleMaxLength: number;
  onUpdateListTitle: (listId: string, title: string) => void;
  onCreateCard: (listId: string, title: string) => void;
  onToggleCard: (cardId: string) => void;
  onOpenCardDetails: (cardId: string) => void;
  onListDragStart: (listId: string) => void;
  onListDragEnd: () => void;
  onListDrop: (targetListId: string) => void;
  draggingListId: string | null;
  onCardDragStart: (cardId: string) => void;
  onCardDragEnd: () => void;
  onCardDrop: (listId: string) => void;
  draggingCardId: string | null;
}

const priorityLabel: Record<BoardCard["priority"], string> = {
  high: "Alta",
  medium: "Media",
  low: "Baixa",
};

const KANBAN_MAX_VISIBLE_CARDS = 6;

function formatDate(isoDate?: string) {
  if (!isoDate) {
    return "";
  }

  const parsed = new Date(isoDate);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleDateString("pt-BR");
}

export function KanbanListColumn({
  list,
  cards,
  listTitleMaxLength,
  onUpdateListTitle,
  onCreateCard,
  onToggleCard,
  onOpenCardDetails,
  onListDragStart,
  onListDragEnd,
  onListDrop,
  draggingListId,
  onCardDragStart,
  onCardDragEnd,
  onCardDrop,
  draggingCardId,
}: KanbanListColumnProps) {
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [draftListTitle, setDraftListTitle] = useState(list.title);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [cardTitle, setCardTitle] = useState("");
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [isListDropTarget, setIsListDropTarget] = useState(false);
  const composerRef = useRef<HTMLFormElement | null>(null);
  const composerInputRef = useRef<HTMLInputElement | null>(null);
  const listTitleInputRef = useRef<HTMLInputElement | null>(null);

  const canCreateCard = cardTitle.trim().length >= 2;

  useEffect(() => {
    setDraftListTitle(list.title);
  }, [list.title]);

  useEffect(() => {
    if (!isTitleEditing) {
      return;
    }

    listTitleInputRef.current?.focus();
    listTitleInputRef.current?.select();
  }, [isTitleEditing]);

  useEffect(() => {
    if (!isComposerOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;

      if (!target) {
        return;
      }

      if (composerRef.current?.contains(target)) {
        return;
      }

      setIsComposerOpen(false);
      setCardTitle("");
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isComposerOpen]);

  const handleCreateCard = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canCreateCard) {
      return;
    }

    onCreateCard(list.id, cardTitle.trim());
    setCardTitle("");
    composerInputRef.current?.focus();
  };

  const handleDrop = () => {
    setIsDropTarget(false);
    onCardDrop(list.id);
  };

  const commitListTitle = () => {
    const nextTitle = draftListTitle.trim();

    if (nextTitle.length >= 2 && nextTitle !== list.title) {
      onUpdateListTitle(list.id, nextTitle);
    }

    setDraftListTitle(nextTitle.length >= 2 ? nextTitle : list.title);
    setIsTitleEditing(false);
  };

  return (
    <section
      className={`kanban-list${isDropTarget ? " is-drop-target" : ""}${
        isListDropTarget ? " is-list-drop-target" : ""
      }${draggingListId === list.id ? " is-list-dragging" : ""}`}
      aria-label={list.title}
      draggable
      onDragStart={(event) => {
        const target = event.target as HTMLElement;

        if (target.closest(".kanban-card") || target.closest("button, input, textarea, select")) {
          event.preventDefault();
          return;
        }

        onListDragStart(list.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={() => {
        setIsListDropTarget(false);
        onListDragEnd();
      }}
      onDragOver={(event) => {
        if (draggingListId) {
          event.preventDefault();
          setIsListDropTarget(draggingListId !== list.id);
          return;
        }

        event.preventDefault();
        setIsDropTarget(true);
      }}
      onDragLeave={() => {
        setIsDropTarget(false);
        setIsListDropTarget(false);
      }}
      onDrop={(event) => {
        event.preventDefault();

        if (draggingListId) {
          setIsListDropTarget(false);
          onListDrop(list.id);
          return;
        }

        handleDrop();
      }}
    >
      <header className="kanban-list-header">
        {isTitleEditing ? (
          <input
            ref={listTitleInputRef}
            className="kanban-list-title-input"
            value={draftListTitle}
            maxLength={listTitleMaxLength}
            onChange={(event) => setDraftListTitle(event.target.value)}
            onBlur={commitListTitle}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitListTitle();
              }

              if (event.key === "Escape") {
                setDraftListTitle(list.title);
                setIsTitleEditing(false);
              }
            }}
            aria-label="Nome da lista"
          />
        ) : (
          <button
            type="button"
            className="kanban-list-title-button"
            onClick={(event) => {
              event.stopPropagation();
              setIsTitleEditing(true);
            }}
            title="Clique para editar o nome da lista"
          >
            {list.title}
          </button>
        )}
        <span>{cards.length}</span>
      </header>

      <div
        className={`kanban-cards${cards.length > KANBAN_MAX_VISIBLE_CARDS ? " is-scrollable" : ""}`}
      >
        {cards.length === 0 && <p className="kanban-empty">Nenhum card nesta lista.</p>}

        {cards.map((card) => (
          <article
            key={card.id}
            className={`kanban-card${card.completed ? " is-completed" : ""}${
              draggingCardId === card.id ? " is-dragging" : ""
            }`}
            aria-label={card.title}
            role="button"
            tabIndex={0}
            draggable
            onClick={() => onOpenCardDetails(card.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpenCardDetails(card.id);
              }
            }}
            onDragStart={() => onCardDragStart(card.id)}
            onDragEnd={() => {
              setIsDropTarget(false);
              onCardDragEnd();
            }}
          >
            <div className="kanban-card-top">
              <input
                type="checkbox"
                className="kanban-card-checkbox"
                checked={card.completed}
                onChange={(event) => {
                  event.stopPropagation();
                  onToggleCard(card.id);
                }}
                onClick={(event) => event.stopPropagation()}
                aria-label={`Concluir card ${card.title}`}
              />

              <span className="kanban-card-title">{card.title}</span>
            </div>

            <div className="kanban-card-meta">
              <span className={`kanban-priority kanban-priority-${card.priority}`}>
                {priorityLabel[card.priority]}
              </span>

              {card.endDateISO && <span className="kanban-card-date">Entrega {formatDate(card.endDateISO)}</span>}
            </div>
          </article>
        ))}
      </div>

      {isComposerOpen ? (
        <form className="kanban-composer" onSubmit={handleCreateCard} ref={composerRef}>
          <input
            ref={composerInputRef}
            value={cardTitle}
            onChange={(event) => setCardTitle(event.target.value)}
            placeholder="Titulo do card"
            autoFocus
          />
          <div className="kanban-composer-actions">
            <button type="submit" className="btn btn-primary" disabled={!canCreateCard}>
              Adicionar Cartao
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsComposerOpen(false);
                setCardTitle("");
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="kanban-add-card" onClick={() => setIsComposerOpen(true)}>
          + Adicionar cartao
        </button>
      )}
    </section>
  );
}
