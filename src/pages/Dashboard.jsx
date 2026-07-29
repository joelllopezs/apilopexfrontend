import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/api";

export default function Dashboard() {
  const [summary, setSummary] = useState({
    services: 0,
    professionals: 0,
    clients: 0,
    appointments: 0,
  });

  const [company, setCompany] = useState(null);
  const [message, setMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("@lopex:user") || "{}");

  async function loadDashboard() {
    try {
      setMessage("");

      const [
        servicesResponse,
        professionalsResponse,
        clientsResponse,
        appointmentsResponse,
        companyResponse,
      ] = await Promise.all([
        api.get("/services"),
        api.get("/professionals"),
        api.get("/clients"),
        api.get("/appointments"),
        api.get("/companies/me").catch(() => null),
      ]);

      setSummary({
        services: servicesResponse.data.length,
        professionals: professionalsResponse.data.length,
        clients: clientsResponse.data.length,
        appointments: appointmentsResponse.data.length,
      });

      if (companyResponse?.data) {
        setCompany(companyResponse.data);
      }
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.message || "Erro ao carregar dados do dashboard."
      );
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <h1>Dashboard</h1>

        <p>
          Bem-vindo, {user.name || "usuário"}. Empresa:{" "}
          {company?.name || user.company?.name || "—"}
        </p>

        {message && <div className="alert-message">{message}</div>}

        <div className="dashboard-cards">
          <div className="dashboard-card">
            <span>Serviços</span>
            <strong>{summary.services}</strong>
          </div>

          <div className="dashboard-card">
            <span>Profissionais</span>
            <strong>{summary.professionals}</strong>
          </div>

          <div className="dashboard-card">
            <span>Clientes</span>
            <strong>{summary.clients}</strong>
          </div>

          <div className="dashboard-card">
            <span>Agendamentos</span>
            <strong>{summary.appointments}</strong>
          </div>
        </div>
      </main>
    </div>
  );
}