import { useEffect, useState } from "react";
import api from "../api/api";
import Sidebar from "../components/Sidebar";

export default function Admin() {
  const [summary, setSummary] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadAdminData() {
    try {
      setLoading(true);
      setMessage("");

      const [summaryResponse, companiesResponse] = await Promise.all([
        api.get("/admin/summary"),
        api.get("/admin/companies"),
      ]);

      setSummary(summaryResponse.data);
      setCompanies(companiesResponse.data);
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.message ||
          "Erro ao carregar painel administrativo."
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateCompanyStatus(companyId, status) {
    try {
      setMessage("");

      await api.patch(`/admin/companies/${companyId}/status`, {
        status,
      });

      await loadAdminData();
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.message ||
          "Erro ao atualizar status da empresa."
      );
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <h1>Painel Master</h1>
        <p>Controle geral das empresas cadastradas na LopeX Agenda.</p>

        {message && <div className="alert-message">{message}</div>}

        {loading && <div className="alert-message">Carregando dados...</div>}

        {summary && (
          <div className="dashboard-cards">
            <div className="dashboard-card">
              <span>Empresas</span>
              <strong>{summary.companies}</strong>
            </div>

            <div className="dashboard-card">
              <span>Empresas ativas</span>
              <strong>{summary.activeCompanies}</strong>
            </div>

            <div className="dashboard-card">
              <span>Usuários</span>
              <strong>{summary.users}</strong>
            </div>

            <div className="dashboard-card">
              <span>Agendamentos</span>
              <strong>{summary.appointments}</strong>
            </div>
          </div>
        )}

        <div className="table-card admin-table-card">
          <h2>Empresas cadastradas</h2>

          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Responsável</th>
                <th>E-mail</th>
                <th>Status</th>
                <th>Serviços</th>
                <th>Profissionais</th>
                <th>Clientes</th>
                <th>Agendamentos</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan="9">Nenhuma empresa cadastrada.</td>
                </tr>
              ) : (
                companies.map((company) => {
                  const owner =
                    company.users?.find(
                      (user) => user.role === "company_admin"
                    ) || company.users?.[0];

                  return (
                    <tr key={company.id}>
                      <td>
                        <strong>{company.name}</strong>
                        <br />
                        <small>{company.slug}</small>
                      </td>

                      <td>{owner?.name || "—"}</td>
                      <td>{owner?.email || company.email || "—"}</td>

                      <td>
                        <span
                          className={
                            company.status === "active"
                              ? "status-badge active"
                              : "status-badge blocked"
                          }
                        >
                          {company.status}
                        </span>
                      </td>

                      <td>{company._count?.services || 0}</td>
                      <td>{company._count?.professionals || 0}</td>
                      <td>{company._count?.clients || 0}</td>
                      <td>{company._count?.appointments || 0}</td>

                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            onClick={() =>
                              updateCompanyStatus(company.id, "active")
                            }
                          >
                            Ativar
                          </button>

                          <button
                            type="button"
                            className="danger-button"
                            onClick={() =>
                              updateCompanyStatus(company.id, "blocked")
                            }
                          >
                            Bloquear
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}