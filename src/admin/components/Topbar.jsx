import React, { useEffect, useState } from "react";
import { useAdmin } from "../hooks/useAdmin";
import "../styles/admin.css";

const Topbar = () => {
  const { currentPanel } = useAdmin();
  const [date, setDate] = useState("");

  useEffect(() => {
    const d = new Date();
    const dateStr = d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    setDate(dateStr);
  }, []);

  const TITLES = {
    dashboard: "Tableau de bord",
    orders: "Commandes",
    rdvs: "Rendez-vous",
    products: "Produits & Stock",
    promos: "Promotions",
  };

  return (
    <div className="topbar">
      <div className="topbar-title">
        {TITLES[currentPanel] || "Tableau de bord"}
      </div>
      <div className="topbar-right">
        <span className="alert-dot"></span>
        <div className="topbar-date">{date}</div>
      </div>
    </div>
  );
};

export default Topbar;
