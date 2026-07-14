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

  const user = JSON.parse(localStorage.getItem("@lopex:user") || "{}");

  useEffect(() => {
    async function load() {
      const [services, professionals, clients, appointments] =
        await Promise.all([
          api.get("/services"),
          api.get("/professionals"),
          api.get("/clients"),
          api.get("/appointments"),
        ]);

      setSummary({
        services: services.data.length,
        professionals: professionals.data.length,
        clients: clients.data.length,
        appointments: appointments.data.length,
      });
    }

    load();
  }, []);

  return (
    <div className="layout">
      <Sidebar />

      <main className="content">
        <h1>Dashboard</h1>
        <p style={{ color: "#b8b8c8" }}>
          Bem-vindo, {user.name}. Empresa: {user.company?.name || "—"}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 18,
            marginTop: 28,
          }}
        >
          <div className="card">
            <span className="badge">Serviços</span>
            <h2>{summary.services}</h2>
          </div>

          <div className="card">
            <span className="badge">Profissionais</span>
            <h2>{summary.professionals}</h2>
          </div>

          <div className="card">
            <span className="badge">Clientes</span>
            <h2>{summary.clients}</h2>
          </div>

          <div className="card">
            <span className="badge">Agendamentos</span>
            <h2>{summary.appointments}</h2>
          </div>
        </div>
      </main>
    </div>
  );
}