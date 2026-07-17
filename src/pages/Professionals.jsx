import { useEffect, useState } from "react";
import api from "../api/api";
import Sidebar from "../components/Sidebar";

export default function Professionals() {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  async function loadProfessionals() {
    try {
      const response = await api.get("/professionals");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.professionals || [];

      setProfessionals(data);
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.message ||
          "Erro ao carregar profissionais."
      );
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await api.post("/professionals", {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
      });

      setForm({
        name: "",
        email: "",
        phone: "",
      });

      setMessage("Profissional cadastrado com sucesso.");
      await loadProfessionals();
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.message ||
          "Erro ao cadastrar profissional."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfessionals();
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <h1>Profissionais</h1>
        <p>Cadastre os profissionais que poderão receber agendamentos.</p>

        {message && <div className="alert-message">{message}</div>}

        <form className="form-card" onSubmit={handleSubmit}>
          <div>
            <label>Nome do profissional</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: João Silva"
              required
            />
          </div>

          <div>
            <label>E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Ex: joao@email.com"
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
            {loading ? "Cadastrando..." : "Cadastrar profissional"}
          </button>
        </form>

        <div className="table-card">
          <h2>Profissionais cadastrados</h2>

          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {professionals.length === 0 ? (
                <tr>
                  <td colSpan="4">Nenhum profissional cadastrado.</td>
                </tr>
              ) : (
                professionals.map((professional) => (
                  <tr key={professional.id}>
                    <td>{professional.name}</td>
                    <td>{professional.email || "—"}</td>
                    <td>{professional.phone || "—"}</td>
                    <td>{professional.status}</td>
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