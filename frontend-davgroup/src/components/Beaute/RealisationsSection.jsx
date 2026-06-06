import { Link } from "react-router-dom";
import { realisationCategories } from "./beauteData";

function RealisationsSection() {
  return (
    <section id="realisations" className="beauty-realisations">
      <div className="beauty-section-heading beauty-real-section-header">
        <div>
          <p>Notre portfolio</p>
          <h2>
            Nos <span>réalisations</span>
          </h2>
        </div>
        <Link
          className="beauty-btn beauty-btn--primary"
          to="/beaute/rendezvous"
        >
          📅 Prendre un rendez-vous
        </Link>
      </div>

      {realisationCategories.map((category, index) => (
        <article
          className="beauty-real-category"
          id={
            index === 0
              ? "realisations-micro-twists"
              : index === 1
                ? "realisations-enfants"
                : index === 2
                  ? "realisations-ongles"
                  : "realisations-spa"
          }
          key={`${category.title}-${category.emphasis}`}
        >
          <div className="beauty-real-cat-header">
            <div className="beauty-real-cat-line" />
            <div className="beauty-real-cat-info">
              <h3 className="beauty-real-cat-title">
                {category.title} <em>{category.emphasis}</em>
              </h3>
              <span className="beauty-real-cat-sub">{category.subtitle}</span>
            </div>
          </div>

          <div className="beauty-real-grid">
            {category.images.map((image) => (
              <div className="beauty-real-card" key={image.alt}>
                <img
                  className="beauty-real-img"
                  src={image.src}
                  alt={image.alt}
                />
                <div className="beauty-real-placeholder">
                  <span>📸</span>
                  <p>Ajouter une photo</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}

export default RealisationsSection;
