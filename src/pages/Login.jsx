import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function clearSession() {
    localStorage.removeItem("@lopex:token");
    localStorage.removeItem("@lopex:user");
    localStorage.removeItem("@lopex:company");
  }

  function getFriendlyError(error) {
    const apiMessage = error.response?.data?.message;

    if (!apiMessage) {
      return "Não foi possível fazer login. Verifique sua conexão e tente novamente.";
    }

    if (apiMessage.toLowerCase().includes("empresa inativa")) {
      return "Sua empresa ainda está aguardando liberação do Admin Master.";
    }

    if (apiMessage.toLowerCase().includes("usuário inativo")) {
      return "Seu usuário está inativo. Entre em contato com o administrador.";
    }

    if (
      apiMessage.toLowerCase().includes("senha inválidos") ||
      apiMessage.toLowerCase().includes("senha inválida") ||
      apiMessage.toLowerCase().includes("e-mail ou senha")
    ) {
      return "E-mail ou senha inválidos.";
    }

    return apiMessage;
  }

  async function handleLogin(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");
      clearSession();

      if (!email.trim() || !password) {
        setMessage("Informe e-mail e senha para entrar.");
        return;
      }

      const response = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      const user = response.data.user;

      localStorage.setItem("@lopex:token", response.data.token);
      localStorage.setItem("@lopex:user", JSON.stringify(user));

      if (user.company) {
        localStorage.setItem("@lopex:company", JSON.stringify(user.company));

        if (user.company.primaryColor) {
          document.documentElement.style.setProperty(
            "--primary-color",
            user.company.primaryColor
          );
        }
      }

      if (user.role === "super_admin") {
        navigate("/admin");
        return;
      }

      navigate("/dashboard");
    } catch (error) {
      console.error(error);

      clearSession();
      setMessage(getFriendlyError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-shell">
        <div className="login-side-panel">
          <div className="login-side-brand">
            <div className="brand-icon">LX</div>

            <div>
              <strong>LopeX Agenda</strong>
              <span>Sistema de agendamentos online</span>
            </div>
          </div>

          <div className="login-side-content">
            <h1>Organize sua agenda em poucos cliques.</h1>

            <p>
              Cadastre serviços, profissionais, horários de funcionamento e
              receba agendamentos pelo link público da sua empresa.
            </p>

            <div className="login-benefits">
              <div>
                <strong>✓</strong>
                <span>Link público de agendamento</span>
              </div>

              <div>
                <strong>✓</strong>
                <span>Painel com status dos horários</span>
              </div>

              <div>
                <strong>✓</strong>
                <span>Controle por empresa com Admin Master</span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="login-card">
          <div className="login-brand">
            <div className="brand-icon">LX</div>

            <div>
              <h1>Entrar no painel</h1>
              <p>Acesse sua conta para gerenciar agendamentos.</p>
            </div>
          </div>

          {message && <div className="alert-message">{message}</div>}

          <div className="login-form">
            <label>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seuemail@empresa.com"
              required
            />

            <label>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua senha"
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </div>

          <div className="login-divider">
            <span>ou</span>
          </div>

          <Link to="/register-company" className="create-account-button">
            Cadastrar minha empresa
          </Link>

          <p className="login-footer">
            Empresa aguardando liberação? Depois que o Admin Master ativar, você
            poderá entrar normalmente.
          </p>
        </form>
      </section>
    </main>
  );
}