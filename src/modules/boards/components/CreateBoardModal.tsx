import { FormEvent, useEffect, useState } from "react";

import { boardPalette } from "@/modules/boards/constants/boardPalette";

interface CreateBoardModalProps {
  isOpen: boolean;
  workspaceName: string;
  onCreate: (payload: { title: string; color: string }) => void;
  onClose: () => void;
}

const defaultColor = boardPalette[0]?.value ?? "#2f8f74";

export function CreateBoardModal({
  isOpen,
  workspaceName,
  onCreate,
  onClose,
}: CreateBoardModalProps) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(defaultColor);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setTitle("");
    setColor(defaultColor);
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

  const canSubmit = title.trim().length >= 3;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    onCreate({
      title: title.trim(),
      color,
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <article
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-board-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <h2 id="create-board-title">Criar quadro</h2>
            <small className="workspace-kicker">{workspaceName}</small>
          </div>
          <button type="button" className="modal-close" aria-label="Fechar" onClick={onClose}>
            x
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="board-title">Titulo do quadro</label>
            <input
              id="board-title"
              name="board-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex.: Sprint Plataforma"
              autoFocus
            />
          </div>

          <div className="field">
            <label>Cor de fundo</label>
            <div className="color-grid" role="radiogroup" aria-label="Cor do quadro">
              {boardPalette.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className="color-option"
                  style={{ background: item.value }}
                  title={item.name}
                  aria-pressed={color === item.value}
                  onClick={() => setColor(item.value)}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
              Criar
            </button>
          </div>
        </form>
      </article>
    </div>
  );
}
