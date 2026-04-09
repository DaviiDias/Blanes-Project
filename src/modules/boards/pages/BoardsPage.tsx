import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useBoardsStore } from "@/domain/boards/store/useBoardsStore";
import { BoardCard } from "@/modules/boards/components/BoardCard";
import { CreateBoardModal } from "@/modules/boards/components/CreateBoardModal";

export function BoardsPage() {
  const navigate = useNavigate();
  const workspace = useBoardsStore((state) => state.workspace);
  const boards = useBoardsStore((state) => state.boards);
  const createBoard = useBoardsStore((state) => state.createBoard);

  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);

  const boardCountText = useMemo(() => {
    const suffix = boards.length === 1 ? "quadro" : "quadros";
    return `${boards.length} ${suffix}`;
  }, [boards.length]);

  const handleCreateBoard = (payload: { title: string; color: string }) => {
    const board = createBoard(payload);
    navigate(`/boards/${board.id}`);
  };

  return (
    <section className="boards-page">
      <header className="boards-header">
        <div>
          <p className="workspace-kicker">Area de trabalho</p>
          <h1>{workspace.name}</h1>
          <p>Suite de produtividade preparada para Kanban, Scrum e integracoes futuras.</p>
        </div>

        <div className="boards-stats">
          <span>Resumo</span>
          <strong>{boardCountText}</strong>
        </div>
      </header>

      <div className="boards-grid">
        {boards.map((board) => (
          <BoardCard key={board.id} board={board} />
        ))}

        <button type="button" className="create-board-card" onClick={() => setIsCreateBoardOpen(true)}>
          <h3 className="create-board-card-title">Criar novo quadro</h3>
          <p className="create-board-card-subtitle">
            Defina contexto, prioridade e fluxo de trabalho em segundos.
          </p>
        </button>
      </div>

      <CreateBoardModal
        isOpen={isCreateBoardOpen}
        workspaceName={workspace.name}
        onCreate={handleCreateBoard}
        onClose={() => setIsCreateBoardOpen(false)}
      />
    </section>
  );
}
