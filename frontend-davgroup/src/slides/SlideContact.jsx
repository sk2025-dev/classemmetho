import { useCallback } from "react";

function SlideContact({ onOpen }) {
  const handleOpen = useCallback(() => {
    if (typeof onOpen === "function") return onOpen();
    // fallback: no-op
    return null;
  }, [onOpen]);

  return (
    <>
      <div className="uni-slide" data-index="3" id="slide3">
        <div
          className="slide-bg"
          id="bg3"
          style={{ backgroundImage: 'url("/images/contac.png")' }}
        ></div>
        <div className="slide-overlay slide-overlay--contact"></div>
        <div className="slide-streak" style={{ left: "45%" }}></div>

        <div className="slide-content">
          <div className="slide-glass slide-glass--contact" id="glass3">
            <div className="slide-tag slide-tag--contact">— Nous rejoindre</div>
            <h2 className="slide-title slide-title--contact">
              <span className="st-line">Travaillons</span>
              <span className="st-line st-italic">ensemble</span>
            </h2>
            <p className="slide-desc" style={{ maxWidth: "400px" }}>
              Un projet, une idée, une ambition.
              <br />
              Notre équipe est à votre écoute pour donner forme à ce que vous
              imaginez.
            </p>
            <div
              className="slide-contact-card"
              aria-label="Coordonnées de DAV Holding"
            >
              <div>
                <div className="slide-contact-title">Contactez-nous</div>
                <div className="slide-contact-line">
                  <svg
                    className="slide-contact-miniicon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 21s6-5.3 6-11a6 6 0 0 0-12 0c0 5.7 6 11 6 11z" />
                    <circle cx="12" cy="10" r="2.2" />
                  </svg>
                  <span>
                    <strong>Adresse :</strong> Angré 8e tranche
                  </span>
                </div>
                <div className="slide-contact-line">
                  <svg
                    className="slide-contact-miniicon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.11 4.18 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.72c.12 1.05.37 2.07.72 3.03a2 2 0 0 1-.45 2.11L9.91 10.09a16 16 0 0 0 6 6l1.22-1.22a2 2 0 0 1 2.11-.45c.96.35 1.98.6 3.03.72A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>
                    <strong>Contact :</strong> 07 57 24 93 90
                  </span>
                </div>
                <div className="slide-contact-line">
                  <svg
                    className="slide-contact-miniicon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="4" y="4" width="16" height="16" />
                    <path d="M22 6L12 13 2 6" />
                  </svg>
                  <span>
                    <strong>Email :</strong> davholdinggroup@gmail.com
                  </span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <button
                type="button"
                className="slide-cta slide-cta--outline slide-cta--contact"
                onClick={handleOpen}
              >
                Nous écrire
                <span className="cta-arrow">→</span>
              </button>
            </div>
          </div>
        </div>
        <div className="slide-ghost-text">CONTACT</div>
      </div>
    </>
  );
}

export default SlideContact;
