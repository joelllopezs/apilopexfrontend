import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/api";

export default function Dashboard() {
  const [summary, setSummary] = useState({
    services: 0,
    professionals: 0,
    clients: 0,
    appointments: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    todayAppointments: 0,
  });

  const [company, setCompany] = useState(null);
  const [nextAppointments, setNextAppointments] = useState([]);
  const [todayList, setTodayList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("@lopex:user") || "{}");

  function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function formatDate(value) {
    if (!value) return "—";

    if (String(value).includes("-") && !String(value).includes("T")) {
      const [year, month, day] = value.split("-");
      return `${day}/${month}/${year}`;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("pt-BR");
  }

  function translateStatus(status) {
    const statusMap = {
      pending: "Pendente",
      confirmed: "Confirmado",
      cancelled: "Cancelado",
      completed: "Concluído",
    };

    return statusMap[status] || status;
  }

  function translatePlan(plan) {
    const planMap = {
      start: "Start",
      pro: "Pro",
      premium: "Premium",
    };

    return planMap[plan] || "Start";
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

  function getStatusClass(status) {
    const statusClassMap = {
      pending: "status-badge pending",
      confirmed: "status-badge active",
      cancelled: "status-badge blocked",
      completed: "status-badge completed",
    };

    return statusClassMap[status] || "status-badge";
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

  function getPlanLimit(plan) {
    const limits = {
      start: 2,
      pro: 5,
      premium: 15,
    };

    return limits[plan] || 2;
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

  function getSubscriptionAlert() {
    if (!company) return null;

    const status = company.subscriptionStatus || "trial";

    if (status === "cancelled") {
      return {
        type: "danger",
        icon: "!",
        title: "Assinatura cancelada",
        text: "Sua assinatura está cancelada. A criação e alteração de dados podem ficar bloqueadas até a reativação.",
        action: "Entre em contato com o suporte para reativar sua assinatura.",
      };
    }

    if (status === "overdue") {
      return {
        type: "danger",
        icon: "!",
        title: "Pagamento atrasado",
        text: "Sua assinatura está marcada como atrasada. Novos cadastros, alterações e agendamentos podem ficar bloqueados.",
        action: "Regularize o pagamento para liberar o uso completo do sistema.",
      };
    }

    if (status === "trial") {
      const days = getDaysUntil(company.trialEndsAt);

      if (days === null) {
        return {
          type: "info",
          icon: "i",
          title: "Teste gratuito ativo",
          text: "Sua empresa está no período de teste gratuito.",
          action: "Acompanhe o prazo para evitar bloqueio ao final do teste.",
        };
      }

      if (days < 0) {
        return {
          type: "danger",
          icon: "!",
          title: "Teste gratuito vencido",
          text: "Seu período de teste gratuito terminou. Algumas ações podem ficar bloqueadas até a regularização da assinatura.",
          action: "Entre em contato para ativar um plano e continuar usando a agenda.",
        };
      }

      if (days === 0) {
        return {
          type: "warning",
          icon: "!",
          title: "Teste vence hoje",
          text: "Seu teste gratuito termina hoje.",
          action: "Regularize sua assinatura para continuar usando a plataforma sem interrupção.",
        };
      }

      if (days <= 3) {
        return {
          type: "warning",
          icon: "!",
          title: "Teste perto de vencer",
          text: `Seu teste gratuito termina em ${days} dia${
            days === 1 ? "" : "s"
          }.`,
          action: "Defina o plano antes do vencimento para evitar bloqueios.",
        };
      }

      return {
        type: "info",
        icon: "i",
        title: "Teste gratuito ativo",
        text: `Seu teste gratuito termina em ${days} dias.`,
        action: "Acompanhe seu prazo na tela Minha Assinatura.",
      };
    }

    if (status === "active") {
      const days = getDaysUntil(company.subscriptionEnd);

      if (days !== null && days < 0) {
        return {
          type: "danger",
          icon: "!",
          title: "Assinatura vencida",
          text: "Sua assinatura passou da data de vencimento.",
          action: "Regularize a renovação para evitar bloqueios no sistema.",
        };
      }

      if (days === 0) {
        return {
          type: "warning",
          icon: "!",
          title: "Assinatura vence hoje",
          text: "Sua assinatura vence hoje.",
          action: "Renove para manter o acesso sem interrupção.",
        };
      }

      if (days !== null && days <= 5) {
        return {
          type: "warning",
          icon: "!",
          title: "Assinatura perto do vencimento",
          text: `Sua assinatura vence em ${days} dia${days === 1 ? "" : "s"}.`,
          action: "Programe a renovação para evitar bloqueios.",
        };
      }

      return {
        type: "success",
        icon: "✓",
        title: "Assinatura ativa",
        text: "Sua assinatura está ativa e liberada para uso.",
        action: "Nenhuma ação necessária no momento.",
      };
    }

    return null;
  }

  function getPlanUsageAlert() {
    const plan = company?.plan || user.company?.plan || "start";
    const professionalLimit = getPlanLimit(plan);
    const usedProfessionals = summary.professionals;

    if (usedProfessionals >= professionalLimit) {
      return {
        type: "warning",
        title: "Limite de profissionais atingido",
        text: `Seu plano ${translatePlan(
          plan
        )} permite até ${professionalLimit} profissional${
          professionalLimit === 1 ? "" : "is"
        } ativo${professionalLimit === 1 ? "" : "s"}.`,
      };
    }

    if (usedProfessionals === professionalLimit - 1) {
      return {
        type: "info",
        title: "Você está perto do limite do plano",
        text: `Sua empresa está usando ${usedProfessionals}/${professionalLimit} profissionais ativos.`,
      };
    }

    return null;
  }

  function getFutureAppointments(appointments) {
    const today = getTodayDate();

    return appointments
      .filter((appointment) => {
        return (
          appointment.date >= today &&
          appointment.status !== "cancelled" &&
          appointment.status !== "completed"
        );
      })
      .sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }

        return a.startTime.localeCompare(b.startTime);
      })
      .slice(0, 8);
  }

  async function loadDashboard() {
    try {
      setLoading(true);
      setMessage("");

      const today = getTodayDate();

      const [
        servicesResponse,
        professionalsResponse,
        clientsResponse,
        appointmentsResponse,
        companyResponse,
      ] = await Promise.all([
        api.get("/services?status=active"),
        api.get("/professionals?status=active"),
        api.get("/clients"),
        api.get("/appointments"),
        api.get("/companies/me").catch(() => null),
      ]);

      const appointments = appointmentsResponse.data || [];

      const pending = appointments.filter(
        (appointment) => appointment.status === "pending"
      ).length;

      const confirmed = appointments.filter(
        (appointment) => appointment.status === "confirmed"
      ).length;

      const completed = appointments.filter(
        (appointment) => appointment.status === "completed"
      ).length;

      const cancelled = appointments.filter(
        (appointment) => appointment.status === "cancelled"
      ).length;

      const todayAppointments = appointments.filter(
        (appointment) =>
          appointment.date === today && appointment.status !== "cancelled"
      );

      setSummary({
        services: servicesResponse.data.length,
        professionals: professionalsResponse.data.length,
        clients: clientsResponse.data.length,
        appointments: appointments.length,
        pending,
        confirmed,
        completed,
        cancelled,
        todayAppointments: todayAppointments.length,
      });

      setTodayList(
        todayAppointments.sort((a, b) =>
          a.startTime.localeCompare(b.startTime)
        )
      );

      setNextAppointments(getFutureAppointments(appointments));

      if (companyResponse?.data) {
        setCompany(companyResponse.data);
      }
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message || "Erro ao carregar dados do dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const plan = company?.plan || user.company?.plan || "start";
  const subscriptionStatus =
    company?.subscriptionStatus || user.company?.subscriptionStatus || "trial";
  const professionalLimit = getPlanLimit(plan);
  const usedProfessionals = summary.professionals;
  const remainingProfessionals = Math.max(
    0,
    professionalLimit - usedProfessionals
  );
  const usagePercent = Math.min(
    100,
    Math.round((usedProfessionals / professionalLimit) * 100)
  );

  const subscriptionAlert = getSubscriptionAlert();
  const planUsageAlert = getPlanUsageAlert();

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="dashboard-title-row">
          <div>
            <h1>Dashboard</h1>

            <p>
              Bem-vindo, {user.name || "usuário"}. Empresa:{" "}
              {company?.name || user.company?.name || "—"}
            </p>
          </div>

          <button
            type="button"
            className="dashboard-refresh-button"
            onClick={loadDashboard}
            disabled={loading}
          >
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        {message && <div className="alert-message">{message}</div>}

        {subscriptionAlert && (
          <div
            className={`company-subscription-alert enhanced ${subscriptionAlert.type}`}
          >
            <div className="company-subscription-alert-icon">
              {subscriptionAlert.icon}
            </div>

            <div>
              <strong>{subscriptionAlert.title}</strong>
              <span>{subscriptionAlert.text}</span>
              <small>{subscriptionAlert.action}</small>
            </div>
          </div>
        )}

        {planUsageAlert && (
          <div className={`company-subscription-alert enhanced ${planUsageAlert.type}`}>
            <div className="company-subscription-alert-icon">
              {planUsageAlert.type === "warning" ? "!" : "i"}
            </div>

            <div>
              <strong>{planUsageAlert.title}</strong>
              <span>{planUsageAlert.text}</span>
              <small>
                Para aumentar o limite, solicite alteração de plano ao suporte.
              </small>
            </div>
          </div>
        )}

        <section className="company-plan-panel enhanced-plan-panel">
          <div className="company-plan-main">
            <div>
              <span className="company-plan-kicker">Plano atual</span>
              <h2>{translatePlan(plan)}</h2>
              <p>
                Sua empresa está usando o plano {translatePlan(plan)} na LopeX
                Agenda.
              </p>
            </div>

            <span className={getSubscriptionClass(subscriptionStatus)}>
              {translateSubscriptionStatus(subscriptionStatus)}
            </span>
          </div>

          <div className="company-plan-progress-area">
            <div>
              <strong>Uso de profissionais</strong>
              <span>
                {usedProfessionals}/{professionalLimit} profissionais ativos
              </span>
            </div>

            <div className="company-plan-progress">
              <div style={{ width: `${usagePercent}%` }} />
            </div>

            <small>
              {remainingProfessionals > 0
                ? `Ainda restam ${remainingProfessionals} profissional${
                    remainingProfessionals === 1 ? "" : "is"
                  } no seu plano.`
                : "Você atingiu o limite de profissionais do seu plano."}
            </small>
          </div>

          <div className="company-plan-grid">
            <div className="company-plan-info">
              <span>Profissionais ativos</span>
              <strong>
                {usedProfessionals}/{professionalLimit}
              </strong>
              <small>limite do plano</small>
            </div>

            <div className="company-plan-info">
              <span>Trial até</span>
              <strong>{formatDate(company?.trialEndsAt)}</strong>
              <small>período gratuito</small>
            </div>

            <div className="company-plan-info">
              <span>Início da assinatura</span>
              <strong>{formatDate(company?.subscriptionStart)}</strong>
              <small>data registrada</small>
            </div>

            <div className="company-plan-info">
              <span>Vencimento</span>
              <strong>{formatDate(company?.subscriptionEnd)}</strong>
              <small>próximo controle</small>
            </div>
          </div>
        </section>

        <div className="dashboard-cards">
          <div className="dashboard-card">
            <span>Hoje</span>
            <strong>{summary.todayAppointments}</strong>
            <small>agendamentos</small>
          </div>

          <div className="dashboard-card">
            <span>Pendentes</span>
            <strong>{summary.pending}</strong>
            <small>aguardando confirmação</small>
          </div>

          <div className="dashboard-card">
            <span>Confirmados</span>
            <strong>{summary.confirmed}</strong>
            <small>horários confirmados</small>
          </div>

          <div className="dashboard-card">
            <span>Concluídos</span>
            <strong>{summary.completed}</strong>
            <small>atendimentos finalizados</small>
          </div>
        </div>

        <div className="dashboard-cards secondary-cards">
          <div className="dashboard-card">
            <span>Serviços ativos</span>
            <strong>{summary.services}</strong>
          </div>

          <div className="dashboard-card">
            <span>Profissionais ativos</span>
            <strong>{summary.professionals}</strong>
          </div>

          <div className="dashboard-card">
            <span>Clientes</span>
            <strong>{summary.clients}</strong>
          </div>

          <div className="dashboard-card">
            <span>Total agendamentos</span>
            <strong>{summary.appointments}</strong>
          </div>
        </div>

        <div className="dashboard-grid">
          <section className="table-card dashboard-table-card">
            <div className="dashboard-section-header">
              <div>
                <h2>Agendamentos de hoje</h2>
                <p>Lista dos horários marcados para hoje.</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Horário</th>
                  <th>Cliente</th>
                  <th>Serviço</th>
                  <th>Profissional</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {todayList.length === 0 ? (
                  <tr>
                    <td colSpan="5">Nenhum agendamento para hoje.</td>
                  </tr>
                ) : (
                  todayList.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>
                        {appointment.startTime} - {appointment.endTime}
                      </td>

                      <td>{appointment.client?.name || "—"}</td>

                      <td>{appointment.service?.name || "—"}</td>

                      <td>{appointment.professional?.name || "—"}</td>

                      <td>
                        <span className={getStatusClass(appointment.status)}>
                          {translateStatus(appointment.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          <section className="table-card dashboard-table-card">
            <div className="dashboard-section-header">
              <div>
                <h2>Próximos agendamentos</h2>
                <p>Próximos horários pendentes ou confirmados.</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Horário</th>
                  <th>Cliente</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {nextAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="4">Nenhum próximo agendamento encontrado.</td>
                  </tr>
                ) : (
                  nextAppointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>{formatDate(appointment.date)}</td>

                      <td>
                        {appointment.startTime} - {appointment.endTime}
                      </td>

                      <td>{appointment.client?.name || "—"}</td>

                      <td>
                        <span className={getStatusClass(appointment.status)}>
                          {translateStatus(appointment.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </div>
  );
}