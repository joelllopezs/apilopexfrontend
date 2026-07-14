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
    const [servicesResponse, professionalsResponse, clientsResponse, appointmentsResponse] =
      await Promise.all([
        api.get("/services"),
        api.get("/professionals"),
        api.get("/clients"),
        api.get("/appointments"),
      ]);

    setServices(servicesResponse.data);
    setProfessionals(professionalsResponse.data);
    setClients(clientsResponse.data);
    setAppointments(appointmentsResponse.data);
  }

  async function loadAvailability() {
    if (!professionalId || !date) return;

    const response = await api.get(
      `/availability?professionalId=${professionalId}&date=${date}`
    );

    setAvailableTimes(response.data.availableTimes || []);
    setSelectedTime(null);
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
      await loadAvailability();
      await loadInitialData();
    } catch (error) {
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
    <div className="layout">
      <Sidebar />

      <main className="content">
        <h1>Agenda</h1>
        <p style={{ color: "#b8b8c8" }}>
          Consulte horários disponíveis e crie agendamentos.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: 20,
            marginTop: 24,
          }}
        >
          <section className="card">
            <h2>Novo agendamento</h2>

            <div className="grid">
              <label>
                <span style={{ display: "block", marginBottom: 8 }}>Serviço</span>
                <select
                  className="input"
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
              </label>

              <label>
                <span style={{ display: "block", marginBottom: 8 }}>
                  Profissional
                </span>
                <select
                  className="input"
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
              </label>

              <label>
                <span style={{ display: "block", marginBottom: 8 }}>Cliente</span>
                <select
                  className="input"
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
              </label>

              <label>
                <span style={{ display: "block", marginBottom: 8 }}>Data</span>
                <input
                  className="input"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </label>

              <div>
                <h3>Horários disponíveis</h3>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  {availableTimes.length === 0 && (
                    <p style={{ color: "#b8b8c8" }}>
                      Nenhum horário disponível para essa data.
                    </p>
                  )}

                  {availableTimes.map((time) => {
                    const active = selectedTime?.startTime === time.startTime;

                    return (
                      <button
                        key={`${time.startTime}-${time.endTime}`}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={active ? "button" : "button secondary"}
                      >
                        {time.startTime}
                      </button>
                    );
                  })}
                </div>
              </div>

              {message && (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    background: "rgba(136, 90, 254, 0.14)",
                    color: "#d8ccff",
                  }}
                >
                  {message}
                </div>
              )}

              <button
                className="button"
                type="button"
                onClick={createAppointment}
                disabled={loading}
              >
                {loading ? "Criando..." : "Confirmar agendamento"}
              </button>
            </div>
          </section>

          <section className="card">
            <h2>Agendamentos</h2>

            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Horário</th>
                  <th>Cliente</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>{appointment.date}</td>
                    <td>
                      {appointment.startTime} - {appointment.endTime}
                    </td>
                    <td>{appointment.client?.name}</td>
                    <td>
                      <span className="badge">{appointment.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </div>
  );
}