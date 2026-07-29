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
  const [date, setDate] = useState("2026-07-14");
  const [selectedTime, setSelectedTime] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadInitialData() {
    try {
      const [
        servicesResponse,
        professionalsResponse,
        clientsResponse,
        appointmentsResponse,
      ] = await Promise.all([
        api.get("/services"),
        api.get("/professionals"),
        api.get("/clients"),
        api.get("/appointments"),
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
      if (!professionalId || !date) {
        setAvailableTimes([]);
        return;
      }

      const response = await api.get(
        `/availability?professionalId=${professionalId}&date=${date}`
      );

      setAvailableTimes(response.data.availableTimes || []);
      setSelectedTime(null);
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.message || "Erro ao buscar disponibilidade."
      );
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

      await loadAvailability();
      await loadInitialData();
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || "Erro ao criar agendamento.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadAvailability();
  }, [professionalId, date]);

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <h1>Agenda</h1>
        <p>Consulte horários disponíveis e crie agendamentos.</p>

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
                {availableTimes.length === 0 ? (
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
            <h2>Agendamentos</h2>

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
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan="4">Nenhum agendamento cadastrado.</td>
                  </tr>
                ) : (
                  appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>{appointment.date}</td>
                      <td>
                        {appointment.startTime} - {appointment.endTime}
                      </td>
                      <td>{appointment.client?.name || "—"}</td>
                      <td>
                        <span className="status-badge active">
                          {appointment.status}
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