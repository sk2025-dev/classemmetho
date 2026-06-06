import React, { useState, useEffect } from "react";
import { AdminProvider, AdminContext } from "./context/AdminContext";
import { useLocalStorage } from "./hooks/useLocalStorage";
import Loader from "./components/Loader";
import Login from "./components/Login";
import Layout from "./components/Layout";
import { MOCK_ORDERS, MOCK_RDVS, MOCK_PRODUCTS } from "./utils/constants";
import "./styles/admin.css";

const AdminContent = () => {
  const [showLoader, setShowLoader] = useState(true);
  const [seeded, setSeed] = useLocalStorage("dav_seeded", false);
  const [orders] = useLocalStorage("dav_orders", MOCK_ORDERS);
  const [rdvs] = useLocalStorage("dav_rdvs", MOCK_RDVS);
  const [products] = useLocalStorage("dav_products", MOCK_PRODUCTS);
  const context = React.useContext(AdminContext);

  useEffect(() => {
    // Complete loader animation
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 2600);
    return () => clearTimeout(timer);
  }, []);

  if (showLoader) {
    return <Loader onComplete={() => setShowLoader(false)} />;
  }

  if (!context.isAuthenticated) {
    return <Login />;
  }

  return <Layout />;
};

const Admin = () => {
  return (
    <AdminProvider>
      <AdminContent />
    </AdminProvider>
  );
};

export default Admin;
