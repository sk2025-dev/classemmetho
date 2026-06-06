import { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useAdmin } from "../hooks/useAdmin";
import "../styles/admin.css";

const Promos = () => {
  const { showToast } = useAdmin();
  const [promoBar, setPromoBar] = useLocalStorage(
    "dav_promoBar",
    "✦ Livraison offerte à partir de 25 000 FCFA d'achat ✦ Code : DAVBEAUTE",
  );
  const [promos, setPromos] = useLocalStorage("dav_promos", [
    {
      id: "DAVBEAUTE",
      code: "DAVBEAUTE",
      discountType: "percent",
      value: 15,
      startDate: "2026-06-01",
      endDate: "2026-06-30",
      active: true,
    },
    {
      id: "SUMMER2026",
      code: "SUMMER2026",
      discountType: "amount",
      value: 5000,
      startDate: "2026-06-15",
      endDate: "2026-08-31",
      active: true,
    },
  ]);

  const [formCode, setFormCode] = useState("");
  const [formType, setFormType] = useState("percent");
  const [formValue, setFormValue] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");

  const handleSavePromoBar = () => {
    showToast("✓ Barre de promo enregistrée");
  };

  const handleAddPromo = () => {
    if (!formCode || !formValue || !formStart || !formEnd) {
      showToast("⚠ Remplissez tous les champs", 3000);
      return;
    }

    const newPromo = {
      id: formCode,
      code: formCode.toUpperCase(),
      discountType: formType,
      value: parseInt(formValue),
      startDate: formStart,
      endDate: formEnd,
      active: true,
    };

    setPromos([...promos, newPromo]);
    setFormCode("");
    setFormValue("");
    setFormStart("");
    setFormEnd("");
    showToast("✓ Code promo créé");
  };

  const handleTogglePromo = (id) => {
    const updated = promos.map((p) =>
      p.id === id ? { ...p, active: !p.active } : p,
    );
    setPromos(updated);
    showToast("✓ Statut du code mis à jour");
  };

  const handleDeletePromo = (id) => {
    setPromos(promos.filter((p) => p.id !== id));
    showToast("✓ Code promo supprimé");
  };

  return (
    <div className="panel active">
      <div className="section-head">
        <div>
          <div className="section-head-title">Promotions &amp; Codes promo</div>
          <div className="section-head-sub">
            {promos.filter((p) => p.active).length} code(s) actif(s)
          </div>
        </div>
      </div>

      <div className="promobar-editor" style={{ marginBottom: "24px" }}>
        <div className="promo-card-title">
          Barre de promotion (haut du site)
        </div>
        <div className="admin-field">
          <label className="admin-label">Texte de la barre</label>
          <input
            type="text"
            className="admin-inp"
            value={promoBar}
            onChange={(e) => setPromoBar(e.target.value)}
            placeholder="Entrez le texte de promotion..."
          />
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            className="action-btn ab-primary"
            onClick={handleSavePromoBar}
          >
            💾 Enregistrer
          </button>
          <span style={{ fontSize: "12px", color: "var(--ink-m)" }}>
            Aperçu :
          </span>
        </div>
        <div className="promobar-preview">{promoBar}</div>
      </div>

      <div className="promos-layout">
        <div className="promo-form-card">
          <div className="promo-card-title">Créer un code promo</div>
          <div className="admin-field">
            <label className="admin-label">Code promo</label>
            <input
              type="text"
              className="admin-inp"
              value={formCode}
              onChange={(e) => setFormCode(e.target.value)}
              placeholder="ex: DAVBEAUTE"
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div className="admin-field">
              <label className="admin-label">Type de réduction</label>
              <select
                className="admin-sel"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
              >
                <option value="percent">Pourcentage (%)</option>
                <option value="amount">Montant fixe (FCFA)</option>
              </select>
            </div>
            <div className="admin-field">
              <label className="admin-label">Valeur</label>
              <input
                type="number"
                className="admin-inp"
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                placeholder={formType === "percent" ? "15" : "5000"}
              />
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div className="admin-field">
              <label className="admin-label">Date début</label>
              <input
                type="date"
                className="admin-inp"
                value={formStart}
                onChange={(e) => setFormStart(e.target.value)}
              />
            </div>
            <div className="admin-field">
              <label className="admin-label">Date fin</label>
              <input
                type="date"
                className="admin-inp"
                value={formEnd}
                onChange={(e) => setFormEnd(e.target.value)}
              />
            </div>
          </div>
          <button
            className="action-btn ab-primary"
            style={{ width: "100%", marginTop: "12px" }}
            onClick={handleAddPromo}
          >
            ➕ Ajouter le code
          </button>
        </div>

        <div>
          <div className="promo-card-title" style={{ marginBottom: "14px" }}>
            Codes actifs
          </div>
          <div className="promo-list-card">
            {promos.length === 0 ? (
              <div className="empty-row">Aucun code promo</div>
            ) : (
              promos.map((p) => (
                <div
                  key={p.id}
                  className={`promo-item ${!p.active ? "promo-inactive" : ""}`}
                >
                  <div className="promo-item-main">
                    <div className="promo-item-code">{p.code}</div>
                    <div className="promo-item-detail">
                      {p.discountType === "percent"
                        ? `${p.value}% de réduction`
                        : `${p.value.toLocaleString("fr-FR")} FCFA de réduction`}
                    </div>
                    <div className="promo-item-dates">
                      {p.startDate} → {p.endDate}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      className="action-btn ab-confirm"
                      onClick={() => handleTogglePromo(p.id)}
                      style={
                        !p.active
                          ? {
                              background: "rgba(255, 178, 0, .15)",
                              color: "var(--warn)",
                            }
                          : {
                              background: "rgba(34, 197, 94, .15)",
                              color: "var(--success)",
                            }
                      }
                    >
                      {p.active ? "✓ Actif" : "⊘ Inactif"}
                    </button>
                    <button
                      className="action-btn ab-cancel"
                      onClick={() => handleDeletePromo(p.id)}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Promos;
