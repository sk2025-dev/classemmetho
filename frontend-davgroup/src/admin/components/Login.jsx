import { useState } from "react";
import { useAdmin } from "../hooks/useAdmin";
import "../styles/admin.css";

const Login = () => {
  const { login, isLoading } = useAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event?.preventDefault();
    setError("");

    const result = await login(email.trim(), password);

    if (result.ok) {
      setEmail("");
      setPassword("");
      return;
    }

    setError(result.message || "Email ou mot de passe incorrect.");
    setPassword("");
  };

  return (
    <div className="login-screen">
      <form className="login-box" onSubmit={handleLogin}>
        <img src="/images/logo.png" alt="Dav'Group" className="login-logo" />
        <div className="login-title">Espace Administration</div>
        <div className="login-sub">Acces reserve a l'equipe Dav'Beaute</div>

        <div className="login-field">
          <label className="login-label">Email</label>
          <input
            type="email"
            className="login-input"
            placeholder="email@domaine.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            disabled={isLoading}
            required
          />
        </div>

        <div className="login-field">
          <label className="login-label">Mot de passe</label>
          <input
            type="password"
            className="login-input"
            placeholder="Mot de passe"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            disabled={isLoading}
            required
          />
        </div>

        <button className="login-btn" type="submit" disabled={isLoading}>
          {isLoading ? "Connexion..." : "Connexion"}
        </button>

        {error && (
          <div className="login-err" style={{ display: "block" }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default Login;
