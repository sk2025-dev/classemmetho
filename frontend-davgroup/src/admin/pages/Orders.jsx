import { useState, useMemo } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useAdmin } from "../hooks/useAdmin";
import OrderModal from "../components/modals/OrderModal";
import { MOCK_ORDERS } from "../utils/constants";
import "../styles/admin.css";

const Orders = () => {
  const { showToast } = useAdmin();
  const [orders, setOrders] = useLocalStorage("dav_orders", MOCK_ORDERS);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

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

  const filteredOrders = useMemo(() => {
    let result = orders || [];
    if (filter !== "all") {
      result = result.filter((o) => o.status === filter);
    }
    if (search) {
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(search) ||
          o.client.name.toLowerCase().includes(search),
      );
    }
    return result;
  }, [orders, filter, search]);

  const handleStatusChange = (orderId, newStatus) => {
    const updated = orders.map((o) =>
      o.id === orderId ? { ...o, status: newStatus } : o,
    );
    setOrders(updated);
    showToast("✓ Statut mis à jour");
    setSelectedOrder(null);
  };

  return (
    <div className="panel active">
      <div className="section-head">
        <div>
          <div className="section-head-title">Gestion des commandes</div>
          <div className="section-head-sub">
            {filteredOrders.length} commande(s)
          </div>
        </div>
      </div>
      <div className="table-card">
        <div className="table-filters">
          <button
            className={`tf-tab ${filter === "all" ? "tf-active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Toutes
          </button>
          <button
            className={`tf-tab ${filter === "pending" ? "tf-active" : ""}`}
            onClick={() => setFilter("pending")}
          >
            En attente
          </button>
          <button
            className={`tf-tab ${filter === "confirmed" ? "tf-active" : ""}`}
            onClick={() => setFilter("confirmed")}
          >
            Confirmées
          </button>
          <button
            className={`tf-tab ${filter === "shipped" ? "tf-active" : ""}`}
            onClick={() => setFilter("shipped")}
          >
            Expédiées
          </button>
          <button
            className={`tf-tab ${filter === "delivered" ? "tf-active" : ""}`}
            onClick={() => setFilter("delivered")}
          >
            Livrées
          </button>
          <button
            className={`tf-tab ${filter === "cancelled" ? "tf-active" : ""}`}
            onClick={() => setFilter("cancelled")}
          >
            Annulées
          </button>
          <input
            type="text"
            className="tf-search"
            placeholder="🔍 Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value.toLowerCase())}
          />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Date</th>
                <th>Client</th>
                <th>Montant</th>
                <th>Paiement</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-row">
                    Aucune commande trouvée
                  </td>
                </tr>
              ) : (
                [...filteredOrders].reverse().map((o) => (
                  <tr key={o.id}>
                    <td>
                      <div className="td-ref">{o.id}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: "12.5px" }}>{o.date}</div>
                    </td>
                    <td>
                      <div className="td-name">{o.client.name}</div>
                      <div className="td-meta">{o.client.phone}</div>
                    </td>
                    <td>
                      <div className="td-price">
                        {o.total.toLocaleString("fr-FR")} FCFA
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "12.5px" }}>
                        {PAY_LABELS[o.payMethod] || o.payMethod}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${STATUS_MAP[o.status]?.cls}`}
                      >
                        {STATUS_MAP[o.status]?.label}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          className="action-btn ab-view"
                          onClick={() => setSelectedOrder(o)}
                        >
                          👁 Voir
                        </button>
                        {o.status === "pending" && (
                          <button
                            className="action-btn ab-confirm"
                            onClick={() =>
                              handleStatusChange(o.id, "confirmed")
                            }
                          >
                            ✓ Confirmer
                          </button>
                        )}
                        {o.status === "confirmed" && (
                          <button
                            className="action-btn ab-view"
                            style={{
                              background: "rgba(42, 92, 255, .1)",
                              color: "#1a4acc",
                            }}
                            onClick={() => handleStatusChange(o.id, "shipped")}
                          >
                            📦 Expédier
                          </button>
                        )}
                        {o.status === "shipped" && (
                          <button
                            className="action-btn ab-confirm"
                            onClick={() =>
                              handleStatusChange(o.id, "delivered")
                            }
                          >
                            🏠 Livré
                          </button>
                        )}
                        {!["cancelled", "delivered"].includes(o.status) && (
                          <button
                            className="action-btn ab-cancel"
                            onClick={() =>
                              handleStatusChange(o.id, "cancelled")
                            }
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

export default Orders;
