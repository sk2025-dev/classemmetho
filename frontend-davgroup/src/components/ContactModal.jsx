import { useEffect, useState } from "react";

function ContactModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("form");

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose && onClose();
    }
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const WA_NUMBER = "2250757249390";

  function openWhatsApp(message) {
    window.open(
      `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener",
    );
  }

  return (
    <div className="contact-overlay open" role="dialog" aria-modal="true">
      <div
        className="contact-overlay-bg"
        onClick={() => onClose && onClose()}
      />
      <div className="contact-modal">
        <div className="contact-modal-head">
          <div>
            <div className="contact-modal-title">Contactez-nous</div>
            <div className="contact-modal-sub">
              DAV Consulting — Solutions IT &amp; Transformation digitale
            </div>
          </div>
          <button
            className="contact-modal-close"
            aria-label="Fermer"
            onClick={() => onClose && onClose()}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="contact-modal-body">
          <div className="contact-tabs">
            <button
              type="button"
              className={`contact-tab ${activeTab === "form" ? "active" : ""}`}
              onClick={() => setActiveTab("form")}
            >
              <div className="contact-tab-icon">📝</div>
              <div className="contact-tab-name">Formulaire</div>
              <div className="contact-tab-desc">On vous répond sous 24h</div>
            </button>
            <button
              type="button"
              className={`contact-tab ${activeTab === "whatsapp" ? "active" : ""}`}
              onClick={() => setActiveTab("whatsapp")}
            >
              <div className="contact-tab-icon">💬</div>
              <div className="contact-tab-name">WhatsApp</div>
              <div className="contact-tab-desc">
                Réponse rapide &amp; directe
              </div>
            </button>
          </div>

          <div
            className={`contact-panel ${activeTab === "form" ? "active" : ""}`}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                const prenom = form.get("prenom")?.toString().trim();
                const nom = form.get("nom")?.toString().trim();
                const company = form.get("company")?.toString().trim();
                const tel = form.get("tel")?.toString().trim();
                const message = form.get("message")?.toString().trim();

                if (!prenom || !tel || !message) {
                  alert(
                    "Merci de renseigner votre prénom, téléphone et message.",
                  );
                  return;
                }

                const waText = `Bonjour DAV Consulting,\n\n*Nom :* ${prenom} ${nom || ""}${company ? `\n*Entreprise :* ${company}` : ""}\n*Téléphone :* ${tel}\n\n*Message :*\n${message}`;
                openWhatsApp(waText);
                onClose && onClose();
              }}
            >
              <div className="cf-row">
                <div className="cf-group">
                  <label className="cf-label">Prénom</label>
                  <input
                    name="prenom"
                    type="text"
                    className="cf-input"
                    placeholder="Kouassi"
                  />
                </div>
                <div className="cf-group">
                  <label className="cf-label">Nom</label>
                  <input
                    name="nom"
                    type="text"
                    className="cf-input"
                    placeholder="Aya"
                  />
                </div>
              </div>

              <div className="cf-group">
                <label className="cf-label">Entreprise (optionnel)</label>
                <input
                  name="company"
                  type="text"
                  className="cf-input"
                  placeholder="Ma Société SARL"
                />
              </div>

              <div className="cf-group">
                <label className="cf-label">Téléphone</label>
                <input
                  name="tel"
                  type="tel"
                  className="cf-input"
                  placeholder="+225 07 00 00 00 00"
                />
              </div>

              <div className="cf-group">
                <label className="cf-label">Votre besoin</label>
                <textarea
                  name="message"
                  className="cf-input cf-textarea"
                  placeholder="Décrivez votre projet : développement web, application mobile, transformation digitale, conseil stratégique..."
                />
              </div>

              <button type="submit" className="contact-submit-btn">
                Envoyer le message
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </form>
          </div>

          <div
            className={`contact-panel ${activeTab === "whatsapp" ? "active" : ""}`}
          >
            <div className="wa-box">
              <div className="wa-icon">💬</div>
              <div className="wa-title">Écrivez-nous directement</div>
              <div className="wa-desc">
                Choisissez un message rapide ou écrivez librement sur WhatsApp.
                Notre équipe vous répond en quelques minutes.
              </div>
              <div className="wa-quick-msgs">
                <button
                  className="wa-quick-btn"
                  type="button"
                  onClick={() =>
                    openWhatsApp(
                      "Bonjour DAV Consulting, je souhaite un devis pour un projet de développement web.",
                    )
                  }
                >
                  💻 Devis développement web
                </button>
                <button
                  className="wa-quick-btn"
                  type="button"
                  onClick={() =>
                    openWhatsApp(
                      "Bonjour DAV Consulting, j'aimerais discuter d'une transformation digitale pour mon entreprise.",
                    )
                  }
                >
                  🔄 Transformation digitale
                </button>
                <button
                  className="wa-quick-btn"
                  type="button"
                  onClick={() =>
                    openWhatsApp(
                      "Bonjour DAV Consulting, je suis intéressé(e) par vos services de conseil stratégique.",
                    )
                  }
                >
                  📊 Conseil stratégique
                </button>
                <button
                  className="wa-quick-btn"
                  type="button"
                  onClick={() =>
                    openWhatsApp(
                      "Bonjour DAV Consulting, j'ai un projet et j'aimerais en parler avec votre équipe.",
                    )
                  }
                >
                  💡 Parler d'un projet
                </button>
              </div>
              <button
                className="wa-open-btn"
                type="button"
                onClick={() =>
                  openWhatsApp(
                    "Bonjour DAV Consulting, je souhaite vous contacter pour un projet.",
                  )
                }
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.09.537 4.09 1.475 5.829L.022 23.978l6.304-1.428A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-1.791 0-3.497-.472-4.988-1.303l-.357-.214-3.713.84.883-3.587-.234-.373A9.797 9.797 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z" />
                </svg>
                Ouvrir WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactModal;
