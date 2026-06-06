import "../../styles/admin.css";

const OrderModal = ({ order, onClose, onStatusChange }) => {
  if (!order) return null;

  const STATUS_MAP = {
    pending: { label: "En attente", cls: "s-pending" },
    confirmed: { label: "Confirmée", cls: "s-confirmed" },
    shipped: { label: "Expédiée", cls: "s-shipped" },
    delivered: { label: "Livrée", cls: "s-delivered" },
    cancelled: { label: "Annulée", cls: "s-cancelled" },
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
          <div className="modal-head-title">Commande {order.id}</div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-row">
            <span className="modal-row-label">Client</span>
            <span className="modal-row-val">
              {order.client.name}
              <br />
              <small style={{ color: "var(--ink-m)" }}>
                {order.client.phone}
              </small>
            </span>
          </div>
          <div className="modal-row">
            <span className="modal-row-label">Adresse</span>
            <span className="modal-row-val">
              {order.client.address}, {order.client.city}
            </span>
          </div>
          <div className="modal-row">
            <span className="modal-row-label">Date</span>
            <span className="modal-row-val">{order.date}</span>
          </div>
          <div className="modal-row">
            <span className="modal-row-label">Paiement</span>
            <span className="modal-row-val">{PAY_LABELS[order.payMethod]}</span>
          </div>
          <div className="modal-row">
            <span className="modal-row-label">Statut</span>
            <span className="modal-row-val">
              <span className={`status-badge ${STATUS_MAP[order.status]?.cls}`}>
                {STATUS_MAP[order.status]?.label}
              </span>
            </span>
          </div>

          <div
            style={{
              marginTop: "16px",
              marginBottom: "10px",
              fontWeight: "700",
              fontSize: "12px",
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "var(--ink-m)",
            }}
          >
            Articles commandés
          </div>

          {order.items?.map((item, idx) => (
            <div key={idx} className="modal-row">
              <span className="modal-row-label">
                {item.name} ×{item.qty}
              </span>
              <span className="modal-row-val">
                {(item.price * item.qty).toLocaleString("fr-FR")} FCFA
              </span>
            </div>
          ))}

          <div
            className="modal-row"
            style={{ borderTop: "2px solid var(--border)", marginTop: "8px" }}
          >
            <span className="modal-row-label">
              <strong>Total</strong>
            </span>
            <span className="modal-row-val">
              <strong>{order.total?.toLocaleString("fr-FR")} FCFA</strong>
            </span>
          </div>

          <div className="modal-status-row">
            {["pending", "confirmed", "shipped", "delivered", "cancelled"].map(
              (s) => (
                <button
                  key={s}
                  className={`action-btn ${s === order.status ? "ab-primary" : "ab-view"}`}
                  onClick={() => onStatusChange(order.id, s)}
                >
                  {STATUS_MAP[s]?.label}
                </button>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
