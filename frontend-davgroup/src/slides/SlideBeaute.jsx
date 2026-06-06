// src/components/slides/SlideBeaute.jsx
import { Link } from "react-router-dom";

function SlideBeaute() {
  return (
    <>
      <div
        className="slide-bg"
        style={{ backgroundImage: 'url("/images/miriam.png")' }}
      />
      <div className="slide-overlay slide-overlay--beauty" />
      <div className="slide-streak" style={{ left: "40%" }} />
      <div className="slide-content">
        <div className="slide-glass slide-glass--beauty">
          <div className="slide-brand-logo">
            <img src="/images/beauté.png" alt="Dav' Beauté" />
          </div>
          <p className="slide-desc">
            Cosmétiques premium & soins capillaires d'exception.
            <br />
            Pour révéler la beauté authentique en vous.
          </p>
          <div className="slide-features slide-features--beauty">
            <span>Soins capillaires</span>
            <span>Cosmétiques visage</span>
            <span>Conseil beauté</span>
          </div>
          {/* Link vers la future page React davbeaute */}
          <Link to="/beaute" className="slide-cta slide-cta--beauty">
            <span>Entrer dans l'univers</span>
            <span className="cta-arrow">→</span>
          </Link>
        </div>
      </div>
      <div className="slide-ghost-text">BEAUTÉ</div>
    </>
  );
}

export default SlideBeaute;
