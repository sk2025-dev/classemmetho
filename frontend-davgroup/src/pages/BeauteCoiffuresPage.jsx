import BeauteLayout from "../components/Beaute/BeauteLayout";
import BeautySectionHeader from "../components/Beaute/BeautySectionHeader";
import { Link } from "react-router-dom";
import { realisationCategories } from "../components/Beaute/beauteData";

function BeauteCoiffuresPage() {
  const coiffuresGallery = realisationCategories[1]?.images ?? [];

  return (
    <BeauteLayout>
      <section className="beauty-section beauty-coiffures" id="coiffures">
        <BeautySectionHeader
          eyebrow="Nos coiffures"
          title=""
          className="beauty-coiffures__header"
        />

        <div className="beauty-section-heading beauty-real-section-header">
          <div>
            <p>Coiffures phares</p>
            <h2>
              Nattes, <span>twists</span> et coiffures protectrices
            </h2>
            <span className="beauty-section-subtitle">
              Des styles propres, durables et adaptés à la texture du cheveu.
            </span>
          </div>

          <Link
            className="beauty-btn beauty-btn--primary"
            to="/beaute/rendezvous"
          >
            📅 Prendre un rendez-vous
          </Link>
        </div>

        <div className="beauty-real-grid beauty-coiffures-grid">
          {coiffuresGallery.map((image) => (
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
      </section>
    </BeauteLayout>
  );
}

export default BeauteCoiffuresPage;
