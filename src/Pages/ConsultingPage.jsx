import { Link } from "react-router-dom";

function ConsultingPage() {
  return (
    <main
      className="final-cta"
      style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}
    >
      <div className="final-cta-inner">
        <h2>
          DAV <span className="italic">Consulting</span>
        </h2>
        <p>
          Le pôle consulting arrive juste après la landing. Services, équipe et
          contact seront détaillés dans la prochaine étape.
        </p>
        <Link className="explore-cta" to="/">
          <span>
            Retour à l'accueil <i className="arrow" />
          </span>
        </Link>
      </div>
    </main>
  );
}

export default ConsultingPage;
