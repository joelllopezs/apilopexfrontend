import { useEffect, useState } from "react";
import api from "../api/api";
import Sidebar from "../components/Sidebar";

export default function Admin() {
  const [summary, setSummary] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");

  function translateStatus(status) {
    const statusMap = {
      active: "Ativa",
      inactive: "Bloqueada",
      blocked: "Bloqueada",
    };

    return statusMap[status] || status;
  }

  function translatePlan(plan) {
    const planMap = {
      start: "Start",
      pro: "Pro",
      premium: "Premium",
    };

    return planMap[plan] || "Start";
  }

  function getStatusClass(status) {
    return status === "active" ? "status-badge active" : "status-badge blocked";
  }

  function getPlanClass(plan) {
    const planClassMap = {
      start: "plan-badge start",
      pro: "plan-badge pro",
      premium: "plan-badge premium",
    };

    return planClassMap[plan] || "plan-badge start";
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("pt-BR");
  }

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
      setUpdatingId(companyId);
      setMessage("");

      const response = await api.patch(`/admin/companies/${companyId}/status`, {
        status,
      });

      setMessage(
        response.data?.message ||
          (status === "active"
            ? "Empresa ativada com sucesso."
            : "Empresa bloqueada com sucesso.")
      );

      await loadAdminData();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Erro ao atualizar status da empresa."
      );
    } finally {
      setUpdatingId("");
    }
  }

  async function updateCompanyPlan(companyId, plan) {
    try {
      setUpdatingId(companyId);
      setMessage("");

      const response = await api.patch(`/admin/companies/${companyId}/plan`, {
        plan,
      });

      setMessage(
        response.data?.message ||
          `Plano alterado para ${translatePlan(plan)} com sucesso.`
      );

      await loadAdminData();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Erro ao atualizar plano da empresa."
      );
    } finally {
      setUpdatingId("");
    }
  }

  async function deleteCompany(company) {
    const firstConfirm = window.confirm(
      `Deseja realmente excluir permanentemente a empresa "${company.name}"? Essa ação apagará usuários, serviços, profissionais, clientes, horários e agendamentos dessa empresa.`
    );

    if (!firstConfirm) return;

    const confirmText = window.prompt(
      `Para confirmar a exclusão permanente de "${company.name}", digite EXCLUIR`
    );

    if (confirmText !== "EXCLUIR") {
      setMessage('Exclusão cancelada. Para excluir, é necessário digitar "EXCLUIR".');
      return;
    }

    try {
      setUpdatingId(company.id);
      setMessage("");

      const response = await api.delete(`/admin/companies/${company.id}`, {
        data: {
          confirmText: "EXCLUIR",
        },
      });

      setMessage(
        response.data?.message || "Empresa excluída permanentemente com sucesso."
      );

      await loadAdminData();
    } catch (error) {
      console.error(error);

      setMessage(error.response?.data?.message || "Erro ao excluir empresa.");
    } finally {
      setUpdatingId("");
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="admin-title-row">
          <div>
            <h1>Painel Master</h1>
            <p>Controle geral das empresas cadastradas na LopeX Agenda.</p>
          </div>

          <button
            type="button"
            className="dashboard-refresh-button"
            onClick={loadAdminData}
            disabled={loading}
          >
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        {message && <div className="alert-message">{message}</div>}

        {loading && <div className="alert-message">Carregando dados...</div>}

        {summary && (
          <>
            <div className="dashboard-cards">
              <div className="dashboard-card">
                <span>Empresas</span>
                <strong>{summary.companies}</strong>
                <small>Total cadastradas</small>
              </div>

              <div className="dashboard-card">
                <span>Ativas</span>
                <strong>{summary.activeCompanies}</strong>
                <small>Liberadas para uso</small>
              </div>

              <div className="dashboard-card">
                <span>Bloqueadas</span>
                <strong>
                  {summary.inactiveCompanies ?? summary.blockedCompanies ?? 0}
                </strong>
                <small>Aguardando liberação</small>
              </div>

              <div className="dashboard-card">
                <span>Usuários</span>
                <strong>{summary.users}</strong>
                <small>Total no sistema</small>
              </div>
            </div>

            <div className="dashboard-cards secondary-cards">
              <div className="dashboard-card">
                <span>Start</span>
                <strong>{summary.startCompanies ?? 0}</strong>
                <small>Até 2 profissionais</small>
              </div>

              <div className="dashboard-card">
                <span>Pro</span>
                <strong>{summary.proCompanies ?? 0}</strong>
                <small>Até 5 profissionais</small>
              </div>

              <div className="dashboard-card">
                <span>Premium</span>
                <strong>{summary.premiumCompanies ?? 0}</strong>
                <small>Até 15 profissionais</small>
              </div>

              <div className="dashboard-card">
                <span>Agendamentos</span>
                <strong>{summary.appointments}</strong>
                <small>Total geral</small>
              </div>
            </div>

            <div className="dashboard-cards secondary-cards">
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
                <span>Cancelados</span>
                <strong>{summary.cancelledAppointments ?? 0}</strong>
              </div>
            </div>
          </>
        )}

        <div className="table-card admin-table-card">
          <div className="table-header-row">
            <div>
              <h2>Empresas cadastradas</h2>
              <p>
                Ative, bloqueie, altere planos ou exclua empresas cadastradas
                na plataforma.
              </p>
            </div>
          </div>

          <div className="admin-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Responsável</th>
                  <th>E-mail</th>
                  <th>Status</th>
                  <th>Plano</th>
                  <th>Criada em</th>
                  <th>Usuários</th>
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
                    <td colSpan="12">Nenhuma empresa cadastrada.</td>
                  </tr>
                ) : (
                  companies.map((company) => {
                    const owner =
                      company.users?.find(
                        (user) => user.role === "company_admin"
                      ) || company.users?.[0];

                    const isActive = company.status === "active";
                    const isUpdating = updatingId === company.id;
                    const companyPlan = company.plan || "start";

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
                          <span className={getStatusClass(company.status)}>
                            {translateStatus(company.status)}
                          </span>
                        </td>

                        <td>
                          <div className="admin-plan-cell">
                            <span className={getPlanClass(companyPlan)}>
                              {company.planLabel || translatePlan(companyPlan)}
                            </span>

                            <select
                              className="admin-plan-select"
                              value={companyPlan}
                              disabled={isUpdating}
                              onChange={(event) =>
                                updateCompanyPlan(company.id, event.target.value)
                              }
                            >
                              <option value="start">Start</option>
                              <option value="pro">Pro</option>
                              <option value="premium">Premium</option>
                            </select>
                          </div>
                        </td>

                        <td>{formatDate(company.createdAt)}</td>

                        <td>{company._count?.users || 0}</td>

                        <td>{company._count?.services || 0}</td>

                        <td>
                          <strong>{company._count?.professionals || 0}</strong>
                          <br />
                          <small>
                            Limite:{" "}
                            {company.planLimits?.professionals ?? "—"}
                          </small>
                        </td>

                        <td>{company._count?.clients || 0}</td>

                        <td>{company._count?.appointments || 0}</td>

                        <td>
                          <div className="table-actions">
                            {!isActive && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateCompanyStatus(company.id, "active")
                                }
                                disabled={isUpdating}
                              >
                                Ativar
                              </button>
                            )}

                            {isActive && (
                              <button
                                type="button"
                                className="danger-button"
                                onClick={() =>
                                  updateCompanyStatus(company.id, "inactive")
                                }
                                disabled={isUpdating}
                              >
                                Bloquear
                              </button>
                            )}

                            <button
                              type="button"
                              className="danger-button"
                              onClick={() => deleteCompany(company)}
                              disabled={isUpdating}
                            >
                              Excluir
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
        </div>
      </main>
    </div>
  );
}