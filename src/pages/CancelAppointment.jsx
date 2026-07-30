import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/api";

export default function CancelAppointment() {
  const { id, cancelToken } = useParams();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState("");

  function formatDate(value) {
    if (!value) return "—";

    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  async function loadAppointment() {
    try {
      setLoading(true);
      setMessage("");

      const response = await api.get(
        `/public/appointments/${id}/cancel/${cancelToken}`
      );

      setAppointment(response.data.appointment);
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Erro ao carregar dados do agendamento."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    const confirmed = window.confirm(
      "Deseja realmente cancelar este agendamento?"
    );

    if (!confirmed) return;

    try {
      setCancelling(true);
      setMessage("");

      const response = await api.post(
        `/public/appointments/${id}/cancel/${cancelToken}`
      );

      setAppointment(response.data.appointment);
      setMessage(response.data.message || "Agendamento cancelado com sucesso.");
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message || "Erro ao cancelar agendamento."
      );
    } finally {
      setCancelling(false);
    }
  }

  useEffect(() => {
    loadAppointment();
  }, [id, cancelToken]);

  return (
    <div className="public-booking-page">
      <div className="public-booking-card success-card">
        <div className="public-booking-header">
          <div className="public-company-logo">
            {appointment?.company?.logoUrl ? (
              <img
                src={appointment.company.logoUrl}
                alt={appointment.company.name}
              />
            ) : (
              <span>
                {appointment?.company?.name?.slice(0, 2).toUpperCase() || "LX"}
              </span>
            )}
          </div>

          <div>
            <h1>Cancelamento de agendamento</h1>
            <p>Confira os dados antes de cancelar.</p>
          </div>
        </div>

        {message && <div className="public-alert">{message}</div>}

        {loading ? (
          <p className="public-muted">Carregando agendamento...</p>
        ) : !appointment ? (
          <div className="booking-success-box">
            <h2>Agendamento não encontrado</h2>
            <p className="public-muted">
              O link pode estar incorreto, expirado ou inválido.
            </p>
          </div>
        ) : (
          <>
            <div className="booking-success-box">
              <h2>{appointment.company?.name || "Empresa"}</h2>

              <div className="booking-success-row">
                <span>Cliente</span>
                <strong>{appointment.client?.name || "—"}</strong>
              </div>

              <div className="booking-success-row">
                <span>Serviço</span>
                <strong>{appointment.service?.name || "—"}</strong>
              </div>

              <div className="booking-success-row">
                <span>Profissional</span>
                <strong>{appointment.professional?.name || "—"}</strong>
              </div>

              <div className="booking-success-row">
                <span>Data</span>
                <strong>{formatDate(appointment.date)}</strong>
              </div>

              <div className="booking-success-row">
                <span>Horário</span>
                <strong>
                  {appointment.startTime} às {appointment.endTime}
                </strong>
              </div>

              <div className="booking-success-row">
                <span>Status</span>
                <strong>
                  {appointment.status === "cancelled"
                    ? "Cancelado"
                    : appointment.status === "completed"
                    ? "Concluído"
                    : appointment.status === "confirmed"
                    ? "Confirmado"
                    : "Pendente"}
                </strong>
              </div>
            </div>

            {appointment.status === "cancelled" ? (
              <div className="public-cancel-box">
                <h3>Agendamento já cancelado</h3>
                <p>Este horário já foi liberado na agenda.</p>
              </div>
            ) : appointment.canCancel ? (
              <button
                type="button"
                className="public-danger-button"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? "Cancelando..." : "Cancelar agendamento"}
              </button>
            ) : (
              <div className="public-cancel-box">
                <h3>Cancelamento online indisponível</h3>
                <p>
                  O cancelamento online só é permitido até 2 horas antes do
                  horário. Entre em contato diretamente com a empresa.
                </p>
              </div>
            )}

            {appointment.company?.slug && (
              <Link
                className="public-secondary-link"
                to={`/agendar/${appointment.company.slug}`}
              >
                Voltar para agendamento
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}