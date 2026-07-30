import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";

export default function PublicBooking() {
  const { slug } = useParams();

  const [company, setCompany] = useState(null);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);

  const [serviceId, setServiceId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [date, setDate] = useState("");
  const [selectedTime, setSelectedTime] = useState(null);

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);

  function formatDate(value) {
    if (!value) return "";

    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  async function copyCancelLink() {
    if (!confirmedAppointment?.cancelUrl) {
      setMessage("Link de cancelamento não disponível.");
      return;
    }

    try {
      await navigator.clipboard.writeText(confirmedAppointment.cancelUrl);
      setMessage("Link de cancelamento copiado com sucesso.");
    } catch (error) {
      console.error(error);
      setMessage(confirmedAppointment.cancelUrl);
    }
  }

  async function loadCompany() {
    try {
      setMessage("");

      const response = await api.get(`/public/company/${slug}`);
      const companyData = response.data;

      setCompany(companyData);

      document.documentElement.style.setProperty(
        "--public-primary-color",
        companyData.primaryColor || "#885AFE"
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Empresa não encontrada ou indisponível."
      );
    }
  }

  async function loadServicesAndProfessionals() {
    try {
      const [servicesResponse, professionalsResponse] = await Promise.all([
        api.get(`/public/company/${slug}/services`),
        api.get(`/public/company/${slug}/professionals`),
      ]);

      setServices(servicesResponse.data);
      setProfessionals(professionalsResponse.data);
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Erro ao carregar serviços e profissionais."
      );
    }
  }

  async function loadAvailability() {
    try {
      setLoadingTimes(true);
      setMessage("");

      if (!serviceId || !professionalId || !date) {
        setAvailableTimes([]);
        setSelectedTime(null);
        return;
      }

      const response = await api.get(
        `/public/company/${slug}/availability?professionalId=${professionalId}&serviceId=${serviceId}&date=${date}`
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
        error.response?.data?.message || "Erro ao buscar horários disponíveis."
      );
    } finally {
      setLoadingTimes(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const trimmedClientName = clientName.trim();
      const trimmedClientPhone = clientPhone.trim();
      const trimmedClientEmail = clientEmail.trim();

      if (
        !serviceId ||
        !professionalId ||
        !date ||
        !selectedTime ||
        !trimmedClientName ||
        !trimmedClientPhone
      ) {
        setMessage("Preencha os campos obrigatórios e selecione um horário.");
        return;
      }

      const service = services.find((item) => item.id === serviceId);
      const professional = professionals.find(
        (item) => item.id === professionalId
      );

      const response = await api.post(`/public/company/${slug}/appointments`, {
        serviceId,
        professionalId,
        date,
        startTime: selectedTime.startTime,
        endTime: selectedTime.endTime,
        clientName: trimmedClientName,
        clientPhone: trimmedClientPhone,
        clientEmail: trimmedClientEmail || null,
        notes: notes.trim() || null,
      });

      const apiAppointment = response.data.appointment || response.data;

      setConfirmedAppointment({
        ...apiAppointment,
        cancelUrl: response.data.cancelUrl || "",
        cancelPath: response.data.cancelPath || "",
        clientName: trimmedClientName,
        clientPhone: trimmedClientPhone,
        clientEmail: trimmedClientEmail,
        serviceName: service?.name || "Serviço",
        professionalName: professional?.name || "Profissional",
        date,
        formattedDate: formatDate(date),
        startTime: selectedTime.startTime,
        endTime: selectedTime.endTime,
      });

      setServiceId("");
      setProfessionalId("");
      setDate("");
      setSelectedTime(null);
      setAvailableTimes([]);
      setClientName("");
      setClientPhone("");
      setClientEmail("");
      setNotes("");
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message || "Erro ao confirmar agendamento."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompany();
    loadServicesAndProfessionals();
  }, [slug]);

  useEffect(() => {
    loadAvailability();
  }, [serviceId, professionalId, date]);

  if (confirmedAppointment) {
    return (
      <div className="public-booking-page">
        <div className="public-booking-card success-card">
          <div className="public-booking-header">
            <div className="public-company-logo">
              {company?.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} />
              ) : (
                <span>{company?.name?.slice(0, 2).toUpperCase() || "LX"}</span>
              )}
            </div>

            <div>
              <h1>Agendamento solicitado!</h1>
              <p>
                Seu horário foi registrado. Aguarde a confirmação da empresa.
              </p>
            </div>
          </div>

          {message && <div className="public-alert">{message}</div>}

          <div className="booking-success-box">
            <h2>{company?.name}</h2>

            <div className="booking-success-row">
              <span>Cliente</span>
              <strong>{confirmedAppointment.clientName}</strong>
            </div>

            <div className="booking-success-row">
              <span>Serviço</span>
              <strong>{confirmedAppointment.serviceName}</strong>
            </div>

            <div className="booking-success-row">
              <span>Profissional</span>
              <strong>{confirmedAppointment.professionalName}</strong>
            </div>

            <div className="booking-success-row">
              <span>Data</span>
              <strong>{confirmedAppointment.formattedDate}</strong>
            </div>

            <div className="booking-success-row">
              <span>Horário</span>
              <strong>
                {confirmedAppointment.startTime} às{" "}
                {confirmedAppointment.endTime}
              </strong>
            </div>

            <div className="booking-success-row">
              <span>Contato</span>
              <strong>{confirmedAppointment.clientPhone}</strong>
            </div>
          </div>

          {confirmedAppointment.cancelUrl && (
            <div className="public-cancel-box">
              <h3>Precisa cancelar?</h3>
              <p>
                Guarde este link. Por ele você poderá cancelar o agendamento,
                respeitando a regra de antecedência da empresa.
              </p>

              <div className="public-cancel-link">
                {confirmedAppointment.cancelUrl}
              </div>

              <div className="public-cancel-actions">
                <button
                  type="button"
                  className="public-secondary-button"
                  onClick={copyCancelLink}
                >
                  Copiar link de cancelamento
                </button>

                <a
                  className="public-danger-link"
                  href={confirmedAppointment.cancelUrl}
                >
                  Abrir cancelamento
                </a>
              </div>
            </div>
          )}

          <button
            type="button"
            className="public-submit-button"
            onClick={() => setConfirmedAppointment(null)}
          >
            Fazer novo agendamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="public-booking-page">
      <div className="public-booking-card">
        <div className="public-booking-header">
          <div className="public-company-logo">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} />
            ) : (
              <span>{company?.name?.slice(0, 2).toUpperCase() || "LX"}</span>
            )}
          </div>

          <div>
            <h1>{company?.name || "Agendamento online"}</h1>
            <p>Escolha o serviço, profissional, data e horário.</p>
          </div>
        </div>

        {message && <div className="public-alert">{message}</div>}

        <form className="public-booking-form" onSubmit={handleSubmit}>
          <section className="public-form-section">
            <h2>1. Escolha o serviço</h2>

            <label>Serviço</label>
            <select
              value={serviceId}
              onChange={(event) => setServiceId(event.target.value)}
              required
            >
              <option value="">Selecione um serviço</option>

              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - {service.duration} min
                  {service.price
                    ? ` - R$ ${Number(service.price).toFixed(2)}`
                    : ""}
                </option>
              ))}
            </select>
          </section>

          <section className="public-form-section">
            <h2>2. Escolha o profissional</h2>

            <label>Profissional</label>
            <select
              value={professionalId}
              onChange={(event) => setProfessionalId(event.target.value)}
              required
            >
              <option value="">Selecione um profissional</option>

              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.name}
                </option>
              ))}
            </select>
          </section>

          <section className="public-form-section">
            <h2>3. Escolha a data</h2>

            <label>Data</label>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </section>

          <section className="public-form-section">
            <h2>4. Escolha o horário</h2>

            <div className="public-time-grid">
              {!serviceId || !professionalId || !date ? (
                <p className="public-muted">
                  Selecione serviço, profissional e data para ver os horários.
                </p>
              ) : loadingTimes ? (
                <p className="public-muted">Buscando horários...</p>
              ) : availableTimes.length === 0 ? (
                <p className="public-muted">
                  Nenhum horário disponível para essa data.
                </p>
              ) : (
                availableTimes.map((time) => {
                  const active = selectedTime?.startTime === time.startTime;

                  return (
                    <button
                      key={`${time.startTime}-${time.endTime}`}
                      type="button"
                      className={
                        active
                          ? "public-time-button selected"
                          : "public-time-button"
                      }
                      onClick={() => setSelectedTime(time)}
                    >
                      {time.startTime}
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <section className="public-form-section">
            <h2>5. Seus dados</h2>

            <label>Nome completo</label>
            <input
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              placeholder="Seu nome"
              required
            />

            <label>WhatsApp</label>
            <input
              value={clientPhone}
              onChange={(event) => setClientPhone(event.target.value)}
              placeholder="(14) 99999-9999"
              required
            />

            <label>E-mail</label>
            <input
              type="email"
              value={clientEmail}
              onChange={(event) => setClientEmail(event.target.value)}
              placeholder="seuemail@email.com"
            />

            <label>Observações</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Digite alguma observação, se necessário"
            />
          </section>

          <button
            type="submit"
            className="public-submit-button"
            disabled={loading}
          >
            {loading ? "Confirmando..." : "Confirmar agendamento"}
          </button>
        </form>
      </div>
    </div>
  );
}