import { useState, useMemo, useEffect } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useAdmin } from "../hooks/useAdmin";
import RdvModal from "../components/modals/RdvModal";
import { MOCK_RDVS } from "../utils/constants";
import { adminApi } from "../utils/api";
import "../styles/admin.css";

const Rdvs = () => {
  const { showToast } = useAdmin();
  const [rdvs, setRdvs] = useLocalStorage("dav_rdvs", MOCK_RDVS);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await adminApi.getRdvs();
        const data = res?.data || [];
        const mapped = data.map((r) => {
          const dt = new Date(r.appointment_date);
          const rdvDate = dt.toISOString().slice(0, 10);
          const slot = dt.toTimeString().slice(0, 5);
          const duration = r.duration ? (parseInt(r.duration) >= 60 ? `${Math.round(parseInt(r.duration)/60)}h` : `${r.duration}m`) : "";
          return {
            id: `#RDV-${r.id}`,
            rdvDate,
            slot,
            service: r.service,
            duration,
            svcPrice: r.svcPrice || 0,
            client: { name: r.client_name, phone: r.client_phone, email: r.client_email },
            payMethod: r.payMethod || "",
            acompte: r.acompte || 0,
            status: r.status || "pending",
          };
        });

        if (mounted && mapped.length > 0) setRdvs(mapped);
      } catch (err) {
        // keep mocks
      }
    };

    load();

    return () => (mounted = false);
  }, [setRdvs]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedRdv, setSelectedRdv] = useState(null);

  const STATUS_MAP = {
    awaiting: { label: "Acompte dû", cls: "s-awaiting" },
    confirmed: { label: "Confirmé", cls: "s-confirmed" },
    done: { label: "Terminé", cls: "s-done" },
    cancelled: { label: "Annulé", cls: "s-cancelled" },
  };

  const filteredRdvs = useMemo(() => {
    let result = rdvs || [];
    if (filter !== "all") {
      result = result.filter((r) => r.status === filter);
    }
    if (search) {
      result = result.filter(
        (r) =>
          r.id.toLowerCase().includes(search) ||
          r.client.name.toLowerCase().includes(search) ||
          r.service.toLowerCase().includes(search),
      );
    }
    return result;
  }, [rdvs, filter, search]);

  const handleStatusChange = (rdvId, newStatus) => {
    const updated = rdvs.map((r) =>
      r.id === rdvId ? { ...r, status: newStatus } : r,
    );
    setRdvs(updated);
    showToast("✓ Statut mis à jour");
    setSelectedRdv(null);
  };

  return (
    <div className="panel active">
      <div className="section-head">
        <div>
          <div className="section-head-title">Gestion des rendez-vous</div>
          <div className="section-head-sub">
            {filteredRdvs.length} rendez-vous
          </div>
        </div>
      </div>
      <div className="table-card">
        <div className="table-filters">
          <button
            className={`tf-tab ${filter === "all" ? "tf-active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Tous
          </button>
          <button
            className={`tf-tab ${filter === "awaiting" ? "tf-active" : ""}`}
            onClick={() => setFilter("awaiting")}
          >
            Acompte attendu
          </button>
          <button
            className={`tf-tab ${filter === "confirmed" ? "tf-active" : ""}`}
            onClick={() => setFilter("confirmed")}
          >
            Confirmés
          </button>
          <button
            className={`tf-tab ${filter === "done" ? "tf-active" : ""}`}
            onClick={() => setFilter("done")}
          >
            Terminés
          </button>
          <button
            className={`tf-tab ${filter === "cancelled" ? "tf-active" : ""}`}
            onClick={() => setFilter("cancelled")}
          >
            Annulés
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
                <th>Date RDV</th>
                <th>Heure</th>
                <th>Soin</th>
                <th>Client</th>
                <th>Acompte</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRdvs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-row">
                    Aucun rendez-vous
                  </td>
                </tr>
              ) : (
                [...filteredRdvs].reverse().map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="td-ref">{r.id}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: "13px", fontWeight: "600" }}>
                        {r.rdvDate}
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "13px",
                        }}
                      >
                        {r.slot}
                      </div>
                    </td>
                    <td>
                      <div className="td-name">{r.service}</div>
                      <div className="td-meta">Durée : {r.duration}</div>
                    </td>
                    <td>
                      <div className="td-name">{r.client.name}</div>
                      <div className="td-meta">{r.client.phone}</div>
                    </td>
                    <td>
                      <div className="td-price" style={{ color: "var(--red)" }}>
                        {r.acompte.toLocaleString("fr-FR")} FCFA
                      </div>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${STATUS_MAP[r.status]?.cls}`}
                      >
                        {STATUS_MAP[r.status]?.label}
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
                          onClick={() => setSelectedRdv(r)}
                        >
                          👁 Voir
                        </button>
                        {r.status === "awaiting" && (
                          <button
                            className="action-btn ab-confirm"
                            onClick={() =>
                              handleStatusChange(r.id, "confirmed")
                            }
                          >
                            ✓ Acompte reçu
                          </button>
                        )}
                        {r.status === "confirmed" && (
                          <button
                            className="action-btn ab-view"
                            style={{
                              background: "rgba(10, 10, 12, .07)",
                              color: "var(--ink-s)",
                            }}
                            onClick={() => handleStatusChange(r.id, "done")}
                          >
                            ✓ Terminé
                          </button>
                        )}
                        {!["cancelled", "done"].includes(r.status) && (
                          <button
                            className="action-btn ab-cancel"
                            onClick={() =>
                              handleStatusChange(r.id, "cancelled")
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

      {selectedRdv && (
        <RdvModal
          rdv={selectedRdv}
          onClose={() => setSelectedRdv(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

export default Rdvs;
