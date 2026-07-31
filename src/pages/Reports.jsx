import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/api";

function getCurrentMonthStart() {
  const date = new Date();
  date.setDate(1);
  return date.toISOString().slice(0, 10);
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function formatMoney(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(number);
}

function formatDate(value) {
  if (!value) return "-";

  const [year, month, day] = String(value).split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function translateStatus(status) {
  const labels = {
    pending: "Pendente",
    confirmed: "Confirmado",
    completed: "Concluído",
    cancelled: "Cancelado",
  };

  return labels[status] || status || "-";
}

export default function Reports() {
  const [user, setUser] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [startDate, setStartDate] = useState(getCurrentMonthStart());
  const [endDate, setEndDate] = useState(getToday());

  const [summary, setSummary] = useState(null);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [days, setDays] = useState([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const isSuperAdmin = user?.role === "super_admin";

  const selectedCompanyName = useMemo(() => {
    if (!companyId) return "Todas as empresas";

    const company = companies.find((item) => item.id === companyId);
    return company?.name || "Empresa selecionada";
  }, [companies, companyId]);

  async function loadCompanies() {
    try {
      const response = await api.get("/reports/companies");
      setCompanies(response.data || []);
    } catch (error) {
      console.error(error);
    }
  }

  function buildParams() {
    const params = {
      startDate,
      endDate,
    };

    if (companyId) {
      params.companyId = companyId;
    }

    return params;
  }

  async function loadReports() {
    try {
      setLoading(true);
      setMessage("");

      const params = buildParams();

      const [
        summaryResponse,
        servicesResponse,
        professionalsResponse,
        daysResponse,
      ] = await Promise.all([
        api.get("/reports/summary", { params }),
        api.get("/reports/services", { params }),
        api.get("/reports/professionals", { params }),
        api.get("/reports/appointments-by-day", { params }),
      ]);

      setSummary(summaryResponse.data || null);
      setServices(servicesResponse.data?.services || []);
      setProfessionals(professionalsResponse.data?.professionals || []);
      setDays(daysResponse.data?.days || []);
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.message || "Erro ao carregar relatórios."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    loadReports();
  }

  function clearFilters() {
    setCompanyId("");
    setStartDate(getCurrentMonthStart());
    setEndDate(getToday());

    setTimeout(() => {
      loadReports();
    }, 0);
  }

  useEffect(() => {
    const storedUser = localStorage.getItem("@lopex:user");

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      if (parsedUser.role === "super_admin") {
        loadCompanies();
      }
    }

    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reportSummary = summary?.summary || {};
  const adminSummary = summary?.admin || null;

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="reports-title-row">
          <div>
            <h1>Relatórios</h1>
            <p>
              Acompanhe desempenho, agendamentos, receita estimada e uso da
              plataforma.
            </p>
          </div>

          <button
            type="button"
            className="dashboard-refresh-button"
            onClick={loadReports}
            disabled={loading}
          >
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        {message && <div className="alert-message">{message}</div>}

        <form className="reports-filters-panel" onSubmit={handleSubmit}>
          {isSuperAdmin && (
            <div className="reports-company-filter">
              <label>Empresa</label>
              <select
                value={companyId}
                onChange={(event) => setCompanyId(event.target.value)}
              >
                <option value="">Todas as empresas</option>

                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} — {company.slug}
                  </option>
                ))}
              </select>
            </div>
          )}

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

          <div className="reports-filter-actions">
            <button type="submit" disabled={loading}>
              Filtrar
            </button>

            <button type="button" onClick={clearFilters} disabled={loading}>
              Limpar
            </button>
          </div>
        </form>

        <section className="reports-context-card">
          <div>
            <span>Período analisado</span>
            <strong>
              {formatDate(startDate)} até {formatDate(endDate)}
            </strong>
          </div>

          <div>
            <span>Empresa</span>
            <strong>{selectedCompanyName}</strong>
          </div>

          <div>
            <span>Receita estimada</span>
            <strong>{formatMoney(reportSummary.estimatedRevenue)}</strong>
          </div>
        </section>

        <section className="dashboard-cards reports-summary-cards">
          <div className="dashboard-card">
            <span>Agendamentos</span>
            <strong>{reportSummary.totalAppointments || 0}</strong>
            <small>Total no período</small>
          </div>

          <div className="dashboard-card">
            <span>Pendentes</span>
            <strong>{reportSummary.pendingAppointments || 0}</strong>
            <small>{translateStatus("pending")}</small>
          </div>

          <div className="dashboard-card">
            <span>Confirmados</span>
            <strong>{reportSummary.confirmedAppointments || 0}</strong>
            <small>{translateStatus("confirmed")}</small>
          </div>

          <div className="dashboard-card">
            <span>Concluídos</span>
            <strong>{reportSummary.completedAppointments || 0}</strong>
            <small>{translateStatus("completed")}</small>
          </div>

          <div className="dashboard-card">
            <span>Cancelados</span>
            <strong>{reportSummary.cancelledAppointments || 0}</strong>
            <small>{translateStatus("cancelled")}</small>
          </div>

          <div className="dashboard-card">
            <span>Novos clientes</span>
            <strong>{reportSummary.newClients || 0}</strong>
            <small>Cadastrados no período</small>
          </div>

          <div className="dashboard-card">
            <span>Serviços ativos</span>
            <strong>{reportSummary.activeServices || 0}</strong>
            <small>Disponíveis</small>
          </div>

          <div className="dashboard-card">
            <span>Profissionais ativos</span>
            <strong>{reportSummary.activeProfessionals || 0}</strong>
            <small>Disponíveis</small>
          </div>
        </section>

        {isSuperAdmin && adminSummary && (
          <section className="reports-admin-panel">
            <div className="reports-section-header">
              <div>
                <h2>Visão do Admin Master</h2>
                <p>Resumo geral da plataforma.</p>
              </div>
            </div>

            <div className="reports-admin-grid">
              <div>
                <span>Empresas</span>
                <strong>{adminSummary.totalCompanies || 0}</strong>
              </div>

              <div>
                <span>Ativas</span>
                <strong>{adminSummary.activeCompanies || 0}</strong>
              </div>

              <div>
                <span>Trial</span>
                <strong>{adminSummary.trialCompanies || 0}</strong>
              </div>

              <div>
                <span>Assinaturas ativas</span>
                <strong>{adminSummary.activeSubscriptions || 0}</strong>
              </div>

              <div>
                <span>Atrasadas</span>
                <strong>{adminSummary.overdueSubscriptions || 0}</strong>
              </div>

              <div>
                <span>Canceladas</span>
                <strong>{adminSummary.cancelledSubscriptions || 0}</strong>
              </div>
            </div>
          </section>
        )}

        <section className="reports-grid">
          <div className="table-card reports-table-card">
            <div className="reports-section-header">
              <div>
                <h2>Serviços mais agendados</h2>
                <p>Ranking por quantidade e receita estimada.</p>
              </div>
            </div>

            {services.length === 0 ? (
              <p className="empty-message">
                {loading
                  ? "Carregando serviços..."
                  : "Nenhum serviço encontrado no período."}
              </p>
            ) : (
              <div className="reports-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Serviço</th>
                      <th>Total</th>
                      <th>Concluídos</th>
                      <th>Cancelados</th>
                      <th>Receita</th>
                    </tr>
                  </thead>

                  <tbody>
                    {services.map((service) => (
                      <tr key={service.id}>
                        <td>
                          <strong>{service.name}</strong>
                        </td>
                        <td>{service.totalAppointments}</td>
                        <td>{service.completedAppointments}</td>
                        <td>{service.cancelledAppointments}</td>
                        <td>{formatMoney(service.estimatedRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="table-card reports-table-card">
            <div className="reports-section-header">
              <div>
                <h2>Profissionais</h2>
                <p>Ranking por atendimento e receita estimada.</p>
              </div>
            </div>

            {professionals.length === 0 ? (
              <p className="empty-message">
                {loading
                  ? "Carregando profissionais..."
                  : "Nenhum profissional encontrado no período."}
              </p>
            ) : (
              <div className="reports-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Profissional</th>
                      <th>Total</th>
                      <th>Concluídos</th>
                      <th>Cancelados</th>
                      <th>Receita</th>
                    </tr>
                  </thead>

                  <tbody>
                    {professionals.map((professional) => (
                      <tr key={professional.id}>
                        <td>
                          <strong>{professional.name}</strong>
                        </td>
                        <td>{professional.totalAppointments}</td>
                        <td>{professional.completedAppointments}</td>
                        <td>{professional.cancelledAppointments}</td>
                        <td>{formatMoney(professional.estimatedRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="table-card reports-table-card reports-day-card">
          <div className="reports-section-header">
            <div>
              <h2>Agendamentos por dia</h2>
              <p>Distribuição diária no período selecionado.</p>
            </div>
          </div>

          {days.length === 0 ? (
            <p className="empty-message">
              {loading
                ? "Carregando dias..."
                : "Nenhum agendamento encontrado no período."}
            </p>
          ) : (
            <div className="reports-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Total</th>
                    <th>Pendentes</th>
                    <th>Confirmados</th>
                    <th>Concluídos</th>
                    <th>Cancelados</th>
                  </tr>
                </thead>

                <tbody>
                  {days.map((day) => (
                    <tr key={day.date}>
                      <td>{formatDate(day.date)}</td>
                      <td>{day.totalAppointments}</td>
                      <td>{day.pendingAppointments}</td>
                      <td>{day.confirmedAppointments}</td>
                      <td>{day.completedAppointments}</td>
                      <td>{day.cancelledAppointments}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}