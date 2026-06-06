import React, { createContext, useState, useCallback } from "react";

export const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [currentPanel, setCurrentPanel] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Data state
  const [orders, setOrders] = useState([]);
  const [rdvs, setRdvs] = useState([]);
  const [products, setProducts] = useState([]);
  const [promos, setPromos] = useState([]);
  const [promoBar, setPromoBar] = useState("");

  // Show toast notification
  const showToast = useCallback((message = "✓ Enregistré", duration = 2600) => {
    setToast(message);
    setTimeout(() => setToast(null), duration);
  }, []);

  // Switch panel
  const switchPanel = useCallback((panelName) => {
    setCurrentPanel(panelName);
  }, []);

  // Login
  const login = useCallback((username, password) => {
    // Mock validation - in real app this would call backend
    if (
      (username === "admin" || username === "davadmin") &&
      password === "DAV2026"
    ) {
      const user = {
        name: "Administrateur",
        role: "Accès complet",
        username,
      };
      setCurrentUser(user);

      // Load profile from localStorage or create default
      const savedProfile = localStorage.getItem("dav_admin_profile");
      const profile = savedProfile
        ? JSON.parse(savedProfile)
        : {
            name: "Administrateur",
            email: "admin@davbeaute.com",
            phone: "+235 66 00 00 00",
            photo: null,
          };
      setUserProfile(profile);

      return true;
    }
    return false;
  }, []);

  // Update profile
  const updateProfile = useCallback(
    (profileData) => {
      const updated = { ...userProfile, ...profileData };
      setUserProfile(updated);
      localStorage.setItem("dav_admin_profile", JSON.stringify(updated));
      showToast("✓ Profil mis à jour");
    },
    [userProfile, showToast],
  );

  // Logout
  const logout = useCallback(() => {
    setCurrentUser(null);
    setUserProfile(null);
    setCurrentPanel("dashboard");
  }, []);

  const value = {
    // Auth
    currentUser,
    userProfile,
    updateProfile,
    login,
    logout,
    isAuthenticated: !!currentUser,

    // UI
    currentPanel,
    switchPanel,
    isLoading,
    setIsLoading,
    toast,
    showToast,
    showProfileModal,
    setShowProfileModal,

    // Data
    orders,
    setOrders,
    rdvs,
    setRdvs,
    products,
    setProducts,
    promos,
    setPromos,
    promoBar,
    setPromoBar,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};
