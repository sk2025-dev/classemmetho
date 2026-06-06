import React, { useState } from "react";
import { useAdmin } from "../hooks/useAdmin";
import "../styles/admin.css";

const Login = () => {
  const { login } = useAdmin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleLogin = () => {
    setError(false);
    if (login(username, password)) {
      setUsername("");
      setPassword("");
    } else {
      setError(true);
      setPassword("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="login-screen">
      <div className="login-box">
        <img src="/images/beauté.png" alt="Dav'Beauté" className="login-logo" />
        <div className="login-title">Espace Administration</div>
        <div className="login-sub">Accès réservé à l'équipe Dav'Beauté</div>

        <div className="login-field">
          <label className="login-label">Identifiant</label>
          <input
            type="text"
            className="login-input"
            placeholder="admin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="login-field">
          <label className="login-label">Mot de passe</label>
          <input
            type="password"
            className="login-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            autoComplete="current-password"
          />
        </div>

        <button className="login-btn" onClick={handleLogin}>
          Connexion
        </button>

        {error && (
          <div className="login-err" style={{ display: "block" }}>
            Identifiant ou mot de passe incorrect.
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
