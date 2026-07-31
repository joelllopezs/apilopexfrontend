import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/api";

function formatDateTime(value) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

function translateAction(action) {
  const labels = {
    company_activated: "Empresa ativada",
    company_blocked: "Empresa bloqueada",
    company_plan_changed: "Plano alterado",
    company_subscription_changed: "Assinatura alterada",
    company_subscription_renewed: "Assinatura renovada",
    company_trial_extended: "Trial estendido",
    company_subscription_marked_active: "Assinatura ativada",
    company_subscription_marked_overdue: "Assinatura atrasada",
    company_reactivated: "Empresa reativada",
    company_deleted: "Empresa excluída",
  };

  return labels[action] || action || "-";
}

function translateEntity(entity) {
  const labels = {
    company: "Empresa",
    user: "Usuário",
    service: "Serviço",
    professional: "Profissional",
    client: "Cliente",
    appointment: "Agendamento",
    business_hour: "Horário",
  };

  return labels[entity] || entity || "-";
}

function getActionBadgeClass(action) {
  if (
    [
      "company_activated",
      "company_subscription_renewed",
      "company_trial_extended",
      "company_subscription_marked_active",
      "company_reactivated",
    ].includes(action)
  ) {
    return "audit-action-badge success";
  }

  if (
    [
      "company_blocked",
      "company_subscription_marked_overdue",
      "company_deleted",
    ].includes(action)
  ) {
    return "audit-action-badge danger";
  }

  if (action === "company_plan_changed") {
    return "audit-action-badge info";
  }

  return "audit-action-badge";
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const actionOptions = useMemo(() => {
    return [
      { value: "", label: "Todas as ações" },
      { value: "company_activated", label: "Empresa ativada" },
      { value: "company_blocked", label: "Empresa bloqueada" },
      { value: "company_plan_changed", label: "Plano alterado" },
      { value: "company_subscription_changed", label: "Assinatura alterada" },
      { value: "company_subscription_renewed", label: "Assinatura renovada" },
      { value: "company_trial_extended", label: "Trial estendido" },
      {
        value: "company_subscription_marked_active",
        label: "Assinatura ativada",
      },
      {
        value: "company_subscription_marked_overdue",
        label: "Assinatura atrasada",
      },
      { value: "company_reactivated", label: "Empresa reativada" },
      { value: "company_deleted", label: "Empresa excluída" },
    ];
  }, []);

  const entityOptions = useMemo(() => {
    return [
      { value: "", label: "Todas as entidades" },
      { value: "company", label: "Empresa" },
      { value: "user", label: "Usuário" },
      { value: "service", label: "Serviço" },
      { value: "professional", label: "Profissional" },
      { value: "client", label: "Cliente" },
      { value: "appointment", label: "Agendamento" },
      { value: "business_hour", label: "Horário" },
    ];
  }, []);

  async function loadSummary() {
    try {
      const response = await api.get("/audit-logs/summary");
      setSummary(response.data);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadLogs(page = 1) {
    try {
      setLoading(true);
      setMessage("");

      const params = {
        page,
        limit: pagination.limit,
      };

      if (search.trim()) params.search = search.trim();
      if (action) params.action = action;
      if (entity) params.entity = entity;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get("/audit-logs", { params });

      setLogs(response.data.logs || []);
      setPagination(
        response.data.pagination || {
          page,
          limit: 50,
          total: 0,
          totalPages: 1,
        }
      );
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.message || "Erro ao carregar logs de auditoria."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    loadLogs(1);
  }

  function clearFilters() {
    setSearch("");
    setAction("");
    setEntity("");
    setStartDate("");
    setEndDate("");

    setTimeout(() => {
      loadLogs(1);
    }, 0);
  }

  function goToPreviousPage() {
    if (pagination.page <= 1) return;
    loadLogs(pagination.page - 1);
  }

  function goToNextPage() {
    if (pagination.page >= pagination.totalPages) return;
    loadLogs(pagination.page + 1);
  }

  useEffect(() => {
    loadSummary();
    loadLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="audit-title-row">
          <div>
            <h1>Logs de Auditoria</h1>
            <p>
              Acompanhe as principais ações realizadas no Admin Master e no
              sistema.
            </p>
          </div>

          <button
            type="button"
            className="dashboard-refresh-button"
            onClick={() => {
              loadSummary();
              loadLogs(pagination.page);
            }}
            disabled={loading}
          >
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        {message && <div className="alert-message">{message}</div>}

        <section className="dashboard-cards audit-summary-cards">
          <div className="dashboard-card">
            <span>Total de logs</span>
            <strong>{summary?.totalLogs ?? 0}</strong>
            <small>Registros salvos</small>
          </div>

          <div className="dashboard-card">
            <span>Hoje</span>
            <strong>{summary?.logsToday ?? 0}</strong>
            <small>Ações registradas hoje</small>
          </div>

          <div className="dashboard-card">
            <span>Últimos 7 dias</span>
            <strong>{summary?.logsLast7Days ?? 0}</strong>
            <small>Movimentações recentes</small>
          </div>

          <div className="dashboard-card">
            <span>Página atual</span>
            <strong>{pagination.page}</strong>
            <small>
              {pagination.totalPages || 1} página
              {(pagination.totalPages || 1) > 1 ? "s" : ""}
            </small>
          </div>
        </section>

        <form className="audit-filters-panel" onSubmit={handleSubmit}>
          <div className="audit-search-field">
            <label>Buscar</label>
            <input
              type="text"
              placeholder="Empresa, usuário, descrição ou ação"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div>
            <label>Ação</label>
            <select
              value={action}
              onChange={(event) => setAction(event.target.value)}
            >
              {actionOptions.map((item) => (
                <option key={item.value || "all"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Entidade</label>
            <select
              value={entity}
              onChange={(event) => setEntity(event.target.value)}
            >
              {entityOptions.map((item) => (
                <option key={item.value || "all"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Data inicial</label>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>

          <div>
            <label>Data final</label>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>

          <div className="audit-filter-actions">
            <button type="submit" disabled={loading}>
              Filtrar
            </button>

            <button type="button" onClick={clearFilters} disabled={loading}>
              Limpar
            </button>
          </div>
        </form>

        <section className="table-card audit-table-card">
          <div className="table-header-row">
            <div>
              <h2>Histórico de ações</h2>
              <p>
                {pagination.total} registro
                {pagination.total === 1 ? "" : "s"} encontrado
                {pagination.total === 1 ? "" : "s"}.
              </p>
            </div>
          </div>

          {logs.length === 0 ? (
            <p className="empty-message">
              {loading
                ? "Carregando logs..."
                : "Nenhum log encontrado com os filtros atuais."}
            </p>
          ) : (
            <div className="audit-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Ação</th>
                    <th>Empresa</th>
                    <th>Usuário</th>
                    <th>Entidade</th>
                    <th>Descrição</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatDateTime(log.createdAt)}</td>

                      <td>
                        <span className={getActionBadgeClass(log.action)}>
                          {translateAction(log.action)}
                        </span>
                      </td>

                      <td>
                        <strong>{log.company?.name || "-"}</strong>
                        <small>{log.company?.slug || ""}</small>
                      </td>

                      <td>
                        <strong>{log.user?.name || "-"}</strong>
                        <small>{log.user?.email || ""}</small>
                      </td>

                      <td>{translateEntity(log.entity)}</td>

                      <td className="audit-description-cell">
                        {log.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="audit-pagination">
            <button
              type="button"
              onClick={goToPreviousPage}
              disabled={loading || pagination.page <= 1}
            >
              Anterior
            </button>

            <span>
              Página {pagination.page} de {pagination.totalPages || 1}
            </span>

            <button
              type="button"
              onClick={goToNextPage}
              disabled={loading || pagination.page >= pagination.totalPages}
            >
              Próxima
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}