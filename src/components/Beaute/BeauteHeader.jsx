import { Link } from "react-router-dom";
import BeauteMainNav from "./BeauteMainNav";

function BeauteHeader({ sectionTabs, cartCount = 0, onCartClick }) {
  return (
    <header className="site-header">
      <div className="promo-bar">
        <span>✦</span>
        Livraison offerte à partir de 25 000 FCFA d'achat
        <span>✦</span>
        Code : <strong>DAVBEAUTE</strong>
      </div>

      <div className="logo-zone">
        <Link to="/" className="back-link">
          Accueil groupe
        </Link>
        <img className="site-logo" src="/images/beauté.png" alt="Dav'Beauté" />
        {onCartClick ? (
          <button
            className="cart-btn"
            type="button"
            onClick={onCartClick}
            aria-label="Ouvrir le panier"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span>Panier</span>
            <span className="cart-badge">{cartCount}</span>
          </button>
        ) : (
          <span className="cart-btn cart-btn--placeholder" aria-hidden="true" />
        )}
      </div>

      <BeauteMainNav tabs={sectionTabs} />
    </header>
  );
}

export default BeauteHeader;
