import { useEffect, useState } from "react";
import api from "../api/api";
import Sidebar from "../components/Sidebar";

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [message, setMessage] = useState("");
  const [editingServiceId, setEditingServiceId] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    duration: 30,
    price: "",
  });

  function resetForm() {
    setForm({
      name: "",
      description: "",
      duration: 30,
      price: "",
    });

    setEditingServiceId("");
  }

  function translateStatus(status) {
    const statusMap = {
      active: "Ativo",
      inactive: "Inativo",
    };

    return statusMap[status] || status;
  }

  function getStatusClass(status) {
    const statusClassMap = {
      active: "status-badge active",
      inactive: "status-badge blocked",
    };

    return statusClassMap[status] || "status-badge";
  }

  function formatPrice(price) {
    if (price === null || price === undefined || price === "") {
      return "—";
    }

    return Number(price).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  async function loadServices() {
    try {
      setMessage("");

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

    try {
      setLoading(true);
      setMessage("");

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        duration: Number(form.duration),
        price: form.price !== "" ? Number(form.price) : null,
      };

      if (!payload.name) {
        setMessage("Informe o nome do serviço.");
        return;
      }

      if (!payload.duration || payload.duration <= 0) {
        setMessage("A duração precisa ser maior que zero.");
        return;
      }

      if (editingServiceId) {
        await api.put(`/services/${editingServiceId}`, payload);

        setMessage("Serviço atualizado com sucesso.");
      } else {
        await api.post("/services", payload);

        setMessage("Serviço cadastrado com sucesso.");
      }

      resetForm();
      await loadServices();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Erro ao salvar serviço. Verifique se o usuário está vinculado a uma empresa."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(service) {
    setEditingServiceId(service.id);

    setForm({
      name: service.name || "",
      description: service.description || "",
      duration: service.duration || 30,
      price:
        service.price !== null && service.price !== undefined
          ? String(service.price)
          : "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function updateServiceStatus(serviceId, status) {
    try {
      setUpdatingId(serviceId);
      setMessage("");

      await api.patch(`/services/${serviceId}/status`, {
        status,
      });

      setMessage(
        status === "active"
          ? "Serviço ativado com sucesso."
          : "Serviço inativado com sucesso."
      );

      await loadServices();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message || "Erro ao atualizar status do serviço."
      );
    } finally {
      setUpdatingId("");
    }
  }

  async function handleDelete(serviceId) {
    const confirmed = window.confirm(
      "Deseja realmente excluir este serviço? Se ele possuir agendamentos vinculados, será apenas inativado."
    );

    if (!confirmed) return;

    try {
      setUpdatingId(serviceId);
      setMessage("");

      const response = await api.delete(`/services/${serviceId}`);

      setMessage(response.data?.message || "Serviço removido com sucesso.");

      await loadServices();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message || "Erro ao excluir serviço."
      );
    } finally {
      setUpdatingId("");
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
        <p>Cadastre, edite e gerencie os serviços disponíveis para agendamento.</p>

        {message && <div className="alert-message">{message}</div>}

        <form className="form-card" onSubmit={handleSubmit}>
          <h2>{editingServiceId ? "Editar serviço" : "Novo serviço"}</h2>

          <div>
            <label>Nome do serviço</label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              placeholder="Ex: Corte masculino"
              required
            />
          </div>

          <div>
            <label>Descrição</label>
            <input
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
              placeholder="Ex: Corte simples masculino"
            />
          </div>

          <div>
            <label>Duração em minutos</label>
            <input
              type="number"
              min="1"
              value={form.duration}
              onChange={(e) =>
                setForm({
                  ...form,
                  duration: e.target.value,
                })
              }
              required
            />
          </div>

          <div>
            <label>Preço</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) =>
                setForm({
                  ...form,
                  price: e.target.value,
                })
              }
              placeholder="Ex: 35"
            />
          </div>

          <div className="form-actions-row">
            <button type="submit" disabled={loading}>
              {loading
                ? "Salvando..."
                : editingServiceId
                ? "Salvar alterações"
                : "Cadastrar serviço"}
            </button>

            {editingServiceId && (
              <button
                type="button"
                className="secondary-action-button"
                onClick={resetForm}
                disabled={loading}
              >
                Cancelar edição
              </button>
            )}
          </div>
        </form>

        <div className="table-card">
          <div className="table-header-row">
            <div>
              <h2>Serviços cadastrados</h2>
              <p>Gerencie os serviços usados no painel e no link público.</p>
            </div>

            <button
              type="button"
              className="secondary-action-button"
              onClick={loadServices}
            >
              Atualizar
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Duração</th>
                <th>Preço</th>
                <th>Status</th>
                <th>Agendamentos</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td colSpan="7">Nenhum serviço cadastrado.</td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id}>
                    <td>{service.name}</td>

                    <td>{service.description || "—"}</td>

                    <td>{service.duration} min</td>

                    <td>{formatPrice(service.price)}</td>

                    <td>
                      <span className={getStatusClass(service.status)}>
                        {translateStatus(service.status)}
                      </span>
                    </td>

                    <td>{service._count?.appointments || 0}</td>

                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          onClick={() => handleEdit(service)}
                          disabled={updatingId === service.id}
                        >
                          Editar
                        </button>

                        {service.status === "active" ? (
                          <button
                            type="button"
                            className="danger-button"
                            onClick={() =>
                              updateServiceStatus(service.id, "inactive")
                            }
                            disabled={updatingId === service.id}
                          >
                            Inativar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              updateServiceStatus(service.id, "active")
                            }
                            disabled={updatingId === service.id}
                          >
                            Ativar
                          </button>
                        )}

                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => handleDelete(service.id)}
                          disabled={updatingId === service.id}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
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