import { useEffect, useState } from "react";
import api from "../api/api";
import Sidebar from "../components/Sidebar";

export default function Professionals() {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [message, setMessage] = useState("");
  const [editingProfessionalId, setEditingProfessionalId] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  function resetForm() {
    setForm({
      name: "",
      email: "",
      phone: "",
    });

    setEditingProfessionalId("");
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

  async function loadProfessionals() {
    try {
      setMessage("");

      const response = await api.get("/professionals");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.professionals || [];

      setProfessionals(data);
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message || "Erro ao carregar profissionais."
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
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
      };

      if (!payload.name) {
        setMessage("Informe o nome do profissional.");
        return;
      }

      if (editingProfessionalId) {
        await api.put(`/professionals/${editingProfessionalId}`, payload);

        setMessage("Profissional atualizado com sucesso.");
      } else {
        await api.post("/professionals", payload);

        setMessage("Profissional cadastrado com sucesso.");
      }

      resetForm();
      await loadProfessionals();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message || "Erro ao salvar profissional."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(professional) {
    setEditingProfessionalId(professional.id);

    setForm({
      name: professional.name || "",
      email: professional.email || "",
      phone: professional.phone || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function updateProfessionalStatus(professionalId, status) {
    try {
      setUpdatingId(professionalId);
      setMessage("");

      await api.patch(`/professionals/${professionalId}/status`, {
        status,
      });

      setMessage(
        status === "active"
          ? "Profissional ativado com sucesso."
          : "Profissional inativado com sucesso."
      );

      await loadProfessionals();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Erro ao atualizar status do profissional."
      );
    } finally {
      setUpdatingId("");
    }
  }

  async function handleDelete(professionalId) {
    const confirmed = window.confirm(
      "Deseja realmente excluir este profissional? Se ele possuir agendamentos vinculados, será apenas inativado."
    );

    if (!confirmed) return;

    try {
      setUpdatingId(professionalId);
      setMessage("");

      const response = await api.delete(`/professionals/${professionalId}`);

      setMessage(response.data?.message || "Profissional removido com sucesso.");

      await loadProfessionals();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message || "Erro ao excluir profissional."
      );
    } finally {
      setUpdatingId("");
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
        <p>
          Cadastre, edite e gerencie os profissionais que poderão receber
          agendamentos.
        </p>

        {message && <div className="alert-message">{message}</div>}

        <form className="form-card" onSubmit={handleSubmit}>
          <h2>
            {editingProfessionalId
              ? "Editar profissional"
              : "Novo profissional"}
          </h2>

          <div>
            <label>Nome do profissional</label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              placeholder="Ex: João Silva"
              required
            />
          </div>

          <div>
            <label>E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
              placeholder="Ex: joao@email.com"
            />
          </div>

          <div>
            <label>Telefone</label>
            <input
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value,
                })
              }
              placeholder="Ex: (14) 99999-9999"
            />
          </div>

          <div className="form-actions-row">
            <button type="submit" disabled={loading}>
              {loading
                ? "Salvando..."
                : editingProfessionalId
                ? "Salvar alterações"
                : "Cadastrar profissional"}
            </button>

            {editingProfessionalId && (
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
              <h2>Profissionais cadastrados</h2>
              <p>Gerencie os profissionais usados no painel e no link público.</p>
            </div>

            <button
              type="button"
              className="secondary-action-button"
              onClick={loadProfessionals}
            >
              Atualizar
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Status</th>
                <th>Agendamentos</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {professionals.length === 0 ? (
                <tr>
                  <td colSpan="6">Nenhum profissional cadastrado.</td>
                </tr>
              ) : (
                professionals.map((professional) => (
                  <tr key={professional.id}>
                    <td>{professional.name}</td>

                    <td>{professional.email || "—"}</td>

                    <td>{professional.phone || "—"}</td>

                    <td>
                      <span className={getStatusClass(professional.status)}>
                        {translateStatus(professional.status)}
                      </span>
                    </td>

                    <td>{professional._count?.appointments || 0}</td>

                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          onClick={() => handleEdit(professional)}
                          disabled={updatingId === professional.id}
                        >
                          Editar
                        </button>

                        {professional.status === "active" ? (
                          <button
                            type="button"
                            className="danger-button"
                            onClick={() =>
                              updateProfessionalStatus(
                                professional.id,
                                "inactive"
                              )
                            }
                            disabled={updatingId === professional.id}
                          >
                            Inativar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              updateProfessionalStatus(
                                professional.id,
                                "active"
                              )
                            }
                            disabled={updatingId === professional.id}
                          >
                            Ativar
                          </button>
                        )}

                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => handleDelete(professional.id)}
                          disabled={updatingId === professional.id}
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