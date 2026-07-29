import { useEffect, useState } from "react";
import api from "../api/api";
import Sidebar from "../components/Sidebar";

const defaultDays = [
  {
    dayOfWeek: 0,
    label: "Domingo",
    shortLabel: "Dom",
    isOpen: false,
    openTime: "00:00",
    closeTime: "00:00",
    breakStart: "",
    breakEnd: "",
  },
  {
    dayOfWeek: 1,
    label: "Segunda-feira",
    shortLabel: "Seg",
    isOpen: true,
    openTime: "08:00",
    closeTime: "18:00",
    breakStart: "12:00",
    breakEnd: "13:00",
  },
  {
    dayOfWeek: 2,
    label: "Terça-feira",
    shortLabel: "Ter",
    isOpen: true,
    openTime: "08:00",
    closeTime: "18:00",
    breakStart: "12:00",
    breakEnd: "13:00",
  },
  {
    dayOfWeek: 3,
    label: "Quarta-feira",
    shortLabel: "Qua",
    isOpen: true,
    openTime: "08:00",
    closeTime: "18:00",
    breakStart: "12:00",
    breakEnd: "13:00",
  },
  {
    dayOfWeek: 4,
    label: "Quinta-feira",
    shortLabel: "Qui",
    isOpen: true,
    openTime: "08:00",
    closeTime: "18:00",
    breakStart: "12:00",
    breakEnd: "13:00",
  },
  {
    dayOfWeek: 5,
    label: "Sexta-feira",
    shortLabel: "Sex",
    isOpen: true,
    openTime: "08:00",
    closeTime: "18:00",
    breakStart: "12:00",
    breakEnd: "13:00",
  },
  {
    dayOfWeek: 6,
    label: "Sábado",
    shortLabel: "Sáb",
    isOpen: true,
    openTime: "08:00",
    closeTime: "12:00",
    breakStart: "",
    breakEnd: "",
  },
];

