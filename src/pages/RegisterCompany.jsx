import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";

export default function RegisterCompany() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    userName: "",
    userEmail: "",
    password: "",
    companyName: "",
    companySlug: "",
    companyEmail: "",
    companyPhone: "",
    primaryColor: "#885AFE",
  });

  function generateSlug(value) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  function handleCompanyNameChange(e) {
    const companyName = e.target.value;

    setForm({
      ...form,
      companyName,
      companySlug: generateSlug(companyName),
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await api.post("/auth/register-company", {
        userName: form.userName,
        userEmail: form.userEmail,
        password: form.password,
        companyName: form.companyName,
        companySlug: form.companySlug,
        companyEmail: form.companyEmail || null,
        companyPhone: form.companyPhone || null,
        logoUrl: "",
        primaryColor: form.primaryColor || "#885AFE",
      });

      localStorage.setItem("@lopex:token", response.data.token);
      localStorage.setItem("@lopex:user", JSON.stringify(response.data.user));

      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      console.log("ERRO API:", error.response?.data);

      setMessage(
          error.response?.data?.message ||
            error.response?.data?.message ||
            "Erro ao cadastrar empresa. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card register-card">
        <div className="login-brand">
          <div className="brand-icon">LX</div>

          <div>
            <h1>Criar conta</h1>
            <p>Cadastre sua empresa na LopeX Agenda</p>
          </div>
        </div>

        {message && <div className="alert-message">{message}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-section-title">Dados do responsável</div>

          <label>Nome do responsável</label>
          <input
            value={form.userName}
            onChange={(e) => setForm({ ...form, userName: e.target.value })}
            placeholder="Ex: Carlos Admin"
            required
          />

          <label>E-mail de acesso</label>
          <input
            type="email"
            value={form.userEmail}
            onChange={(e) => setForm({ ...form, userEmail: e.target.value })}
            placeholder="Ex: carlos@email.com"
            required
          />

          <label>Senha</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Digite uma senha"
            required
          />

          <div className="form-section-title">Dados da empresa</div>

          <label>Nome da empresa</label>
          <input
            value={form.companyName}
            onChange={handleCompanyNameChange}
            placeholder="Ex: Barbearia do Carlos"
            required
          />

          <label>Slug da empresa</label>
          <input
            value={form.companySlug}
            onChange={(e) =>
              setForm({ ...form, companySlug: generateSlug(e.target.value) })
            }
            placeholder="Ex: barbearia-carlos"
            required
          />

          <label>E-mail da empresa</label>
          <input
            type="email"
            value={form.companyEmail}
            onChange={(e) =>
              setForm({ ...form, companyEmail: e.target.value })
            }
            placeholder="Ex: contato@empresa.com"
          />

          <label>Telefone da empresa</label>
          <input
            value={form.companyPhone}
            onChange={(e) =>
              setForm({ ...form, companyPhone: e.target.value })
            }
            placeholder="Ex: (14) 99999-9999"
          />

          <label>Cor principal</label>
          <input
            type="color"
            value={form.primaryColor}
            onChange={(e) =>
              setForm({ ...form, primaryColor: e.target.value })
            }
          />

          <button type="submit" disabled={loading}>
            {loading ? "Criando conta..." : "Criar minha empresa"}
          </button>
        </form>

        <p className="login-footer">
          Já tem conta? <Link to="/">Entrar no painel</Link>
        </p>
      </div>
    </div>
  );
}