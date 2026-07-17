import { useEffect, useState } from "react";
import api from "../api/api";
import Sidebar from "../components/Sidebar";

const days = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

export default function BusinessHours() {
  const [businessHours, setBusinessHours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    dayOfWeek: 1,
    isOpen: true,
    openTime: "08:00",
    closeTime: "18:00",
    breakStart: "12:00",
    breakEnd: "13:00",
  });

  async function loadBusinessHours() {
    try {
      const response = await api.get("/business-hours");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.businessHours || [];

      setBusinessHours(data);
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.message || "Erro ao carregar horários."
      );
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await api.post("/business-hours", {
        dayOfWeek: Number(form.dayOfWeek),
        isOpen: form.isOpen,
        openTime: form.isOpen ? form.openTime : "00:00",
        closeTime: form.isOpen ? form.closeTime : "00:00",
        breakStart: form.isOpen && form.breakStart ? form.breakStart : null,
        breakEnd: form.isOpen && form.breakEnd ? form.breakEnd : null,
      });

      setMessage("Horário salvo com sucesso.");
      await loadBusinessHours();
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || "Erro ao salvar horário.");
    } finally {
      setLoading(false);
    }
  }

  function getDayName(dayOfWeek) {
    return days.find((day) => day.value === Number(dayOfWeek))?.label || "—";
  }

  useEffect(() => {
    loadBusinessHours();
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <h1>Horários</h1>
        <p>Configure os dias e horários de funcionamento da empresa.</p>

        {message && <div className="alert-message">{message}</div>}

        <form className="form-card" onSubmit={handleSubmit}>
          <div>
            <label>Dia da semana</label>
            <select
              value={form.dayOfWeek}
              onChange={(e) =>
                setForm({ ...form, dayOfWeek: Number(e.target.value) })
              }
            >
              {days.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Aberto?</label>
            <select
              value={form.isOpen ? "true" : "false"}
              onChange={(e) =>
                setForm({ ...form, isOpen: e.target.value === "true" })
              }
            >
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </div>

          {form.isOpen && (
            <>
              <div>
                <label>Horário de abertura</label>
                <input
                  type="time"
                  value={form.openTime}
                  onChange={(e) =>
                    setForm({ ...form, openTime: e.target.value })
                  }
                />
              </div>

              <div>
                <label>Horário de fechamento</label>
                <input
                  type="time"
                  value={form.closeTime}
                  onChange={(e) =>
                    setForm({ ...form, closeTime: e.target.value })
                  }
                />
              </div>

              <div>
                <label>Início do intervalo</label>
                <input
                  type="time"
                  value={form.breakStart}
                  onChange={(e) =>
                    setForm({ ...form, breakStart: e.target.value })
                  }
                />
              </div>

              <div>
                <label>Fim do intervalo</label>
                <input
                  type="time"
                  value={form.breakEnd}
                  onChange={(e) =>
                    setForm({ ...form, breakEnd: e.target.value })
                  }
                />
              </div>
            </>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar horário"}
          </button>
        </form>

        <div className="table-card">
          <h2>Horários cadastrados</h2>

          <table>
            <thead>
              <tr>
                <th>Dia</th>
                <th>Status</th>
                <th>Abertura</th>
                <th>Fechamento</th>
                <th>Intervalo</th>
              </tr>
            </thead>

            <tbody>
              {businessHours.length === 0 ? (
                <tr>
                  <td colSpan="5">Nenhum horário cadastrado.</td>
                </tr>
              ) : (
                businessHours.map((hour) => (
                  <tr key={hour.id}>
                    <td>{getDayName(hour.dayOfWeek)}</td>
                    <td>{hour.isOpen ? "Aberto" : "Fechado"}</td>
                    <td>{hour.isOpen ? hour.openTime : "—"}</td>
                    <td>{hour.isOpen ? hour.closeTime : "—"}</td>
                    <td>
                      {hour.breakStart && hour.breakEnd
                        ? `${hour.breakStart} às ${hour.breakEnd}`
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}