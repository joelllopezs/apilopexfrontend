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

    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
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

  function getStatusClass(status) {
    const statusClassMap = {
      pending: "status-badge pending",
      confirmed: "status-badge active",
      cancelled: "status-badge blocked",
      completed: "status-badge completed",
    };

    return statusClassMap[status] || "status-badge";
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