import "../../styles/admin.css";

const RdvModal = ({ rdv, onClose, onStatusChange }) => {
  if (!rdv) return null;

  const STATUS_MAP = {
    awaiting: { label: "Acompte dû", cls: "s-awaiting" },
    confirmed: { label: "Confirmé", cls: "s-confirmed" },
    done: { label: "Terminé", cls: "s-done" },
    cancelled: { label: "Annulé", cls: "s-cancelled" },
  };

  const PAY_LABELS = {
    mobile: "Mobile Money",
    card: "Carte bancaire",
    cash: "Paiement livraison",
  };

  return (
    <div className="modal-overlay open">
      <div className="modal-box">
        <div className="modal-head">
          <div className="modal-head-title">Rendez-vous {rdv.id}</div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-row">
            <span className="modal-row-label">Client</span>
            <span className="modal-row-val">
              {rdv.client.name}
              <br />
              <small style={{ color: "var(--ink-m)" }}>
                {rdv.client.phone}
              </small>
            </span>
          </div>
          {rdv.client.email && (
            <div className="modal-row">
              <span className="modal-row-label">Email</span>
              <span className="modal-row-val">{rdv.client.email}</span>
            </div>
          )}
          <div className="modal-row">
            <span className="modal-row-label">Soin</span>
            <span className="modal-row-val">{rdv.service}</span>
          </div>
          <div className="modal-row">
            <span className="modal-row-label">Date</span>
            <span className="modal-row-val">
              {rdv.rdvDate} à {rdv.slot}
            </span>
          </div>
          <div className="modal-row">
            <span className="modal-row-label">Durée</span>
            <span className="modal-row-val">{rdv.duration}</span>
          </div>
          <div className="modal-row">
            <span className="modal-row-label">Prix prestation</span>
            <span className="modal-row-val">
              {rdv.svcPrice?.toLocaleString("fr-FR")} FCFA
            </span>
          </div>
          <div className="modal-row">
            <span className="modal-row-label">Acompte versé</span>
            <span
              className="modal-row-val"
              style={{ color: "var(--red)", fontWeight: "700" }}
            >
              {rdv.acompte?.toLocaleString("fr-FR")} FCFA
            </span>
          </div>
          <div className="modal-row">
            <span className="modal-row-label">Reste à payer</span>
            <span className="modal-row-val">
              {(rdv.svcPrice - rdv.acompte)?.toLocaleString("fr-FR")} FCFA
            </span>
          </div>
          <div className="modal-row">
            <span className="modal-row-label">Paiement acompte</span>
            <span className="modal-row-val">{PAY_LABELS[rdv.payMethod]}</span>
          </div>
          <div className="modal-row">
            <span className="modal-row-label">Statut</span>
            <span className="modal-row-val">
              <span className={`status-badge ${STATUS_MAP[rdv.status]?.cls}`}>
                {STATUS_MAP[rdv.status]?.label}
              </span>
            </span>
          </div>

          <div className="modal-status-row">
            {["awaiting", "confirmed", "done", "cancelled"].map((s) => (
              <button
                key={s}
                className={`action-btn ${s === rdv.status ? "ab-primary" : "ab-view"}`}
                onClick={() => onStatusChange(rdv.id, s)}
              >
                {STATUS_MAP[s]?.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RdvModal;
