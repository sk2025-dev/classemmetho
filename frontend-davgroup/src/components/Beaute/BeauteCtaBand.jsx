import { Link } from "react-router-dom";

function BeauteCtaBand() {
  return (
    <section className="beauty-cta-band beauty-cta-band--bottom">
      <div>
        <p className="beauty-section-kicker">Entrer dans l’univers</p>
        <h2>Un univers DB chic, humain et fiable.</h2>
      </div>
      <Link className="beauty-btn beauty-btn--primary" to="/">
        Retour groupe
      </Link>
    </section>
  );
}

export default BeauteCtaBand;
