import { FormEvent, useEffect, useMemo, useState } from "react";

import type { BoardCard, BoardCardPriority, UpdateCardInput } from "@/domain/boards/types";

interface CardDetailsModalProps {
  isOpen: boolean;
  card: BoardCard | null;
  onClose: () => void;
  onSave: (input: UpdateCardInput) => void;
  collaborators: string[];
  currentUser: string;
}

function toDateInputValue(isoDate?: string) {
  if (!isoDate) {
    return "";
  }

  const parsed = new Date(isoDate);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toIsoFromDateInput(value: string) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(`${value}T09:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
}

export function CardDetailsModal({
  isOpen,
  card,
  onClose,
  onSave,
  collaborators,
  currentUser,
}: CardDetailsModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [priority, setPriority] = useState<BoardCardPriority>("medium");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!isOpen || !card) {
      return;
    }

    setTitle(card.title);
    setDescription(card.description ?? "");
    setSelectedAssignee(Array.isArray(card.assignees) ? card.assignees[0] ?? "" : "");
    setPriority(card.priority);
    setStartDate(toDateInputValue(card.startDateISO));
    setEndDate(toDateInputValue(card.endDateISO));
  }, [isOpen, card, currentUser]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("keydown", onEscape);
    };
  }, [isOpen, onClose]);

  const hasValidDateRange = useMemo(() => {
    if (!startDate || !endDate) {
      return true;
    }

    return startDate <= endDate;
  }, [startDate, endDate]);

  if (!isOpen || !card) {
    return null;
  }

  const canSubmit = title.trim().length >= 2 && hasValidDateRange;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    onSave({
      cardId: card.id,
      title: title.trim(),
      description: description.trim() || undefined,
      createdBy: currentUser,
      assignees: selectedAssignee ? [selectedAssignee] : [],
      priority,
      startDateISO: toIsoFromDateInput(startDate),
      endDateISO: toIsoFromDateInput(endDate),
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <article
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="card-details-title">Detalhes do card</h2>
          <button type="button" className="modal-close" aria-label="Fechar" onClick={onClose}>
            x
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="card-title">Titulo</label>
            <input
              id="card-title"
              name="card-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              autoFocus
            />
          </div>

          <div className="field">
            <label htmlFor="card-description">Descricao</label>
            <textarea
              id="card-description"
              name="card-description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Detalhes tecnicos, criterio de aceite e observacoes"
            />
          </div>

          <div className="field">
            <label htmlFor="card-assignees">Atuando</label>
            <select
              id="card-assignees"
              name="card-assignees"
              value={selectedAssignee}
              onChange={(event) => setSelectedAssignee(event.target.value)}
            >
              <option value="">Selecione um colaborador</option>
              {collaborators.map((collaborator) => (
                <option key={collaborator} value={collaborator}>
                  {collaborator}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="card-priority">Prioridade</label>
            <select
              id="card-priority"
              name="card-priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value as BoardCardPriority)}
            >
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baixa</option>
            </select>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="card-start-date">Inicio</label>
              <input
                id="card-start-date"
                name="card-start-date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="card-end-date">Entrega</label>
              <input
                id="card-end-date"
                name="card-end-date"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>

          {!hasValidDateRange && (
            <p className="field-error">A data de inicio nao pode ser maior que a data de entrega.</p>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
              Salvar alteracoes
            </button>
          </div>
        </form>
      </article>
    </div>
  );
}
