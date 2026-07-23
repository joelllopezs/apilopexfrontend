import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";

export default function PublicBooking() {
  const { slug } = useParams();

  const [company, setCompany] = useState(null);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    serviceId: "",
    professionalId: "",
    date: "",
    startTime: "",
    endTime: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    notes: "",
  });

  async function loadInitialData() {
    try {
      setLoading(true);
      setMessage("");

      const [companyResponse, servicesResponse, professionalsResponse] =
        await Promise.all([
          api.get(`/public/company/${slug}`),
          api.get(`/public/company/${slug}/services`),
          api.get(`/public/company/${slug}/professionals`),
        ]);

      const companyData = companyResponse.data;

      setCompany(companyData);
      setServices(servicesResponse.data);
      setProfessionals(professionalsResponse.data);

      document.documentElement.style.setProperty(
        "--public-primary-color",
        companyData.primaryColor || "#885AFE"
      );
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.message ||
          "Erro ao carregar página de agendamento."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailability() {
    if (!form.serviceId || !form.professionalId || !form.date) {
      setAvailableTimes([]);
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await api.get(`/public/company/${slug}/availability`, {
        params: {
          serviceId: form.serviceId,
          professionalId: form.professionalId,
          date: form.date,
        },
      });

      setAvailableTimes(response.data.availableTimes || []);

      setForm((prev) => ({
        ...prev,
        startTime: "",
        endTime: "",
      }));

      if (!response.data.availableTimes?.length) {
        setMessage("Nenhum horário disponível para essa data.");
      }
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.message || "Erro ao buscar disponibilidade."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSelectTime(time) {
    setForm((prev) => ({
      ...prev,
      startTime: time.startTime,
      endTime: time.endTime,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.startTime || !form.endTime) {
      setMessage("Selecione um horário disponível.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await api.post(`/public/company/${slug}/appointments`, {
        serviceId: form.serviceId,
        professionalId: form.professionalId,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        clientName: form.clientName,
        clientEmail: form.clientEmail || null,
        clientPhone: form.clientPhone || null,
        notes: form.notes || null,
      });

      setMessage("Agendamento realizado com sucesso!");

      setForm({
        serviceId: "",
        professionalId: "",
        date: "",
        startTime: "",
        endTime: "",
        clientName: "",
        clientEmail: "",
        clientPhone: "",
        notes: "",
      });

      setAvailableTimes([]);
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.message || "Erro ao realizar agendamento."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, [slug]);

  useEffect(() => {
    loadAvailability();
  }, [form.serviceId, form.professionalId, form.date]);

  return (
    <div className="public-booking-page">
      <div className="public-booking-card">
        <header className="public-booking-header">
          <div className="public-company-logo">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} />
            ) : (
              <span>
                {company?.name ? company.name.slice(0, 2).toUpperCase() : "LX"}
              </span>
            )}
          </div>

          <div>
            <h1>{company?.name || "Agendamento"}</h1>
            <p>Escolha o serviço, data e horário para agendar.</p>
          </div>
        </header>

        {message && <div className="public-alert">{message}</div>}

        {loading && <div className="public-alert">Carregando...</div>}

        <form className="public-booking-form" onSubmit={handleSubmit}>
          <div className="public-form-section">
            <h2>1. Escolha o atendimento</h2>

            <label>Serviço</label>
            <select
              value={form.serviceId}
              onChange={(e) =>
                setForm({
                  ...form,
                  serviceId: e.target.value,
                  startTime: "",
                  endTime: "",
                })
              }
              required
            >
              <option value="">Selecione um serviço</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} — {service.duration} min
                </option>
              ))}
            </select>

            <label>Profissional</label>
            <select
              value={form.professionalId}
              onChange={(e) =>
                setForm({
                  ...form,
                  professionalId: e.target.value,
                  startTime: "",
                  endTime: "",
                })
              }
              required
            >
              <option value="">Selecione um profissional</option>
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.name}
                </option>
              ))}
            </select>

            <label>Data</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm({
                  ...form,
                  date: e.target.value,
                  startTime: "",
                  endTime: "",
                })
              }
              required
            />
          </div>

          <div className="public-form-section">
            <h2>2. Escolha o horário</h2>

            {availableTimes.length === 0 ? (
              <p className="public-muted">
                Selecione serviço, profissional e data para ver horários.
              </p>
            ) : (
              <div className="public-time-grid">
                {availableTimes.map((time) => (
                  <button
                    key={`${time.startTime}-${time.endTime}`}
                    type="button"
                    className={
                      form.startTime === time.startTime
                        ? "public-time-button selected"
                        : "public-time-button"
                    }
                    onClick={() => handleSelectTime(time)}
                  >
                    {time.startTime}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="public-form-section">
            <h2>3. Seus dados</h2>

            <label>Nome</label>
            <input
              value={form.clientName}
              onChange={(e) =>
                setForm({
                  ...form,
                  clientName: e.target.value,
                })
              }
              placeholder="Seu nome"
              required
            />

            <label>WhatsApp / Telefone</label>
            <input
              value={form.clientPhone}
              onChange={(e) =>
                setForm({
                  ...form,
                  clientPhone: e.target.value,
                })
              }
              placeholder="(14) 99999-9999"
            />

            <label>E-mail</label>
            <input
              type="email"
              value={form.clientEmail}
              onChange={(e) =>
                setForm({
                  ...form,
                  clientEmail: e.target.value,
                })
              }
              placeholder="seuemail@email.com"
            />

            <label>Observações</label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm({
                  ...form,
                  notes: e.target.value,
                })
              }
              placeholder="Alguma observação para o atendimento?"
            />
          </div>

          <button className="public-submit-button" type="submit" disabled={loading}>
            {loading ? "Agendando..." : "Confirmar agendamento"}
          </button>
        </form>
      </div>
    </div>
  );
}