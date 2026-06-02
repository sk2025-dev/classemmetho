import { Link } from "react-router-dom";

function BeauteBanner() {
  return (
    <section className="beauty-banner" id="univers">
      <div className="beauty-banner-content">
        <p className="beauty-eyebrow">Cosmétique · Beauté · Excellence</p>
        <h1>
          Révélez votre
          <span>beauté naturelle</span>
        </h1>
        <p className="beauty-lead">
          Des soins d'exception, un univers premium et une équipe attentive pour
          sublimer chaque rendez-vous.
        </p>
        <div className="beauty-actions">
          <Link
            className="beauty-btn beauty-btn--primary"
            to="/beaute/rendezvous"
          >
            Prendre rendez-vous
          </Link>
          <Link
            className="beauty-btn beauty-btn--ghost"
            to="/beaute/realisations"
          >
            Voir nos réalisations
          </Link>
        </div>
      </div>
    </section>
  );
}

export default BeauteBanner;
