import { useState } from "react";

function BeautyCard({ variant, item, label, onAddToCart }) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (variant === "product") {
    const isGommage = item.title.toLowerCase().includes("gommage");
    return (
      <article
        className={`beauty-product-card${isGommage ? " beauty-product-card--gommage" : ""}`}
      >
        <div className="beauty-product-media">
          <button
            type="button"
            className={`beauty-product-media__trigger${detailsOpen ? " is-open" : ""}`}
            onClick={() => setDetailsOpen((currentValue) => !currentValue)}
            aria-expanded={detailsOpen}
            aria-label={`Afficher la description de ${item.title}`}
          >
            <img src={item.image} alt={item.title} />
            <span className="beauty-product-media__hint">
              {detailsOpen ? "Masquer" : "Détails"}
            </span>
          </button>
          {item.badge ? (
            <span className="beauty-product-badge">{item.badge}</span>
          ) : null}
        </div>
        <div className="beauty-product-body">
          <p className="beauty-product-type">{item.type}</p>
          <h3>{item.title}</h3>
          <div
            className={`beauty-product-details${detailsOpen ? " is-open" : ""}`}
          >
            <p>{item.description}</p>
          </div>
          <div className="beauty-product-footer">
            <strong>{item.price}</strong>
            <button
              type="button"
              className="beauty-product-link"
              onClick={onAddToCart}
              translate="no"
              lang="fr"
            >
              Ajouter au panier
            </button>
          </div>
        </div>
      </article>
    );
  }

  if (variant === "service") {
    return (
      <article className="beauty-service-card">
        <div className="beauty-service-image">
          <img src={item.image} alt={item.title} />
          <span>{item.title}</span>
        </div>
        <div className="beauty-service-body">
          <h3>{item.title}</h3>
          <p>{item.text}</p>
        </div>
      </article>
    );
  }

  if (variant === "realisation") {
    return (
      <article className="beauty-real-card">
        <div className="beauty-real-image">
          <img src={item.image} alt={item.title} />
        </div>
        <div className="beauty-real-body">
          <h3>{item.title}</h3>
          <p>{item.text}</p>
        </div>
      </article>
    );
  }

  return (
    <article className="beauty-info-card">
      <span className="beauty-card-kicker">{label}</span>
      <h3>{item.title}</h3>
      <p>{item.text}</p>
    </article>
  );
}

export default BeautyCard;
