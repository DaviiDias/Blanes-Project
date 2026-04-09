import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link, useLocation } from "react-router-dom";

import { useBoardsStore } from "@/domain/boards/store/useBoardsStore";

export function Header() {
  const { pathname } = useLocation();
  const isBoardRoute = pathname.startsWith("/boards/");
  const workspace = useBoardsStore((state) => state.workspace);
  const boards = useBoardsStore((state) => state.boards);
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredBoards = useMemo(() => {
    const recentBoards = [...boards].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (!normalizedQuery) {
      return recentBoards.slice(0, 6);
    }

    const startsWith = recentBoards.filter((board) =>
      board.title.toLowerCase().startsWith(normalizedQuery)
    );
    const includes = recentBoards.filter(
      (board) =>
        !board.title.toLowerCase().startsWith(normalizedQuery) &&
        board.title.toLowerCase().includes(normalizedQuery)
    );

    return [...startsWith, ...includes].slice(0, 8);
  }, [boards, normalizedQuery]);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    const handleWindowClick = (event: MouseEvent) => {
      const target = event.target as Node | null;

      if (!target || !searchRef.current?.contains(target)) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener("mousedown", handleWindowClick);
    return () => {
      window.removeEventListener("mousedown", handleWindowClick);
    };
  }, [isSearchOpen]);

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__brand">
          {isBoardRoute && (
            <div className="header__board-nav" aria-label="Atalhos de navegacao">
              <Link to="/" className="header__board-link" aria-label="Ir para quadros">
                <img src="/assets/img/layers.png" alt="" className="header__board-logo" />
              </Link>
            </div>
          )}

          <span className="header__logo">Blanes Project</span>
        </div>

        <div className="header__search" role="search" ref={searchRef}>
          <input
            type="search"
            placeholder="Buscar quadros"
            className="header__input"
            value={query}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsSearchOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setIsSearchOpen(false);
              }
            }}
            aria-expanded={isSearchOpen}
            aria-controls="header-search-results"
          />
          <i className="bx bx-search header__icon" aria-hidden="true" />

          {isSearchOpen && (
            <div id="header-search-results" className="header-search-results" role="listbox">
              <p className="header-search-results__title">
                {normalizedQuery ? "Resultados" : "Quadros recentes"}
              </p>

              {filteredBoards.length > 0 ? (
                <div className="header-search-results__list">
                  {filteredBoards.map((board) => (
                    <Link
                      key={board.id}
                      to={`/boards/${board.id}`}
                      className="header-search-item"
                      onClick={() => {
                        setIsSearchOpen(false);
                        setQuery("");
                      }}
                    >
                      <span
                        className="header-search-item__preview"
                        style={{ "--result-color": board.color } as CSSProperties}
                        aria-hidden="true"
                      />
                      <span className="header-search-item__content">
                        <strong className="header-search-item__title">{board.title}</strong>
                        <small className="header-search-item__subtitle">{workspace.name}</small>
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="header-search-results__empty">Nenhum quadro encontrado.</p>
              )}
            </div>
          )}
        </div>

        <div className="header__profile" aria-label="Perfil do usuario">
          <button type="button" className="header__profile-trigger" aria-haspopup="menu">
            <span className="header__user-name">Chewie</span>
            <span className="header__avatar" aria-hidden="true">C</span>
            <i className="bx bx-chevron-down header__profile-arrow" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
