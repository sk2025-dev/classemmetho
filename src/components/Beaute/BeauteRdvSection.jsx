import { Link } from "react-router-dom";
import BeautySectionHeader from "./BeautySectionHeader";

function BeauteRdvSection() {
  return (
    <section className="beauty-rdv" id="rendezvous">
      <div className="beauty-rdv-copy">
        <BeautySectionHeader
          eyebrow="Rendez-vous"
          title="Réservez votre moment beauté avec Dav'Beauté"
          stack
        />
        <p>
          Choisissez votre service, votre créneau et contactez l’équipe en un
          seul clic pour confirmer votre visite.
        </p>
        <div className="beauty-actions">
          <a
            className="beauty-btn beauty-btn--primary"
            href="https://api.whatsapp.com/send?phone=2250757249390"
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp direct
          </a>
          <Link className="beauty-btn beauty-btn--ghost" to="/beaute/about">
            En savoir plus
          </Link>
        </div>
      </div>

      <div className="beauty-rdv-card">
        <span className="beauty-rdv-mini">DB</span>
        <strong>+225 07 57 24 93 90</strong>
        <p>Réponse rapide, suivi direct et prise de rendez-vous simple.</p>
      </div>
    </section>
  );
}

export default BeauteRdvSection;
