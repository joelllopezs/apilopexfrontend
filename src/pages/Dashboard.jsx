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
        title: "Assinatura cancelada",
        text: "Sua assinatura está cancelada. Alguns recursos podem ser bloqueados em breve.",
      };
    }

    if (status === "overdue") {
      return {
        type: "warning",
        title: "Pagamento atrasado",
        text: "Sua assinatura está marcada como atrasada. Regularize para evitar bloqueios.",
      };
    }

    if (status === "trial") {
      const days = getDaysUntil(company.trialEndsAt);

      if (days === null) {
        return {
          type: "info",
          title: "Teste gratuito ativo",
          text: "Sua empresa está no período de teste gratuito.",
        };
      }

      if (days < 0) {
        return {
          type: "warning",
          title: "Teste gratuito vencido",
          text: "Seu período de teste terminou. Aguarde a atualização da assinatura.",
        };
      }

      if (days <= 3) {
        return {
          type: "warning",
          title: "Teste perto de vencer",
          text: `Seu teste gratuito termina em ${days} dia${
            days === 1 ? "" : "s"
          }.`,
        };
      }

      return {
        type: "info",
        title: "Teste gratuito ativo",
        text: `Seu teste gratuito termina em ${days} dias.`,
      };
    }

    if (status === "active") {
      const days = getDaysUntil(company.subscriptionEnd);

      if (days !== null && days <= 5 && days >= 0) {
        return {
          type: "info",
          title: "Assinatura perto do vencimento",
          text: `Sua assinatura vence em ${days} dia${days === 1 ? "" : "s"}.`,
        };
      }

      return {
        type: "success",
        title: "Assinatura ativa",
        text: "Sua assinatura está ativa e liberada para uso.",
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
  const subscriptionAlert = getSubscriptionAlert();

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
          <div className={`company-subscription-alert ${subscriptionAlert.type}`}>
            <strong>{subscriptionAlert.title}</strong>
            <span>{subscriptionAlert.text}</span>
          </div>
        )}

        <section className="company-plan-panel">
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