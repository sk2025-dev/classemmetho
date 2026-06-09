import { useState, useCallback, useEffect } from "react";
import { AdminContext } from "./context";
import { adminApi } from "../utils/api";

const getProfileStorageKey = (user) =>
  user?.id ? `dav_admin_profile_${user.id}` : null;

const readLocalProfile = (storageKey) => {
  if (!storageKey) return {};

  try {
    const savedProfile = localStorage.getItem(storageKey);
    return savedProfile ? JSON.parse(savedProfile) : {};
  } catch {
    return {};
  }
};

const buildUserProfile = (user) => {
  if (!user) return null;

  const localProfile = readLocalProfile(getProfileStorageKey(user));

  return {
    id: user.id,
    name: user.name || "",
    email: user.email || "",
    photo: localProfile.photo || null,
    phone: localProfile.phone || "",
    bio: localProfile.bio || "",
  };
};

export const AdminProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [currentPanel, setCurrentPanel] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState("");
  const [toast, setToast] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Data state
  const [orders, setOrders] = useState([]);
  const [rdvs, setRdvs] = useState([]);
  const [products, setProducts] = useState([]);
  const [promos, setPromos] = useState([]);
  const [promoBar, setPromoBar] = useState("");

  // Show toast notification
  const showToast = useCallback((message = "Enregistre", duration = 2600) => {
    setToast(message);
    setTimeout(() => setToast(null), duration);
  }, []);

  // Switch panel
  const switchPanel = useCallback((panelName) => {
    setCurrentPanel(panelName);
  }, []);

  const setAuthenticatedUser = useCallback((user) => {
    setCurrentUser(user);
    setUserProfile(buildUserProfile(user));
  }, []);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const user = await adminApi.user();
        if (isMounted) {
          setAuthenticatedUser(user);
        }
      } catch (error) {
        if (isMounted && error.status !== 401) {
          setAuthError(error.message);
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [setAuthenticatedUser]);

  // Login
  const login = useCallback(
    async (email, password) => {
      setAuthError("");
      setIsLoading(true);

      try {
        const data = await adminApi.login(email, password);
        setAuthenticatedUser(data.user);
        return { ok: true };
      } catch (error) {
        setAuthError(error.message);
        return { ok: false, message: error.message };
      } finally {
        setIsLoading(false);
      }
    },
    [setAuthenticatedUser],
  );

  // Update local profile fields that do not exist yet in the backend.
  const updateProfile = useCallback(
    (profileData) => {
      const localProfile = {
        photo: profileData.photo || null,
        phone: profileData.phone || "",
        bio: profileData.bio || "",
      };
      const updated = {
        ...userProfile,
        ...localProfile,
      };
      const storageKey = getProfileStorageKey(currentUser);

      setUserProfile(updated);
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(localProfile));
      }
      showToast("Profil mis a jour");
    },
    [currentUser, userProfile, showToast],
  );

  // Logout
  const logout = useCallback(async () => {
    try {
      await adminApi.logout();
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setCurrentUser(null);
      setUserProfile(null);
      setCurrentPanel("dashboard");
    }
  }, []);

  const value = {
    // Auth
    currentUser,
    userProfile,
    updateProfile,
    login,
    logout,
    isAuthenticated: !!currentUser,
    isCheckingAuth,
    authError,

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
