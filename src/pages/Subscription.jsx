import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/api";

const SUPPORT_WHATSAPP = "5514996732253";

const PLAN_DETAILS = {
  start: {
    name: "Start",
    price: "R$ 49,90",
    period: "/mês",
    description: "Ideal para começar com agenda online.",
    professionals: 2,
    paymentUrl:
      "https://link.infinitepay.io/srjot4/VC1DLUMtUg-feblSbYGIM-49,90",
    features: [
      "Até 2 profissionais ativos",
      "Serviços ilimitados",
      "Clientes ilimitados",
      "Página pública de agendamento",
      "Cancelamento pelo cliente",
    ],
  },
  pro: {
    name: "Pro",
    price: "R$ 79,90",
    period: "/mês",
    description: "Para equipes pequenas em crescimento.",
    professionals: 5,
    paymentUrl:
      "https://link.infinitepay.io/srjot4/VC1DLUMtUg-nmehsAncbI-79,90",
    features: [
      "Até 5 profissionais ativos",
      "Tudo do plano Start",
      "Melhor para equipes",
      "Página pública de agendamento",
      "Preparado para automações futuras",
    ],
  },
  premium: {
    name: "Premium",
    price: "R$ 149,90",
    period: "/mês",
    description: "Para empresas com operação maior.",
    professionals: 15,
    paymentUrl:
      "https://link.infinitepay.io/srjot4/VC1DLUMtUg-03MK29CHcC-149,90",
    features: [
      "Até 15 profissionais ativos",
      "Tudo do plano Pro",
      "Maior limite de profissionais",
      "Preparado para WhatsApp",
      "Preparado para pagamentos",
    ],
  },
};

const PLAN_ORDER = ["start", "pro", "premium"];

