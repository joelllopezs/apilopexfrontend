import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("lucas@lopex.ia");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("@lopex:token", response.data.token);
      localStorage.setItem("@lopex:user", JSON.stringify(response.data.user));

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="page"
      style={{
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <form
        onSubmit={handleLogin}
        className="card"
        style={{
          width: "100%",
          maxWidth: 420,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              fontSize: 42,
              fontWeight: 900,
              letterSpacing: -2,
            }}
          >
            <span style={{ color: "#fff" }}>L</span>
            <span style={{ color: "#885AFE" }}>X</span>
          </div>

          <h1 style={{ margin: "12px 0 6px" }}>Lopex Agenda</h1>
          <p style={{ color: "#b8b8c8", margin: 0 }}>
            Acesse o painel de agendamentos
          </p>
        </div>

        <div className="grid">
          <label>
            <span style={{ display: "block", marginBottom: 8 }}>E-mail</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@lopex.ia"
            />
          </label>

          <label>
            <span style={{ display: "block", marginBottom: 8 }}>Senha</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Sua senha"
            />
          </label>

          {error && (
            <div
              style={{
                color: "#ff6b6b",
                background: "rgba(255, 107, 107, 0.1)",
                padding: 12,
                borderRadius: 12,
              }}
            >
              {error}
            </div>
          )}

          <button className="button" type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
          <button type="submit" disabled={loading}>
  {loading ? "Entrando..." : "Entrar"}
</button>

<p className="login-footer">
  Ainda não tem conta? <Link to="/register-company">Cadastrar empresa</Link>
</p>
        </div>
      </form>
    </main>
  );
}