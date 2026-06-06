import { Link } from "react-router-dom";
import "../../styles/BeauteFooter.css";

function BeauteFooter() {
  return (
    <footer
      className="dav-footer"
      id="footer-contact"
      aria-label="Pied de page DAV Beauté"
    >
      <div className="container">
        <div className="dav-footer__grid">
          <div>
            <div className="brand" style={{ zIndex: 5, position: "relative" }}>
              <img src="/images/logo dav beauty.png" alt="Dav'Beauté" />
              <h4>Dav'Beauté</h4>
            </div>
            <p className="desc">
              Cosmétique premium — Produits capillaires, soins visage & corps,
              onglerie et spa. Cocody Angré, Abidjan.
            </p>
            <div className="dav-footer__socials" aria-label="Réseaux sociaux">
              <a
                className="social-pill"
                href="https://www.facebook.com/Davi225"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                title="Facebook"
              >
                <img src="/images/face.png" alt="Facebook" />
              </a>
              <a
                className="social-pill"
                href="https://vm.tiktok.com/ZS921QMFWUWfW-wIRfk/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                title="TikTok"
              >
                <img src="/images/tiktoki.png" alt="TikTok" />
              </a>
              <a
                className="social-pill"
                href="https://api.whatsapp.com/send?phone=2250757249390"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                title="WhatsApp"
              >
                <img src="/images/whatsapp.png" alt="WhatsApp" />
              </a>
            </div>
          </div>

          <div>
            <p className="col-title">Nos réalisations</p>
            <ul>
              <li>
                <Link to="/beaute/realisations">Portfolio</Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="col-title">Contact</p>
            <ul>
              <li className="contact-line">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 11-9 11s-9-4-9-11a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>Abidjan, Côte d'Ivoire</span>
              </li>
              <li className="contact-line">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16v16H4z"></path>
                  <path d="M22 6L12 13 2 6"></path>
                </svg>
                <a href="mailto:contact@davbeaute.ci">davholdinggroup@davbeaute.ci</a>
              </li>
              <li className="contact-line">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.11 4.18 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.72c.12 1.05.37 2.07.72 3.03a2 2 0 0 1-.45 2.11L9.91 10.09a16 16 0 0 0 6 6l1.22-1.22a2 2 0 0 1 2.11-.45c.96.35 1.98.6 3.03.72A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <a href="tel:+2250757249390">+225 07 57 24 93 90</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="dav-footer__bar">
          <div className="left">
            © 2026 Dav'Beauté — DAV Holding Group. Tous droits réservés.
          </div>
          <div className="right">Côte d'Ivoire</div>
        </div>

        <div className="dav-footer__watermark" aria-hidden="true">
          DAV'BEAUTÉ
        </div>
      </div>
    </footer>
  );
}

export default BeauteFooter;