export default function BusinessHours() {
  const [weekHours, setWeekHours] = useState(defaultDays);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function timeToMinutes(time) {
    if (!time) return null;

    const [hours, minutes] = time.split(":").map(Number);

    return hours * 60 + minutes;
  }

  function getStatusClass(isOpen) {
    return isOpen ? "status-badge active" : "status-badge blocked";
  }

  function normalizeHour(day) {
    if (!day.isOpen) {
      return {
        dayOfWeek: Number(day.dayOfWeek),
        isOpen: false,
        openTime: "00:00",
        closeTime: "00:00",
        breakStart: null,
        breakEnd: null,
      };
    }

    return {
      dayOfWeek: Number(day.dayOfWeek),
      isOpen: true,
      openTime: day.openTime || "08:00",
      closeTime: day.closeTime || "18:00",
      breakStart: day.breakStart || null,
      breakEnd: day.breakEnd || null,
    };
  }

  function validateWeekHours() {
    for (const day of weekHours) {
      if (!day.isOpen) continue;

      if (!day.openTime || !day.closeTime) {
        return `Informe abertura e fechamento de ${day.label}.`;
      }

      const openMinutes = timeToMinutes(day.openTime);
      const closeMinutes = timeToMinutes(day.closeTime);

      if (openMinutes >= closeMinutes) {
        return `Em ${day.label}, o horário de abertura precisa ser menor que o fechamento.`;
      }

      const hasBreakStart = Boolean(day.breakStart);
      const hasBreakEnd = Boolean(day.breakEnd);

      if (hasBreakStart !== hasBreakEnd) {
        return `Em ${day.label}, informe início e fim do intervalo ou deixe os dois vazios.`;
      }

      if (hasBreakStart && hasBreakEnd) {
        const breakStartMinutes = timeToMinutes(day.breakStart);
        const breakEndMinutes = timeToMinutes(day.breakEnd);

        if (breakStartMinutes >= breakEndMinutes) {
          return `Em ${day.label}, o início do intervalo precisa ser menor que o fim.`;
        }

        if (
          breakStartMinutes <= openMinutes ||
          breakEndMinutes >= closeMinutes
        ) {
          return `Em ${day.label}, o intervalo precisa ficar dentro do horário de funcionamento.`;
        }
      }
    }

    return null;
  }

  function updateDay(dayOfWeek, field, value) {
    setWeekHours((currentDays) =>
      currentDays.map((day) => {
        if (day.dayOfWeek !== dayOfWeek) return day;

        if (field === "isOpen") {
          return {
            ...day,
            isOpen: value,
            openTime: value ? day.openTime || "08:00" : "00:00",
            closeTime: value ? day.closeTime || "18:00" : "00:00",
            breakStart: value ? day.breakStart : "",
            breakEnd: value ? day.breakEnd : "",
          };
        }

        return {
          ...day,
          [field]: value,
        };
      })
    );
  }

  function applyMondayToFridayPattern() {
    setWeekHours((currentDays) =>
      currentDays.map((day) => {
        if (day.dayOfWeek >= 1 && day.dayOfWeek <= 5) {
          return {
            ...day,
            isOpen: true,
            openTime: "08:00",
            closeTime: "18:00",
            breakStart: "12:00",
            breakEnd: "13:00",
          };
        }

        return day;
      })
    );

    setMessage("Padrão de segunda a sexta aplicado.");
  }

  function applySaturdayPattern() {
    setWeekHours((currentDays) =>
      currentDays.map((day) => {
        if (day.dayOfWeek === 6) {
          return {
            ...day,
            isOpen: true,
            openTime: "08:00",
            closeTime: "12:00",
            breakStart: "",
            breakEnd: "",
          };
        }

        return day;
      })
    );

    setMessage("Padrão de sábado aplicado.");
  }

  function closeSunday() {
    setWeekHours((currentDays) =>
      currentDays.map((day) => {
        if (day.dayOfWeek === 0) {
          return {
            ...day,
            isOpen: false,
            openTime: "00:00",
            closeTime: "00:00",
            breakStart: "",
            breakEnd: "",
          };
        }

        return day;
      })
    );

    setMessage("Domingo marcado como fechado.");
  }

  async function loadBusinessHours() {
    try {
      setMessage("");

      const response = await api.get("/business-hours");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.businessHours || [];

      const mergedDays = defaultDays.map((defaultDay) => {
        const savedDay = data.find(
          (item) => Number(item.dayOfWeek) === Number(defaultDay.dayOfWeek)
        );

        if (!savedDay) return defaultDay;

        return {
          ...defaultDay,
          id: savedDay.id,
          isOpen: Boolean(savedDay.isOpen),
          openTime: savedDay.isOpen ? savedDay.openTime || "08:00" : "00:00",
          closeTime: savedDay.isOpen ? savedDay.closeTime || "18:00" : "00:00",
          breakStart: savedDay.breakStart || "",
          breakEnd: savedDay.breakEnd || "",
        };
      });

      setWeekHours(mergedDays);
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message || "Erro ao carregar horários."
      );
    }
  }

  async function saveAllBusinessHours() {
    try {
      setLoading(true);
      setMessage("");

      const validationError = validateWeekHours();

      if (validationError) {
        setMessage(validationError);
        return;
      }

      const businessHours = weekHours.map(normalizeHour);

      await api.post("/business-hours/bulk", {
        businessHours,
      });

      setMessage("Horários salvos com sucesso.");

      await loadBusinessHours();
    } catch (error) {
      console.error(error);

      setMessage(error.response?.data?.message || "Erro ao salvar horários.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBusinessHours();
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="business-hours-title-row">
          <div>
            <h1>Horários</h1>
            <p>Configure os dias e horários de funcionamento da empresa.</p>
          </div>

          <button
            type="button"
            className="dashboard-refresh-button"
            onClick={loadBusinessHours}
            disabled={loading}
          >
            Atualizar
          </button>
        </div>

        {message && <div className="alert-message">{message}</div>}

        <section className="form-card business-hours-actions-card">
          <h2>Configuração rápida</h2>

          <div className="business-hours-actions">
            <button type="button" onClick={applyMondayToFridayPattern}>
              Aplicar segunda a sexta
            </button>

            <button type="button" onClick={applySaturdayPattern}>
              Aplicar sábado
            </button>

            <button
              type="button"
              className="secondary-action-button"
              onClick={closeSunday}
            >
              Fechar domingo
            </button>
          </div>
        </section>

        <section className="table-card business-hours-card">
          <div className="table-header-row">
            <div>
              <h2>Semana de funcionamento</h2>
              <p>
                Esses horários serão usados para calcular a disponibilidade dos
                agendamentos.
              </p>
            </div>

            <button
              type="button"
              onClick={saveAllBusinessHours}
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar todos"}
            </button>
          </div>

          <div className="business-hours-list">
            {weekHours.map((day) => (
              <div className="business-hour-row" key={day.dayOfWeek}>
                <div className="business-hour-day">
                  <strong>{day.label}</strong>
                  <span className={getStatusClass(day.isOpen)}>
                    {day.isOpen ? "Aberto" : "Fechado"}
                  </span>
                </div>

                <div className="business-hour-toggle">
                  <label>Aberto?</label>

                  <select
                    value={day.isOpen ? "true" : "false"}
                    onChange={(event) =>
                      updateDay(
                        day.dayOfWeek,
                        "isOpen",
                        event.target.value === "true"
                      )
                    }
                  >
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                </div>

                <div className="business-hour-field">
                  <label>Abertura</label>

                  <input
                    type="time"
                    value={day.isOpen ? day.openTime : "00:00"}
                    disabled={!day.isOpen}
                    onChange={(event) =>
                      updateDay(day.dayOfWeek, "openTime", event.target.value)
                    }
                  />
                </div>

                <div className="business-hour-field">
                  <label>Fechamento</label>

                  <input
                    type="time"
                    value={day.isOpen ? day.closeTime : "00:00"}
                    disabled={!day.isOpen}
                    onChange={(event) =>
                      updateDay(day.dayOfWeek, "closeTime", event.target.value)
                    }
                  />
                </div>

                <div className="business-hour-field">
                  <label>Início intervalo</label>

                  <input
                    type="time"
                    value={day.isOpen ? day.breakStart : ""}
                    disabled={!day.isOpen}
                    onChange={(event) =>
                      updateDay(day.dayOfWeek, "breakStart", event.target.value)
                    }
                  />
                </div>

                <div className="business-hour-field">
                  <label>Fim intervalo</label>

                  <input
                    type="time"
                    value={day.isOpen ? day.breakEnd : ""}
                    disabled={!day.isOpen}
                    onChange={(event) =>
                      updateDay(day.dayOfWeek, "breakEnd", event.target.value)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}