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
    confirmPassword: "",
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

  function onlyNumbers(value) {
    return value.replace(/\D/g, "");
  }

  function formatPhone(value) {
    const numbers = onlyNumbers(value).slice(0, 11);

    if (numbers.length <= 2) {
      return numbers;
    }

    if (numbers.length <= 6) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    }

    if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(
        6
      )}`;
    }

    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
      7
    )}`;
  }

  function isValidEmail(email) {
    if (!email) return false;

    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  function isValidPhone(phone) {
    const numbers = onlyNumbers(phone);

    return numbers.length === 10 || numbers.length === 11;
  }

  function isValidSlug(slug) {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  }

  function validateForm() {
    const userName = form.userName.trim();
    const userEmail = form.userEmail.trim();
    const password = form.password;
    const confirmPassword = form.confirmPassword;
    const companyName = form.companyName.trim();
    const companySlug = generateSlug(form.companySlug);
    const companyEmail = form.companyEmail.trim();
    const companyPhone = form.companyPhone.trim();

    if (!userName) {
      return "Informe o nome do responsável.";
    }

    if (userName.length < 3) {
      return "O nome do responsável precisa ter pelo menos 3 caracteres.";
    }

    if (!userEmail) {
      return "Informe o e-mail de acesso.";
    }

    if (!isValidEmail(userEmail)) {
      return "Informe um e-mail de acesso válido.";
    }

    if (!password) {
      return "Informe uma senha.";
    }

    if (password.length < 6) {
      return "A senha precisa ter pelo menos 6 caracteres.";
    }

    if (!confirmPassword) {
      return "Confirme sua senha.";
    }

    if (password !== confirmPassword) {
      return "As senhas não conferem.";
    }

    if (!companyName) {
      return "Informe o nome da empresa.";
    }

    if (companyName.length < 3) {
      return "O nome da empresa precisa ter pelo menos 3 caracteres.";
    }

    if (!companySlug) {
      return "Informe o slug da empresa.";
    }

    if (companySlug.length < 3) {
      return "O slug precisa ter pelo menos 3 caracteres.";
    }

    if (!isValidSlug(companySlug)) {
      return "O slug deve conter apenas letras minúsculas, números e hífen.";
    }

    if (companyEmail && !isValidEmail(companyEmail)) {
      return "Informe um e-mail da empresa válido.";
    }

    if (!companyPhone) {
      return "Informe o telefone/WhatsApp da empresa.";
    }

    if (!isValidPhone(companyPhone)) {
      return "Informe um telefone válido com DDD. Exemplo: (14) 99999-9999.";
    }

    return null;
  }

  function handleCompanyNameChange(e) {
    const companyName = e.target.value;

    setForm((prev) => ({
      ...prev,
      companyName,
      companySlug: generateSlug(companyName),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const validationError = validateForm();

      if (validationError) {
        setMessage(validationError);
        return;
      }

      const payload = {
        userName: form.userName.trim(),
        userEmail: form.userEmail.trim().toLowerCase(),
        password: form.password,
        companyName: form.companyName.trim(),
        companySlug: generateSlug(form.companySlug),
        companyEmail: form.companyEmail.trim()
          ? form.companyEmail.trim().toLowerCase()
          : null,
        companyPhone: form.companyPhone.trim(),
        logoUrl: "",
        primaryColor: form.primaryColor || "#885AFE",
      };

      const response = await api.post("/auth/register-company", payload);

      localStorage.setItem("@lopex:token", response.data.token);
      localStorage.setItem("@lopex:user", JSON.stringify(response.data.user));

      if (response.data.company) {
        localStorage.setItem(
          "@lopex:company",
          JSON.stringify(response.data.company)
        );
      }

      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      console.log("ERRO API:", error.response?.data);

      setMessage(
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
            onChange={(e) =>
              setForm({
                ...form,
                userName: e.target.value,
              })
            }
            placeholder="Ex: Carlos Admin"
            required
          />

          <label>E-mail de acesso</label>
          <input
            type="email"
            value={form.userEmail}
            onChange={(e) =>
              setForm({
                ...form,
                userEmail: e.target.value,
              })
            }
            placeholder="Ex: carlos@email.com"
            required
          />

          <label>Senha</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value,
              })
            }
            placeholder="Mínimo de 6 caracteres"
            required
          />

          <label>Confirmar senha</label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({
                ...form,
                confirmPassword: e.target.value,
              })
            }
            placeholder="Digite a senha novamente"
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
              setForm({
                ...form,
                companySlug: generateSlug(e.target.value),
              })
            }
            placeholder="Ex: barbearia-carlos"
            required
          />

          <small className="field-help">
            O link público ficará assim: /agendar/
            {form.companySlug || "nome-da-empresa"}
          </small>

          <label>E-mail da empresa</label>
          <input
            type="email"
            value={form.companyEmail}
            onChange={(e) =>
              setForm({
                ...form,
                companyEmail: e.target.value,
              })
            }
            placeholder="Ex: contato@empresa.com"
          />

          <label>Telefone / WhatsApp da empresa</label>
          <input
            value={form.companyPhone}
            onChange={(e) =>
              setForm({
                ...form,
                companyPhone: formatPhone(e.target.value),
              })
            }
            placeholder="Ex: (14) 99999-9999"
            required
          />

          <label>Cor principal</label>
          <input
            type="color"
            value={form.primaryColor}
            onChange={(e) =>
              setForm({
                ...form,
                primaryColor: e.target.value,
              })
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