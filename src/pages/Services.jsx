import { useEffect, useState } from "react";
import api from "../api/api";
import Sidebar from "../components/Sidebar";

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    duration: 30,
    price: "",
  });

  async function loadServices() {
    try {
      const response = await api.get("/services");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.services || [];

      setServices(data);
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.message ||
          "Erro ao carregar serviços. Verifique o token ou a API."
      );
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await api.post("/services", {
        name: form.name,
        description: form.description,
        duration: Number(form.duration),
        price: form.price ? Number(form.price) : null,
      });

      setForm({
        name: "",
        description: "",
        duration: 30,
        price: "",
      });

      setMessage("Serviço cadastrado com sucesso.");
      await loadServices();
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.message ||
          "Erro ao cadastrar serviço. Verifique se o usuário está vinculado a uma empresa."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <h1>Serviços</h1>
        <p>Cadastre os serviços disponíveis para agendamento.</p>

        {message && <div className="alert-message">{message}</div>}

        <form className="form-card" onSubmit={handleSubmit}>
          <div>
            <label>Nome do serviço</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Corte masculino"
              required
            />
          </div>

          <div>
            <label>Descrição</label>
            <input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Ex: Corte simples masculino"
            />
          </div>

          <div>
            <label>Duração em minutos</label>
            <input
              type="number"
              value={form.duration}
              onChange={(e) =>
                setForm({ ...form, duration: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label>Preço</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Ex: 35"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Cadastrando..." : "Cadastrar serviço"}
          </button>
        </form>

        <div className="table-card">
          <h2>Serviços cadastrados</h2>

          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Duração</th>
                <th>Preço</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td colSpan="4">Nenhum serviço cadastrado.</td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id}>
                    <td>{service.name}</td>
                    <td>{service.duration} min</td>
                    <td>
                      {service.price
                        ? `R$ ${Number(service.price).toFixed(2)}`
                        : "—"}
                    </td>
                    <td>{service.status}</td>
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