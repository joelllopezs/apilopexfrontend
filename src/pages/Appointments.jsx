import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/api";

export default function Appointments() {
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);

  const [serviceId, setServiceId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [clientId, setClientId] = useState("");
  const [date, setDate] = useState("2026-07-30");
  const [selectedTime, setSelectedTime] = useState(null);

  const [statusFilter, setStatusFilter] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [message, setMessage] = useState("");

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

  function formatDate(value) {
    if (!value) return "—";

    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  async function loadInitialData() {
    try {
      setMessage("");

      const appointmentsUrl = statusFilter
        ? `/appointments?status=${statusFilter}`
        : "/appointments";

      const [
        servicesResponse,
        professionalsResponse,
        clientsResponse,
        appointmentsResponse,
      ] = await Promise.all([
        api.get("/services?status=active"),
        api.get("/professionals?status=active"),
        api.get("/clients"),
        api.get(appointmentsUrl),
      ]);

      setServices(servicesResponse.data);
      setProfessionals(professionalsResponse.data);
      setClients(clientsResponse.data);
      setAppointments(appointmentsResponse.data);
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message || "Erro ao carregar dados da agenda."
      );
    }
  }

  async function loadAvailability() {
    try {
      setLoadingAvailability(true);
      setMessage("");

      if (!serviceId || !professionalId || !date) {
        setAvailableTimes([]);
        setSelectedTime(null);
        return;
      }

      const response = await api.get(
        `/availability?professionalId=${professionalId}&serviceId=${serviceId}&date=${date}`
      );

      setAvailableTimes(response.data.availableTimes || []);
      setSelectedTime(null);

      if (response.data.message) {
        setMessage(response.data.message);
      }
    } catch (error) {
      console.error(error);

      setAvailableTimes([]);
      setSelectedTime(null);

      setMessage(
        error.response?.data?.message || "Erro ao buscar disponibilidade."
      );
    } finally {
      setLoadingAvailability(false);
    }
  }

  async function createAppointment() {
    try {
      setLoading(true);
      setMessage("");

      if (!serviceId || !professionalId || !clientId || !date || !selectedTime) {
        setMessage("Preencha todos os campos e selecione um horário.");
        return;
      }

      await api.post("/appointments", {
        serviceId,
        professionalId,
        clientId,
        date,
        startTime: selectedTime.startTime,
        endTime: selectedTime.endTime,
        notes: "Agendamento criado pelo painel Lopex",
      });

      setMessage("Agendamento criado com sucesso.");

      setSelectedTime(null);
      setServiceId("");
      setProfessionalId("");
      setClientId("");
      setAvailableTimes([]);

      await loadInitialData();
    } catch (error) {
      console.error(error);

      setMessage(error.response?.data?.message || "Erro ao criar agendamento.");
    } finally {
      setLoading(false);
    }
  }

  async function updateAppointmentStatus(appointmentId, status) {
    try {
      setUpdatingId(appointmentId);
      setMessage("");

      await api.patch(`/appointments/${appointmentId}/status`, {
        status,
      });

      setMessage(`Agendamento marcado como ${translateStatus(status)}.`);

      await loadInitialData();
      await loadAvailability();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Erro ao atualizar status do agendamento."
      );
    } finally {
      setUpdatingId("");
    }
  }

  useEffect(() => {
    loadInitialData();
  }, [statusFilter]);

  useEffect(() => {
    loadAvailability();
  }, [serviceId, professionalId, date]);

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <h1>Agenda</h1>
        <p>Consulte horários disponíveis, crie e gerencie agendamentos.</p>

        {message && <div className="alert-message">{message}</div>}

        <div className="appointments-grid">
          <section className="form-card">
            <h2>Novo agendamento</h2>

            <div>
              <label>Serviço</label>
              <select
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
              >
                <option value="">Selecione um serviço</option>

                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - {service.duration} min
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Profissional</label>
              <select
                value={professionalId}
                onChange={(event) => setProfessionalId(event.target.value)}
              >
                <option value="">Selecione um profissional</option>

                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Cliente</label>
              <select
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
              >
                <option value="">Selecione um cliente</option>

                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                    {client.phone ? ` - ${client.phone}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Data</label>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>

            <div>
              <label>Horários disponíveis</label>

              <div className="time-grid">
                {!serviceId || !professionalId || !date ? (
                  <p className="empty-message">
                    Selecione serviço, profissional e data para buscar horários.
                  </p>
                ) : loadingAvailability ? (
                  <p className="empty-message">Buscando horários...</p>
                ) : availableTimes.length === 0 ? (
                  <p className="empty-message">
                    Nenhum horário disponível para essa data.
                  </p>
                ) : (
                  availableTimes.map((time) => {
                    const active = selectedTime?.startTime === time.startTime;

                    return (
                      <button
                        key={`${time.startTime}-${time.endTime}`}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={
                          active ? "time-button selected" : "time-button"
                        }
                      >
                        {time.startTime}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <button type="button" onClick={createAppointment} disabled={loading}>
              {loading ? "Criando..." : "Confirmar agendamento"}
            </button>
          </section>

          <section className="table-card appointments-table-card">
            <div className="appointments-header">
              <div>
                <h2>Agendamentos</h2>
                <p>Gerencie os horários criados pelo painel e pelo link público.</p>
              </div>

              <select
                className="appointments-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">Todos</option>
                <option value="pending">Pendentes</option>
                <option value="confirmed">Confirmados</option>
                <option value="cancelled">Cancelados</option>
                <option value="completed">Concluídos</option>
              </select>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Horário</th>
                  <th>Cliente</th>
                  <th>WhatsApp</th>
                  <th>Serviço</th>
                  <th>Profissional</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan="8">Nenhum agendamento cadastrado.</td>
                  </tr>
                ) : (
                  appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>{formatDate(appointment.date)}</td>

                      <td>
                        {appointment.startTime} - {appointment.endTime}
                      </td>

                      <td>{appointment.client?.name || "—"}</td>

                      <td>{appointment.client?.phone || "—"}</td>

                      <td>{appointment.service?.name || "—"}</td>

                      <td>{appointment.professional?.name || "—"}</td>

                      <td>
                        <span className={getStatusClass(appointment.status)}>
                          {translateStatus(appointment.status)}
                        </span>
                      </td>

                      <td>
                        <div className="table-actions">
                          {appointment.status !== "confirmed" &&
                            appointment.status !== "cancelled" &&
                            appointment.status !== "completed" && (
                              <button
                                type="button"
                                disabled={updatingId === appointment.id}
                                onClick={() =>
                                  updateAppointmentStatus(
                                    appointment.id,
                                    "confirmed"
                                  )
                                }
                              >
                                Confirmar
                              </button>
                            )}

                          {appointment.status !== "completed" &&
                            appointment.status !== "cancelled" && (
                              <button
                                type="button"
                                disabled={updatingId === appointment.id}
                                onClick={() =>
                                  updateAppointmentStatus(
                                    appointment.id,
                                    "completed"
                                  )
                                }
                              >
                                Concluir
                              </button>
                            )}

                          {appointment.status !== "cancelled" &&
                            appointment.status !== "completed" && (
                              <button
                                type="button"
                                className="danger-button"
                                disabled={updatingId === appointment.id}
                                onClick={() =>
                                  updateAppointmentStatus(
                                    appointment.id,
                                    "cancelled"
                                  )
                                }
                              >
                                Cancelar
                              </button>
                            )}
                        </div>
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