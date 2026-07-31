import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import Sidebar from "../components/Sidebar";

export default function Admin() {
  const [summary, setSummary] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [subscriptionFilter, setSubscriptionFilter] = useState("all");

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

  function translateSubscriptionStatus(status) {
    const statusMap = {
      trial: "Teste gratuito",
      active: "Ativa",
      overdue: "Atrasada",
      cancelled: "Cancelada",
    };

    return statusMap[status] || "Teste gratuito";
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

  function getSubscriptionClass(status) {
    const classMap = {
      trial: "subscription-badge trial",
      active: "subscription-badge active",
      overdue: "subscription-badge overdue",
      cancelled: "subscription-badge cancelled",
    };

    return classMap[status] || "subscription-badge trial";
  }

  function getCompanyRowClass(company) {
    const subscriptionStatus = company.subscriptionStatus || "trial";

    if (subscriptionStatus === "overdue") {
      return "admin-company-row overdue";
    }

    if (subscriptionStatus === "cancelled") {
      return "admin-company-row cancelled";
    }

    return "admin-company-row";
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("pt-BR");
  }

  function formatInputDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toISOString().slice(0, 10);
  }

  function getCompanyOwner(company) {
    return (
      company.users?.find((user) => user.role === "company_admin") ||
      company.users?.[0]
    );
  }

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("all");
    setPlanFilter("all");
    setSubscriptionFilter("all");
  }

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const owner = getCompanyOwner(company);

      const normalizedSearch = searchTerm.trim().toLowerCase();

      const companyStatus = company.status || "inactive";
      const companyPlan = company.plan || "start";
      const subscriptionStatus = company.subscriptionStatus || "trial";

      const matchesSearch =
        !normalizedSearch ||
        company.name?.toLowerCase().includes(normalizedSearch) ||
        company.slug?.toLowerCase().includes(normalizedSearch) ||
        company.email?.toLowerCase().includes(normalizedSearch) ||
        owner?.name?.toLowerCase().includes(normalizedSearch) ||
        owner?.email?.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" || companyStatus === statusFilter;

      const matchesPlan = planFilter === "all" || companyPlan === planFilter;

      const matchesSubscription =
        subscriptionFilter === "all" ||
        subscriptionStatus === subscriptionFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPlan &&
        matchesSubscription
      );
    });
  }, [companies, searchTerm, statusFilter, planFilter, subscriptionFilter]);

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

  async function updateCompanySubscription(company, field, value) {
    try {
      setUpdatingId(company.id);
      setMessage("");

      const payload = {
        subscriptionStatus:
          field === "subscriptionStatus"
            ? value
            : company.subscriptionStatus || "trial",
        subscriptionStart:
          field === "subscriptionStart"
            ? value || null
            : formatInputDate(company.subscriptionStart) || null,
        subscriptionEnd:
          field === "subscriptionEnd"
            ? value || null
            : formatInputDate(company.subscriptionEnd) || null,
        trialEndsAt:
          field === "trialEndsAt"
            ? value || null
            : formatInputDate(company.trialEndsAt) || null,
      };

      const response = await api.patch(
        `/admin/companies/${company.id}/subscription`,
        payload
      );

      setMessage(
        response.data?.message || "Assinatura atualizada com sucesso."
      );

      await loadAdminData();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Erro ao atualizar assinatura da empresa."
      );
    } finally {
      setUpdatingId("");
    }
  }

  async function runSubscriptionQuickAction(company, action) {
    try {
      setUpdatingId(company.id);
      setMessage("");

      const actionConfig = {
        renew: {
          endpoint: `/admin/companies/${company.id}/subscription/renew`,
          payload: {
            days: 30,
          },
          fallback: "Assinatura renovada por mais 30 dias.",
        },
        extendTrial: {
          endpoint: `/admin/companies/${company.id}/subscription/extend-trial`,
          payload: {
            days: 7,
          },
          fallback: "Trial estendido por mais 7 dias.",
        },
        markActive: {
          endpoint: `/admin/companies/${company.id}/subscription/mark-active`,
          payload: {},
          fallback: "Assinatura marcada como ativa.",
        },
        markOverdue: {
          endpoint: `/admin/companies/${company.id}/subscription/mark-overdue`,
          payload: {},
          fallback: "Assinatura marcada como atrasada.",
        },
        reactivate: {
          endpoint: `/admin/companies/${company.id}/subscription/reactivate`,
          payload: {
            days: 30,
          },
          fallback: "Empresa reativada com assinatura ativa por 30 dias.",
        },
      };

      const selectedAction = actionConfig[action];

      if (!selectedAction) {
        setMessage("Ação rápida inválida.");
        return;
      }

      const response = await api.patch(
        selectedAction.endpoint,
        selectedAction.payload
      );

      setMessage(response.data?.message || selectedAction.fallback);

      await loadAdminData();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Erro ao executar ação rápida de assinatura."
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
      setMessage(
        'Exclusão cancelada. Para excluir, é necessário digitar "EXCLUIR".'
      );
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
        response.data?.message ||
          "Empresa excluída permanentemente com sucesso."
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
                <span>Trial</span>
                <strong>{summary.trialCompanies ?? 0}</strong>
                <small>Teste gratuito</small>
              </div>

              <div className="dashboard-card">
                <span>Assinaturas ativas</span>
                <strong>{summary.activeSubscriptions ?? 0}</strong>
                <small>Pagantes/ativas</small>
              </div>

              <div className="dashboard-card">
                <span>Atrasadas</span>
                <strong>{summary.overdueSubscriptions ?? 0}</strong>
                <small>Pagamento pendente</small>
              </div>

              <div className="dashboard-card">
                <span>Canceladas</span>
                <strong>{summary.cancelledSubscriptions ?? 0}</strong>
                <small>Assinaturas encerradas</small>
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
                Ative, bloqueie, altere planos, controle assinaturas ou exclua
                empresas cadastradas na plataforma.
              </p>
            </div>
          </div>

          <div className="admin-filters-panel">
            <div className="admin-search-field">
              <label>Buscar empresa</label>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Nome, slug, responsável ou e-mail"
              />
            </div>

            <div>
              <label>Status</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">Todos</option>
                <option value="active">Ativas</option>
                <option value="inactive">Bloqueadas</option>
              </select>
            </div>

            <div>
              <label>Plano</label>
              <select
                value={planFilter}
                onChange={(event) => setPlanFilter(event.target.value)}
              >
                <option value="all">Todos</option>
                <option value="start">Start</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <div>
              <label>Assinatura</label>
              <select
                value={subscriptionFilter}
                onChange={(event) => setSubscriptionFilter(event.target.value)}
              >
                <option value="all">Todas</option>
                <option value="trial">Trial</option>
                <option value="active">Ativa</option>
                <option value="overdue">Atrasada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>

            <button
              type="button"
              className="admin-clear-filters-button"
              onClick={clearFilters}
            >
              Limpar filtros
            </button>
          </div>

          <div className="admin-filter-result">
            <strong>{filteredCompanies.length}</strong>
            <span>
              {filteredCompanies.length === 1
                ? "empresa encontrada"
                : "empresas encontradas"}
            </span>
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
                  <th>Assinatura</th>
                  <th>Trial até</th>
                  <th>Início</th>
                  <th>Vencimento</th>
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
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan="16">
                      Nenhuma empresa encontrada com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((company) => {
                    const owner = getCompanyOwner(company);
                    const isActive = company.status === "active";
                    const isUpdating = updatingId === company.id;
                    const companyPlan = company.plan || "start";
                    const subscriptionStatus =
                      company.subscriptionStatus || "trial";

                    return (
                      <tr
                        key={company.id}
                        className={getCompanyRowClass(company)}
                      >
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
                                updateCompanyPlan(
                                  company.id,
                                  event.target.value
                                )
                              }
                            >
                              <option value="start">Start</option>
                              <option value="pro">Pro</option>
                              <option value="premium">Premium</option>
                            </select>
                          </div>
                        </td>

                        <td>
                          <div className="admin-subscription-cell">
                            <span
                              className={getSubscriptionClass(
                                subscriptionStatus
                              )}
                            >
                              {company.subscriptionLabel ||
                                translateSubscriptionStatus(
                                  subscriptionStatus
                                )}
                            </span>

                            <select
                              className="admin-plan-select"
                              value={subscriptionStatus}
                              disabled={isUpdating}
                              onChange={(event) =>
                                updateCompanySubscription(
                                  company,
                                  "subscriptionStatus",
                                  event.target.value
                                )
                              }
                            >
                              <option value="trial">Trial</option>
                              <option value="active">Ativa</option>
                              <option value="overdue">Atrasada</option>
                              <option value="cancelled">Cancelada</option>
                            </select>
                          </div>
                        </td>

                        <td>
                          <input
                            type="date"
                            className="admin-date-input"
                            value={formatInputDate(company.trialEndsAt)}
                            disabled={isUpdating}
                            onChange={(event) =>
                              updateCompanySubscription(
                                company,
                                "trialEndsAt",
                                event.target.value
                              )
                            }
                          />
                          <small>{formatDate(company.trialEndsAt)}</small>
                        </td>

                        <td>
                          <input
                            type="date"
                            className="admin-date-input"
                            value={formatInputDate(company.subscriptionStart)}
                            disabled={isUpdating}
                            onChange={(event) =>
                              updateCompanySubscription(
                                company,
                                "subscriptionStart",
                                event.target.value
                              )
                            }
                          />
                          <small>{formatDate(company.subscriptionStart)}</small>
                        </td>

                        <td>
                          <input
                            type="date"
                            className="admin-date-input"
                            value={formatInputDate(company.subscriptionEnd)}
                            disabled={isUpdating}
                            onChange={(event) =>
                              updateCompanySubscription(
                                company,
                                "subscriptionEnd",
                                event.target.value
                              )
                            }
                          />
                          <small>{formatDate(company.subscriptionEnd)}</small>
                        </td>

                        <td>{formatDate(company.createdAt)}</td>

                        <td>{company._count?.users || 0}</td>

                        <td>{company._count?.services || 0}</td>

                        <td>
                          <strong>{company._count?.professionals || 0}</strong>
                          <br />
                          <small>
                            Limite: {company.planLimits?.professionals ?? "—"}
                          </small>
                        </td>

                        <td>{company._count?.clients || 0}</td>

                        <td>{company._count?.appointments || 0}</td>

                        <td>
                          <div className="table-actions admin-actions-stack">
                            <div className="admin-main-actions">
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

                            <div className="admin-quick-actions">
                              <button
                                type="button"
                                onClick={() =>
                                  runSubscriptionQuickAction(company, "renew")
                                }
                                disabled={isUpdating}
                              >
                                +30 dias
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  runSubscriptionQuickAction(
                                    company,
                                    "extendTrial"
                                  )
                                }
                                disabled={isUpdating}
                              >
                                +7 trial
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  runSubscriptionQuickAction(
                                    company,
                                    "markActive"
                                  )
                                }
                                disabled={isUpdating}
                              >
                                Ativa
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  runSubscriptionQuickAction(
                                    company,
                                    "markOverdue"
                                  )
                                }
                                disabled={isUpdating}
                              >
                                Atrasar
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  runSubscriptionQuickAction(
                                    company,
                                    "reactivate"
                                  )
                                }
                                disabled={isUpdating}
                              >
                                Reativar
                              </button>
                            </div>
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