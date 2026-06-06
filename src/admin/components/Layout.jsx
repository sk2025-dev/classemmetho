import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Toast from "./Toast";
import ProfileModal from "./ProfileModal";
import Dashboard from "../pages/Dashboard";
import Orders from "../pages/Orders";
import Rdvs from "../pages/Rdvs";
import Products from "../pages/Products";
import Promos from "../pages/Promos";
import { useAdmin } from "../hooks/useAdmin";
import "../styles/admin.css";

const Layout = () => {
  const { currentPanel } = useAdmin();

  const renderPanel = () => {
    switch (currentPanel) {
      case "dashboard":
        return <Dashboard />;
      case "orders":
        return <Orders />;
      case "rdvs":
        return <Rdvs />;
      case "products":
        return <Products />;
      case "promos":
        return <Promos />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        <div className="content-area">{renderPanel()}</div>
      </main>
      <Toast />
      <ProfileModal />
    </div>
  );
};

export default Layout;
