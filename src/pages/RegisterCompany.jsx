import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

const PLANS = [
  {
    id: "start",
    icon: "○",
    name: "Start",
    price: "R$ 49,90",
    period: "/mês",
    description: "Ideal para começar com agenda online.",
    professionals: "Até 2 profissionais",
    features: [
      "Serviços ilimitados",
      "Clientes ilimitados",
      "Página pública de agendamento",
      "Cancelamento pelo cliente",
    ],
  },
  {
    id: "pro",
    icon: "◇",
    name: "Pro",
    price: "R$ 79,90",
    period: "/mês",
    description: "Para equipes pequenas em crescimento.",
    professionals: "Até 5 profissionais",
    features: [
      "Tudo do Start",
      "Mais profissionais ativos",
      "Melhor para equipes",
      "Preparado para automações futuras",
    ],
    featured: true,
  },
  {
    id: "premium",
    icon: "✦",
    name: "Premium",
    price: "R$ 149,90",
    period: "/mês",
    description: "Para empresas com operação maior.",
    professionals: "Até 15 profissionais",
    features: [
      "Tudo do Pro",
      "Maior limite de profissionais",
      "Preparado para WhatsApp",
      "Preparado para pagamentos",
    ],
  },
];

export default function RegisterCompany() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const initialForm = {
    plan: "start",
    userName: "",
    userEmail: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    companySlug: "",
    companyEmail: "",
    companyPhone: "",
    primaryColor: "#885AFE",
  };

  const [form, setForm] = useState(initialForm);

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

  function isValidPlan(plan) {
    return ["start", "pro", "premium"].includes(plan);
  }

  function getSelectedPlanName() {
    const selectedPlan = PLANS.find((plan) => plan.id === form.plan);

    return selectedPlan?.name || "Start";
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

    if (!isValidPlan(form.plan)) {
      return "Selecione um plano válido.";
    }

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
      setSuccess(false);

      const validationError = validateForm();

      if (validationError) {
        setMessage(validationError);
        return;
      }

      const payload = {
        plan: form.plan,
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

      await api.post("/auth/register-company", payload);

      localStorage.removeItem("@lopex:token");
      localStorage.removeItem("@lopex:user");
      localStorage.removeItem("@lopex:company");

      const selectedPlanName = getSelectedPlanName();

      setForm(initialForm);
      setSuccess(true);

      setMessage(
        `Cadastro realizado com sucesso no plano ${selectedPlanName}. Sua empresa está aguardando liberação do Admin Master. Após a liberação, você poderá entrar no painel.`
      );
    } catch (error) {
      console.error(error);
      console.log("ERRO API:", error.response?.data);

      setSuccess(false);

      setMessage(
        error.response?.data?.message ||
          "Erro ao cadastrar empresa. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page register-company-page">
      <div className="login-card register-card register-company-card">
        <div className="login-brand">
          <div className="brand-icon">LX</div>

          <div>
            <h1>Criar conta</h1>
            <p>Cadastre sua empresa na LopeX Agenda</p>
          </div>
        </div>

        {message && (
          <div
            className={success ? "alert-message success-message" : "alert-message"}
          >
            {message}
          </div>
        )}

        {success ? (
          <div className="login-form">
            <div className="form-section-title">Cadastro enviado</div>

            <p className="field-help">
              Sua empresa foi cadastrada, mas ainda precisa ser liberada pelo
              Admin Master. Depois da liberação, use o e-mail e senha
              cadastrados para acessar o painel.
            </p>

            <Link to="/" className="public-submit-button login-link-button">
              Ir para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-section-title">Escolha seu plano</div>

            <div className="register-plan-grid">
              {PLANS.map((plan) => {
                const selected = form.plan === plan.id;

                return (
                  <button
                    key={plan.id}
                    type="button"
                    className={[
                      "register-plan-card",
                      selected ? "selected" : "",
                      plan.featured ? "featured" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() =>
                      setForm({
                        ...form,
                        plan: plan.id,
                      })
                    }
                  >
                    {plan.featured && (
                      <span className="register-plan-highlight">
                        Mais escolhido
                      </span>
                    )}

                    {selected && <span className="register-plan-check">✓</span>}

                    <div className="register-plan-top">
                      <div className="register-plan-icon">{plan.icon}</div>

                      <div className="register-plan-title">
                        <strong>{plan.name}</strong>
                        <p>{plan.description}</p>
                      </div>
                    </div>

                    <div className="register-plan-price">
                      <strong>{plan.price}</strong>
                      <span>{plan.period}</span>
                    </div>

                    <div className="register-plan-limit">
                      {plan.professionals}
                    </div>

                    <ul>
                      {plan.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>

                    <span className="register-plan-button">
                      {selected ? "Plano selecionado" : "Escolher este plano"}
                    </span>
                  </button>
                );
              })}
            </div>

            <small className="field-help">
              O cadastro será enviado para aprovação. O Admin Master poderá
              confirmar ou alterar o plano antes da liberação.
            </small>

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
        )}

        <p className="login-footer">
          Já tem conta? <Link to="/">Entrar no painel</Link>
        </p>
      </div>
    </div>
  );
}