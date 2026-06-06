import { useContext, useState, useEffect } from "react";
import { AdminProvider } from "./context/AdminContext";
import { AdminContext } from "./context/context";
import Loader from "./components/Loader";
import Login from "./components/Login";
import Layout from "./components/Layout";
import "./styles/admin.css";

const AdminContent = () => {
  const [showLoader, setShowLoader] = useState(true);
  const context = useContext(AdminContext);

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
