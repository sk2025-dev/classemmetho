import { useAdmin } from "../hooks/useAdmin";
import "../styles/admin.css";

const getInitial = (userProfile, currentUser) => {
  const source =
    userProfile?.name || currentUser?.name || currentUser?.email || "Admin";

  return source.trim().charAt(0).toUpperCase();
};

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
    { id: "dashboard", label: "Tableau de bord", icon: "TB" },
    { id: "orders", label: "Commandes", icon: "CO", badge: "0" },
    { id: "rdvs", label: "Rendez-vous", icon: "RD", badge: "0" },
    { id: "products", label: "Produits & Stock", icon: "PR", badge: "0" },
    { id: "beauty", label: "Beauté & Photos", icon: "BP" },
    { id: "promos", label: "Promotions", icon: "PM" },
  ];

  return (
    <aside className="sidebar">
      <div className="sb-logo">
        <img src="/images/logo.png" alt="DAVGROUP" />
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
            <span style={{ fontSize: "11px", fontWeight: 700 }}>
              {item.icon}
            </span>
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
              getInitial(userProfile, currentUser)
            )}
          </div>
          <div>
            <div className="sb-user-name">
              {userProfile?.name || currentUser?.name || currentUser?.email}
            </div>
            <div className="sb-user-role">Profil</div>
          </div>
        </button>
        <button className="sb-logout" onClick={logout}>
          <span style={{ fontSize: "12px", fontWeight: 700 }}>X</span>
          Se deconnecter
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
