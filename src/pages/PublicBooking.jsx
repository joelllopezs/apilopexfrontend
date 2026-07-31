import { useEffect, useMemo, useState } from "react";
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
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [message, setMessage] = useState("");
  const [companyUnavailable, setCompanyUnavailable] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);

  const selectedService = useMemo(() => {
    return services.find((item) => item.id === serviceId);
  }, [services, serviceId]);

  const selectedProfessional = useMemo(() => {
    return professionals.find((item) => item.id === professionalId);
  }, [professionals, professionalId]);

  function formatDate(value) {
    if (!value) return "";

    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  function formatPrice(price) {
    if (price === null || price === undefined || price === "") {
      return "";
    }

    return Number(price).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function getServiceModeLabel(serviceMode) {
    const labels = {
      local: "Atendimento em local físico",
      home: "Atendimento em domicílio",
      online: "Atendimento online",
      whatsapp: "Local combinado pelo WhatsApp",
    };

    return labels[serviceMode] || "Local combinado pelo WhatsApp";
  }

  function getCompanyAddress() {
    if (!company) return "";

    if (company.serviceMode !== "local") {
      return getServiceModeLabel(company.serviceMode);
    }

    const streetLine = [company.street, company.number].filter(Boolean).join(", ");
    const neighborhoodLine = company.neighborhood || "";
    const cityLine = [company.city, company.state].filter(Boolean).join(" / ");
    const zipCodeLine = company.zipCode ? `CEP ${company.zipCode}` : "";

    return [streetLine, neighborhoodLine, cityLine, zipCodeLine]
      .filter(Boolean)
      .join(" - ");
  }

  function getLocationDescription() {
    if (!company) return "";

    if (company.serviceMode === "local") {
      return getCompanyAddress() || "Endereço não informado.";
    }

    if (company.serviceMode === "home") {
      const cityState = [company.city, company.state].filter(Boolean).join(" / ");

      return cityState
        ? `Atendimento em domicílio em ${cityState}. Confirme o endereço pelo WhatsApp da empresa.`
        : "Atendimento em domicílio. Confirme o endereço pelo WhatsApp da empresa.";
    }

    if (company.serviceMode === "online") {
      return "Atendimento online. A empresa enviará as informações de acesso pelo WhatsApp ou e-mail.";
    }

    return "O local do atendimento será combinado diretamente pelo WhatsApp da empresa.";
  }

  function getUnavailableTitle() {
    if (!message) {
      return "Agendamento indisponível";
    }

    const normalizedMessage = message.toLowerCase();

    if (
      normalizedMessage.includes("assinatura") ||
      normalizedMessage.includes("pagamento") ||
      normalizedMessage.includes("temporariamente indisponível")
    ) {
      return "Agenda temporariamente indisponível";
    }

    if (normalizedMessage.includes("não encontrada")) {
      return "Empresa não encontrada";
    }

    return "Agendamento indisponível";
  }

  function getUnavailableDescription() {
    if (!message) {
      return "Esta empresa está temporariamente indisponível para receber novos agendamentos online.";
    }

    const normalizedMessage = message.toLowerCase();

    if (
      normalizedMessage.includes("assinatura") ||
      normalizedMessage.includes("pagamento") ||
      normalizedMessage.includes("temporariamente indisponível")
    ) {
      return "No momento, a agenda online desta empresa não está liberada para novos agendamentos.";
    }

    if (normalizedMessage.includes("não encontrada")) {
      return "Não encontramos uma empresa ativa com este link de agendamento.";
    }

    return "Esta empresa está temporariamente indisponível para receber novos agendamentos online.";
  }

  function getStepStatus(step) {
    if (step === 1) return serviceId ? "done" : "active";
    if (step === 2) return professionalId ? "done" : serviceId ? "active" : "";
    if (step === 3) return date ? "done" : professionalId ? "active" : "";
    if (step === 4) return selectedTime ? "done" : date ? "active" : "";
    if (step === 5) {
      return clientName.trim() && clientPhone.trim()
        ? "done"
        : selectedTime
        ? "active"
        : "";
    }

    return "";
  }

  function handlePublicError(error, fallbackMessage) {
    console.error(error);

    const status = error.response?.status;
    const apiMessage = error.response?.data?.message;

    if (status === 403 || status === 404) {
      setCompanyUnavailable(true);
      setServices([]);
      setProfessionals([]);
      setAvailableTimes([]);
      setSelectedTime(null);
    }

    setMessage(apiMessage || fallbackMessage);
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
      setMessage("Não foi possível copiar. Abra o cancelamento pelo botão.");
    }
  }

  async function loadInitialData() {
    try {
      setLoadingInitialData(true);
      setMessage("");
      setCompanyUnavailable(false);
      setConfirmedAppointment(null);

      const companyResponse = await api.get(`/public/company/${slug}`);
      const companyData = companyResponse.data;

      setCompany(companyData);

      document.documentElement.style.setProperty(
        "--public-primary-color",
        companyData.primaryColor || "#885AFE"
      );

      document.documentElement.style.setProperty(
        "--primary-color",
        companyData.primaryColor || "#885AFE"
      );

      const [servicesResponse, professionalsResponse] = await Promise.all([
        api.get(`/public/company/${slug}/services`),
        api.get(`/public/company/${slug}/professionals`),
      ]);

      setServices(servicesResponse.data || []);
      setProfessionals(professionalsResponse.data || []);
    } catch (error) {
      handlePublicError(
        error,
        "Empresa não encontrada ou indisponível para agendamentos."
      );
    } finally {
      setLoadingInitialData(false);
    }
  }

  async function loadAvailability() {
    try {
      setLoadingTimes(true);
      setMessage("");

      if (!serviceId || !professionalId || !date || companyUnavailable) {
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
      setAvailableTimes([]);
      setSelectedTime(null);

      handlePublicError(error, "Erro ao buscar horários disponíveis.");
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
        serviceName: selectedService?.name || "Serviço",
        servicePrice: selectedService?.price,
        professionalName: selectedProfessional?.name || "Profissional",
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
      handlePublicError(error, "Erro ao confirmar agendamento.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, [slug]);

  useEffect(() => {
    loadAvailability();
  }, [serviceId, professionalId, date]);

  if (loadingInitialData) {
    return (
      <div className="public-booking-page public-booking-polished">
        <div className="public-booking-card public-unavailable-card">
          <div className="public-company-logo unavailable-logo">
            <span>...</span>
          </div>

          <h1>Carregando agenda</h1>

          <p>Estamos buscando as informações de agendamento.</p>

          <small>Aguarde alguns instantes.</small>
        </div>
      </div>
    );
  }

  if (companyUnavailable) {
    return (
      <div className="public-booking-page public-booking-polished">
        <div className="public-booking-card public-unavailable-card">
          <div className="public-company-logo unavailable-logo">
            <span>!</span>
          </div>

          <h1>{getUnavailableTitle()}</h1>

          <p>{getUnavailableDescription()}</p>

          {message && <div className="public-alert">{message}</div>}

          <small>
            Entre em contato diretamente com a empresa ou tente novamente mais
            tarde.
          </small>
        </div>
      </div>
    );
  }

  if (confirmedAppointment) {
    return (
      <div className="public-booking-page public-booking-polished">
        <div className="public-booking-card success-card polished-success-card">
          <div className="success-check-icon">✓</div>

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

          <div className="booking-success-box polished-summary-box">
            <h2>{company?.name}</h2>

            <div className="booking-success-row">
              <span>Cliente</span>
              <strong>{confirmedAppointment.clientName}</strong>
            </div>

            <div className="booking-success-row">
              <span>Serviço</span>
              <strong>{confirmedAppointment.serviceName}</strong>
            </div>

            {confirmedAppointment.servicePrice && (
              <div className="booking-success-row">
                <span>Valor</span>
                <strong>{formatPrice(confirmedAppointment.servicePrice)}</strong>
              </div>
            )}

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

            <div className="booking-success-row">
              <span>Atendimento</span>
              <strong>{getServiceModeLabel(company?.serviceMode)}</strong>
            </div>

            <div className="booking-success-row">
              <span>Local</span>
              <strong>{getLocationDescription()}</strong>
            </div>
          </div>

          {confirmedAppointment.cancelUrl && (
            <div className="public-cancel-box">
              <h3>Precisa cancelar?</h3>
              <p>
                Guarde o link de cancelamento. Por ele você poderá cancelar o
                agendamento respeitando a regra de antecedência da empresa.
              </p>

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
    <div className="public-booking-page public-booking-polished">
      <div className="public-booking-shell">
        <aside className="public-booking-sidebar">
          <div className="public-booking-header sidebar-header">
            <div className="public-company-logo">
              {company?.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} />
              ) : (
                <span>{company?.name?.slice(0, 2).toUpperCase() || "LX"}</span>
              )}
            </div>

            <div>
              <h1>{company?.name || "Agendamento online"}</h1>
              <p>Reserve seu horário de forma rápida e simples.</p>
            </div>
          </div>

          <div className="public-company-info-box">
            <span>Atendimento</span>
            <strong>{getServiceModeLabel(company?.serviceMode)}</strong>
            <p>{getLocationDescription()}</p>
          </div>

          <div className="public-steps">
            <div className={`public-step ${getStepStatus(1)}`}>
              <span>1</span>
              <strong>Serviço</strong>
            </div>

            <div className={`public-step ${getStepStatus(2)}`}>
              <span>2</span>
              <strong>Profissional</strong>
            </div>

            <div className={`public-step ${getStepStatus(3)}`}>
              <span>3</span>
              <strong>Data</strong>
            </div>

            <div className={`public-step ${getStepStatus(4)}`}>
              <span>4</span>
              <strong>Horário</strong>
            </div>

            <div className={`public-step ${getStepStatus(5)}`}>
              <span>5</span>
              <strong>Dados</strong>
            </div>
          </div>

          <div className="public-booking-summary">
            <h3>Resumo</h3>

            <div>
              <span>Serviço</span>
              <strong>{selectedService?.name || "Não selecionado"}</strong>
            </div>

            <div>
              <span>Profissional</span>
              <strong>
                {selectedProfessional?.name || "Não selecionado"}
              </strong>
            </div>

            <div>
              <span>Data</span>
              <strong>{date ? formatDate(date) : "Não selecionada"}</strong>
            </div>

            <div>
              <span>Horário</span>
              <strong>{selectedTime?.startTime || "Não selecionado"}</strong>
            </div>

            {selectedService?.price && (
              <div>
                <span>Valor</span>
                <strong>{formatPrice(selectedService.price)}</strong>
              </div>
            )}

            <div>
              <span>Atendimento</span>
              <strong>{getServiceModeLabel(company?.serviceMode)}</strong>
            </div>
          </div>
        </aside>

        <div className="public-booking-card public-booking-main-card">
          <div className="public-mobile-header">
            <div className="public-company-logo">
              {company?.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} />
              ) : (
                <span>{company?.name?.slice(0, 2).toUpperCase() || "LX"}</span>
              )}
            </div>

            <div>
              <h1>{company?.name || "Agendamento online"}</h1>
              <p>Escolha serviço, profissional, data e horário.</p>
            </div>
          </div>

          <div className="public-company-info-box mobile-info-box">
            <span>Atendimento</span>
            <strong>{getServiceModeLabel(company?.serviceMode)}</strong>
            <p>{getLocationDescription()}</p>
          </div>

          {message && <div className="public-alert">{message}</div>}

          <form className="public-booking-form" onSubmit={handleSubmit}>
            <section className="public-form-section">
              <h2>1. Escolha o serviço</h2>

              <label>Serviço</label>
              <select
                value={serviceId}
                onChange={(event) => {
                  setServiceId(event.target.value);
                  setSelectedTime(null);
                  setAvailableTimes([]);
                }}
                required
              >
                <option value="">Selecione um serviço</option>

                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - {service.duration} min
                    {service.price ? ` - ${formatPrice(service.price)}` : ""}
                  </option>
                ))}
              </select>
            </section>

            <section className="public-form-section">
              <h2>2. Escolha o profissional</h2>

              <label>Profissional</label>
              <select
                value={professionalId}
                onChange={(event) => {
                  setProfessionalId(event.target.value);
                  setSelectedTime(null);
                  setAvailableTimes([]);
                }}
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
                onChange={(event) => {
                  setDate(event.target.value);
                  setSelectedTime(null);
                }}
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
                  <p className="public-muted">
                    Buscando horários disponíveis...
                  </p>
                ) : availableTimes.length === 0 ? (
                  <div className="public-empty-state">
                    <strong>Nenhum horário disponível</strong>
                    <p>
                      Escolha outra data ou fale diretamente com a empresa.
                    </p>
                  </div>
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

            <div className="public-submit-area">
              <div>
                <strong>Solicitar agendamento</strong>
                <span>
                  A empresa poderá confirmar, cancelar ou concluir pelo painel.
                </span>
              </div>

              <button
                type="submit"
                className="public-submit-button"
                disabled={loading}
              >
                {loading ? "Confirmando..." : "Confirmar agendamento"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}