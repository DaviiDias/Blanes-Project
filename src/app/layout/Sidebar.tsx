import { Link, useLocation } from "react-router-dom";

export function Sidebar() {
  const { pathname } = useLocation();
  const isBoardsRoute = pathname === "/" || pathname.startsWith("/boards");

  return (
    <aside className="nav" aria-label="Navegacao principal">
      <nav className="nav__container">
        <div>
          <Link to="/" className="nav__link nav__logo" aria-label="Pagina inicial">
            <img src="/assets/img/layers.png" alt="Blanes logo" className="nav__logo-image" />
            <span className="nav__logo-name">Project</span>
          </Link>

          <div className="nav__list">
            <div className="nav__items">
              <h3 className="nav__subtitle">Menu</h3>
              <Link to="/" className={`nav__link${isBoardsRoute ? " active" : ""}`}>
                <i className="bx bx-grid-alt nav__icon" aria-hidden="true" />
                <span className="nav__name">Quadros</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="nav__footer">
          <Link to="/" className="nav__link nav__logout">
            <i className="bx bx-log-out nav__icon" aria-hidden="true" />
            <span className="nav__name">Sair</span>
          </Link>
          <p className="nav__version">Versao: v0.1.0</p>
        </div>
      </nav>
    </aside>
  );
}
