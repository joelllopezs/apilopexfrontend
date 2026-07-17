import { useEffect, useState } from "react";
import api from "../api/api";
import Sidebar from "../components/Sidebar";

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  async function loadClients() {
    try {
      const response = await api.get("/clients");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.clients || [];

      setClients(data);
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.message ||
          "Erro ao carregar clientes."
      );
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await api.post("/clients", {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
      });

      setForm({
        name: "",
        email: "",
        phone: "",
      });

      setMessage("Cliente cadastrado com sucesso.");
      await loadClients();
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.message ||
          "Erro ao cadastrar cliente."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <h1>Clientes</h1>
        <p>Cadastre os clientes que poderão receber agendamentos.</p>

        {message && <div className="alert-message">{message}</div>}

        <form className="form-card" onSubmit={handleSubmit}>
          <div>
            <label>Nome do cliente</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Carlos Cliente"
              required
            />
          </div>

          <div>
            <label>E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Ex: cliente@email.com"
            />
          </div>

          <div>
            <label>Telefone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Ex: (14) 99999-9999"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Cadastrando..." : "Cadastrar cliente"}
          </button>
        </form>

        <div className="table-card">
          <h2>Clientes cadastrados</h2>

          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Telefone</th>
              </tr>
            </thead>

            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan="3">Nenhum cliente cadastrado.</td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id}>
                    <td>{client.name}</td>
                    <td>{client.email || "—"}</td>
                    <td>{client.phone || "—"}</td>
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