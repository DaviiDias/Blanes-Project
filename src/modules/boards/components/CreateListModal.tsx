import { FormEvent, useEffect, useState } from "react";

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => void;
}

export function CreateListModal({ isOpen, onClose, onCreate }: CreateListModalProps) {
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setTitle("");
  }, [isOpen]);

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

  if (!isOpen) {
    return null;
  }

  const canSubmit = title.trim().length >= 2;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    onCreate(title.trim());
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <article
        className="modal modal-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-list-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="create-list-title">Adicionar lista</h2>
          <button type="button" className="modal-close" aria-label="Fechar" onClick={onClose}>
            x
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="list-title">Nome da lista</label>
            <input
              id="list-title"
              name="list-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex.: Em validacao"
              autoFocus
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
              Adicionar
            </button>
          </div>
        </form>
      </article>
    </div>
  );
}