export default function Subscription() {
  const [company, setCompany] = useState(null);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("pt-BR");
  }

  function getDaysUntil(value) {
    if (!value) return null;

    const today = new Date();
    const target = new Date(value);

    if (Number.isNaN(target.getTime())) return null;

    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diff = target.getTime() - today.getTime();

    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function translateSubscriptionStatus(status) {
    const statusMap = {
      trial: "Teste gratuito",
      active: "Ativa",
      overdue: "Atrasada",
      cancelled: "Cancelada",
    };

    return statusMap[status] || "Teste gratuito";
  }

  function getSubscriptionClass(status) {
    const classMap = {
      trial: "subscription-badge trial",
      active: "subscription-badge active",
      overdue: "subscription-badge overdue",
      cancelled: "subscription-badge cancelled",
    };

    return classMap[status] || "subscription-badge trial";
  }

  function getPlanKey() {
    return company?.plan || "start";
  }

  function getPlanDetails() {
    return PLAN_DETAILS[getPlanKey()] || PLAN_DETAILS.start;
  }

  function getMainDate() {
    const status = company?.subscriptionStatus || "trial";

    if (status === "trial") {
      return company?.trialEndsAt;
    }

    return company?.subscriptionEnd;
  }

  function getCompanyDocument() {
    if (!company?.document) return "Não informado";

    return company.document;
  }

  function getCompanyLocation() {
    const city = company?.city || "";
    const state = company?.state || "";

    if (!city && !state) return "Não informado";

    return [city, state].filter(Boolean).join(" / ");
  }

  function getSubscriptionMessage() {
    if (!company) return "";

    const status = company.subscriptionStatus || "trial";
    const mainDate = getMainDate();
    const days = getDaysUntil(mainDate);

    if (status === "cancelled") {
      return "Sua assinatura está cancelada. Escolha um plano abaixo para solicitar a reativação.";
    }

    if (status === "overdue") {
      return "Sua assinatura está com pagamento atrasado. Regularize para evitar bloqueios.";
    }

    if (status === "trial") {
      if (days === null) {
        return "Sua empresa está no período de teste gratuito.";
      }

      if (days < 0) {
        return "Seu período de teste gratuito terminou. Escolha um plano abaixo para continuar usando.";
      }

      return `Seu teste gratuito termina em ${days} dia${
        days === 1 ? "" : "s"
      }.`;
    }

    if (status === "active") {
      if (days === null) {
        return "Sua assinatura está ativa.";
      }

      if (days < 0) {
        return "Sua assinatura venceu. Escolha um plano abaixo para renovar.";
      }

      return `Sua assinatura vence em ${days} dia${days === 1 ? "" : "s"}.`;
    }

    return "Informações da assinatura disponíveis no painel.";
  }

  function openPaymentLink(planKey) {
    const selectedPlan = PLAN_DETAILS[planKey];

    if (!selectedPlan?.paymentUrl) {
      setMessage("Link de pagamento não configurado para este plano.");
      return;
    }

    window.open(selectedPlan.paymentUrl, "_blank", "noopener,noreferrer");
  }

  function buildSupportMessage(planKey = null) {
    const selectedPlan = planKey ? PLAN_DETAILS[planKey] : getPlanDetails();

    const lines = [
      "Olá! Acabei de realizar ou desejo confirmar o pagamento da LopeX Agenda.",
      "",
      `Empresa: ${company?.name || "Não informado"}`,
      `Slug: ${company?.slug || "Não informado"}`,
      `E-mail: ${company?.email || "Não informado"}`,
      `WhatsApp: ${company?.phone || "Não informado"}`,
      `CPF/CNPJ: ${getCompanyDocument()}`,
      `Cidade/UF: ${getCompanyLocation()}`,
      "",
      `Plano: ${selectedPlan?.name || "Não informado"}`,
      `Valor: ${selectedPlan?.price || "Não informado"}`,
      `Status atual: ${translateSubscriptionStatus(
        company?.subscriptionStatus || "trial"
      )}`,
      "",
      "Pode verificar e liberar/renovar minha assinatura?",
    ];

    return lines.join("\n");
  }

  function notifySupport(planKey = null) {
    if (!SUPPORT_WHATSAPP || SUPPORT_WHATSAPP === "5514996732253") {
      setMessage(
        "Configure o número de suporte no arquivo Subscription.jsx antes de usar este botão."
      );
      return;
    }

    const text = encodeURIComponent(buildSupportMessage(planKey));
    const url = `https://wa.me/${SUPPORT_WHATSAPP}?text=${text}`;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function loadSubscription() {
    try {
      setLoading(true);
      setMessage("");

      const [companyResponse, professionalsResponse] = await Promise.all([
        api.get("/companies/me"),
        api.get("/professionals?status=active"),
      ]);

      setCompany(companyResponse.data);
      setProfessionals(professionalsResponse.data || []);
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Erro ao carregar dados da assinatura."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubscription();
  }, []);

  const plan = getPlanDetails();
  const subscriptionStatus = company?.subscriptionStatus || "trial";
  const professionalsUsed = professionals.length;
  const professionalsLimit = plan.professionals;
  const usagePercent = Math.min(
    100,
    Math.round((professionalsUsed / professionalsLimit) * 100)
  );

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="dashboard-title-row">
          <div>
            <h1>Minha Assinatura</h1>
            <p>Veja seu plano atual, limites, pagamento e situação da assinatura.</p>
          </div>

          <button
            type="button"
            className="dashboard-refresh-button"
            onClick={loadSubscription}
            disabled={loading}
          >
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        {message && <div className="alert-message">{message}</div>}

        {loading && <div className="alert-message">Carregando assinatura...</div>}

        {!loading && company && (
          <>
            <section className="subscription-hero">
              <div>
                <span className="subscription-kicker">Plano atual</span>

                <h2>{plan.name}</h2>

                <p>{plan.description}</p>

                <div className="subscription-price">
                  <strong>{plan.price}</strong>
                  <span>{plan.period}</span>
                </div>
              </div>

              <div className="subscription-status-box">
                <span className={getSubscriptionClass(subscriptionStatus)}>
                  {translateSubscriptionStatus(subscriptionStatus)}
                </span>

                <p>{getSubscriptionMessage()}</p>

                <button
                  type="button"
                  className="subscription-primary-payment-button"
                  onClick={() => openPaymentLink(getPlanKey())}
                >
                  Pagar plano atual
                </button>
              </div>
            </section>

            <div className="subscription-grid">
              <div className="subscription-card">
                <span>Empresa</span>
                <strong>{company.name}</strong>
                <small>{company.slug}</small>
              </div>

              <div className="subscription-card">
                <span>Status</span>
                <strong>{translateSubscriptionStatus(subscriptionStatus)}</strong>
                <small>Situação atual</small>
              </div>

              <div className="subscription-card">
                <span>Trial até</span>
                <strong>{formatDate(company.trialEndsAt)}</strong>
                <small>Período gratuito</small>
              </div>

              <div className="subscription-card">
                <span>Vencimento</span>
                <strong>{formatDate(company.subscriptionEnd)}</strong>
                <small>Próximo controle</small>
              </div>
            </div>

            <section className="subscription-usage-card">
              <div className="subscription-usage-header">
                <div>
                  <h2>Uso do plano</h2>
                  <p>
                    Profissionais ativos cadastrados no limite disponível do seu
                    plano.
                  </p>
                </div>

                <strong>
                  {professionalsUsed}/{professionalsLimit}
                </strong>
              </div>

              <div className="subscription-progress">
                <div style={{ width: `${usagePercent}%` }} />
              </div>

              <small>
                {professionalsLimit - professionalsUsed > 0
                  ? `Você ainda pode cadastrar ${
                      professionalsLimit - professionalsUsed
                    } profissional${
                      professionalsLimit - professionalsUsed === 1 ? "" : "is"
                    }.`
                  : "Você atingiu o limite de profissionais do seu plano."}
              </small>
            </section>

            <section className="table-card subscription-payment-card">
              <div className="subscription-payment-header">
                <div>
                  <h2>Pagamento dos planos</h2>
                  <p>
                    Escolha o plano desejado, realize o pagamento pelo
                    InfinitePay e depois avise o suporte para liberação.
                  </p>
                </div>
              </div>

              <div className="subscription-payment-grid">
                {PLAN_ORDER.map((planKey) => {
                  const item = PLAN_DETAILS[planKey];
                  const isCurrentPlan = getPlanKey() === planKey;

                  return (
                    <div
                      key={planKey}
                      className={
                        isCurrentPlan
                          ? "subscription-payment-plan current"
                          : "subscription-payment-plan"
                      }
                    >
                      {isCurrentPlan && (
                        <span className="subscription-current-plan-badge">
                          Plano atual
                        </span>
                      )}

                      <h3>{item.name}</h3>

                      <p>{item.description}</p>

                      <div className="subscription-payment-price">
                        <strong>{item.price}</strong>
                        <span>{item.period}</span>
                      </div>

                      <small>{item.professionals} profissionais ativos</small>

                      <button
                        type="button"
                        onClick={() => openPaymentLink(planKey)}
                      >
                        Pagar {item.name}
                      </button>

                      <button
                        type="button"
                        className="secondary-action-button"
                        onClick={() => notifySupport(planKey)}
                      >
                        Já paguei, avisar suporte
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="subscription-payment-note">
                <strong>Importante:</strong>
                <span>
                  Após o pagamento, a liberação ainda é feita manualmente pelo
                  Admin Master. Guarde o comprovante caso seja solicitado.
                </span>
              </div>
            </section>

            <section className="subscription-content-grid">
              <div className="table-card subscription-features-card">
                <h2>Recursos incluídos</h2>

                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>

              <div className="table-card subscription-contact-card">
                <h2>Precisa alterar o plano?</h2>

                <p>
                  Para upgrade, renovação, pagamento ou reativação da
                  assinatura, escolha um plano acima e envie a confirmação para
                  o suporte.
                </p>

                <div className="subscription-contact-box">
                  <strong>Dados para conferência</strong>
                  <span>Empresa: {company.name}</span>
                  <span>CPF/CNPJ: {getCompanyDocument()}</span>
                  <span>Cidade/UF: {getCompanyLocation()}</span>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}