import { useLocalStorage } from "../hooks/useLocalStorage";
import { MOCK_ORDERS, MOCK_RDVS } from "../utils/constants";
import "../styles/admin.css";

const Dashboard = () => {
  const [orders] = useLocalStorage("dav_orders", MOCK_ORDERS);
  const [rdvs] = useLocalStorage("dav_rdvs", MOCK_RDVS);
  const [products] = useLocalStorage("dav_products", []);

  const pending = orders?.filter((o) => o.status === "pending")?.length || 0;
  const confirmedRdvs =
    rdvs?.filter((r) => r.status === "confirmed")?.length || 0;
  const ca =
    orders
      ?.filter((o) => o.status !== "cancelled")
      ?.reduce((s, o) => s + o.total, 0) || 0;
  const oos = products?.filter((p) => !p.inStock)?.length || 0;

  return (
    <div className="panel active">
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon red">📦</div>
            <span className="stat-trend up">+{pending}</span>
          </div>
          <div className="stat-value">{pending}</div>
          <div className="stat-label">Commandes en attente</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon gold">📅</div>
            <span className="stat-trend neutral">Aujourd'hui</span>
          </div>
          <div className="stat-value">{confirmedRdvs}</div>
          <div className="stat-label">Rendez-vous confirmés</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon green">💰</div>
            <span className="stat-trend up">Ce mois</span>
          </div>
          <div className="stat-value">{ca.toLocaleString("fr-FR")}</div>
          <div className="stat-label">CA estimé (FCFA)</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon orange">⚠️</div>
            <span className="stat-trend down">Ruptures</span>
          </div>
          <div className="stat-value">{oos}</div>
          <div className="stat-label">Produits en rupture</div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="widget-card">
          <div className="widget-head">
            <div className="widget-head-title">Dernières commandes</div>
          </div>
          {orders && orders.length > 0 ? (
            [...orders]
              .reverse()
              .slice(0, 5)
              .map((o) => (
                <div key={o.id} className="widget-row">
                  <div
                    className="widget-dot"
                    style={{
                      background:
                        o.status === "pending"
                          ? "var(--warn)"
                          : o.status === "cancelled"
                            ? "var(--danger)"
                            : "var(--success)",
                    }}
                  ></div>
                  <div className="widget-info">
                    <div className="widget-info-name">{o.client.name}</div>
                    <div className="widget-info-meta">
                      {o.id} · {o.date}
                    </div>
                  </div>
                  <div className="widget-amount">
                    {o.total.toLocaleString("fr-FR")} FCFA
                  </div>
                </div>
              ))
          ) : (
            <div className="empty-row">Aucune commande</div>
          )}
        </div>

        <div>
          <div className="widget-card" style={{ marginBottom: "20px" }}>
            <div className="widget-head">
              <div className="widget-head-title">RDV à venir</div>
            </div>
            {rdvs && rdvs.filter((r) => r.status === "confirmed").length > 0 ? (
              rdvs
                .filter((r) => r.status === "confirmed")
                .slice(0, 4)
                .map((r) => (
                  <div key={r.id} className="widget-row">
                    <div
                      className="widget-dot"
                      style={{ background: "var(--success)" }}
                    ></div>
                    <div className="widget-info">
                      <div className="widget-info-name">{r.client.name}</div>
                      <div className="widget-info-meta">
                        {r.service} · {r.rdvDate} à {r.slot}
                      </div>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--ink-m)" }}>
                      {r.duration}
                    </div>
                  </div>
                ))
            ) : (
              <div className="empty-row">Aucun RDV confirmé</div>
            )}
          </div>

          <div className="widget-card">
            <div className="widget-head">
              <div className="widget-head-title">Alertes</div>
            </div>
            {pending > 0 ||
            oos > 0 ||
            rdvs?.filter((r) => r.status === "awaiting").length > 0 ? (
              <div>
                {pending > 0 && (
                  <div className="alert-item">
                    <span className="alert-icon">📦</span>
                    <div>
                      <div className="alert-text">
                        <strong>{pending} commande(s)</strong> en attente de
                        traitement.
                      </div>
                      <div className="alert-time">Maintenant</div>
                    </div>
                  </div>
                )}
                {rdvs?.filter((r) => r.status === "awaiting").length > 0 && (
                  <div className="alert-item">
                    <span className="alert-icon">💳</span>
                    <div>
                      <div className="alert-text">
                        <strong>
                          {rdvs.filter((r) => r.status === "awaiting").length}{" "}
                          RDV
                        </strong>{" "}
                        en attente de paiement de l'acompte.
                      </div>
                      <div className="alert-time">Maintenant</div>
                    </div>
                  </div>
                )}
                {oos > 0 && (
                  <div className="alert-item">
                    <span className="alert-icon">⚠️</span>
                    <div>
                      <div className="alert-text">
                        <strong>{oos} produit(s)</strong> en rupture de stock.
                      </div>
                      <div className="alert-time">Stock</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-row">Tout est en ordre ✓</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
