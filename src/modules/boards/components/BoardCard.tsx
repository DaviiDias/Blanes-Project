import type { CSSProperties } from "react";
import { Link } from "react-router-dom";

import type { Board } from "@/domain/boards/types";

interface BoardCardProps {
  board: Board;
}

export function BoardCard({ board }: BoardCardProps) {
  const style = {
    background: `linear-gradient(148deg, rgba(255, 255, 255, 0.86), ${board.color}99)`,
    borderColor: `${board.color}66`,
  } satisfies CSSProperties;

  return (
    <Link to={`/boards/${board.id}`} className="board-card" style={style}>
      <div className="board-card-header">
        <h3>{board.title}</h3>
      </div>
      <p>Fluxo pronto para listas, cards e acompanhamento continuo.</p>
    </Link>
  );
}
