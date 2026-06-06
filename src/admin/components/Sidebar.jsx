import React from "react";
import { useAdmin } from "../hooks/useAdmin";
import "../styles/admin.css";

const Sidebar = () => {
  const {
    currentUser,
    userProfile,
    logout,
    switchPanel,
    currentPanel,
    setShowProfileModal,
  } = useAdmin();

  const menuItems = [
    { id: "dashboard", label: "Tableau de bord", icon: "📊" },
    { id: "orders", label: "Commandes", icon: "📦", badge: "0" },
    { id: "rdvs", label: "Rendez-vous", icon: "📅", badge: "0" },
    { id: "products", label: "Produits & Stock", icon: "🏷️", badge: "0" },
    { id: "promos", label: "Promotions", icon: "🎁" },
  ];

  return (
    <aside className="sidebar">
      <div className="sb-logo">
        <img src="/images/beauté.png" alt="Dav'Beauté" />
        <div className="sb-logo-sub">Administration</div>
      </div>

      <nav className="sb-nav">
        <div className="sb-section-label">Principal</div>
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`sb-item ${currentPanel === item.id ? "sb-active" : ""}`}
            onClick={() => switchPanel(item.id)}
          >
            <span style={{ fontSize: "16px" }}>{item.icon}</span>
            {item.label}
            {item.badge && <span className="sb-badge">{item.badge}</span>}
          </button>
        ))}
      </nav>

      <div className="sb-footer">
        <button
          className="sb-user"
          onClick={() => setShowProfileModal(true)}
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            width: "100%",
            padding: "12px 16px",
          }}
        >
          <div className="sb-avatar">
            {userProfile?.photo ? (
              <img
                src={userProfile.photo}
                alt="Profil"
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              currentUser?.username?.[0].toUpperCase() || "A"
            )}
          </div>
          <div>
            <div className="sb-user-name">
              {userProfile?.name || currentUser?.name || "Administrateur"}
            </div>
            <div className="sb-user-role">Cliquez pour éditer</div>
          </div>
        </button>
        <button className="sb-logout" onClick={logout}>
          <span style={{ fontSize: "14px" }}>🚪</span>
          Se déconnecter
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
