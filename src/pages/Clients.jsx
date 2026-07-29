import { useEffect, useState } from "react";
import api from "../api/api";
import Sidebar from "../components/Sidebar";

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [message, setMessage] = useState("");
  const [editingClientId, setEditingClientId] = useState("");

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

    setEditingClientId("");
  }

  async function loadClients() {
    try {
      setMessage("");

      const response = await api.get("/clients");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.clients || [];

      setClients(data);
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message || "Erro ao carregar clientes."
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
        setMessage("Informe o nome do cliente.");
        return;
      }

      if (editingClientId) {
        await api.put(`/clients/${editingClientId}`, payload);

        setMessage("Cliente atualizado com sucesso.");
      } else {
        await api.post("/clients", payload);

        setMessage("Cliente cadastrado com sucesso.");
      }

      resetForm();
      await loadClients();
    } catch (error) {
      console.error(error);

      setMessage(error.response?.data?.message || "Erro ao salvar cliente.");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(client) {
    setEditingClientId(client.id);

    setForm({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDelete(clientId) {
    const confirmed = window.confirm(
      "Deseja realmente excluir este cliente? Se ele possuir agendamentos vinculados, a exclusão poderá ser bloqueada."
    );

    if (!confirmed) return;

    try {
      setUpdatingId(clientId);
      setMessage("");

      const response = await api.delete(`/clients/${clientId}`);

      setMessage(response.data?.message || "Cliente excluído com sucesso.");

      if (editingClientId === clientId) {
        resetForm();
      }

      await loadClients();
    } catch (error) {
      console.error(error);

      setMessage(error.response?.data?.message || "Erro ao excluir cliente.");
    } finally {
      setUpdatingId("");
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <h1>Clientes</h1>
        <p>Cadastre, edite e gerencie os clientes que poderão receber agendamentos.</p>

        {message && <div className="alert-message">{message}</div>}

        <form className="form-card" onSubmit={handleSubmit}>
          <h2>{editingClientId ? "Editar cliente" : "Novo cliente"}</h2>

          <div>
            <label>Nome do cliente</label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              placeholder="Ex: Carlos Cliente"
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
              placeholder="Ex: cliente@email.com"
            />
          </div>

          <div>
            <label>Telefone / WhatsApp</label>
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
                : editingClientId
                ? "Salvar alterações"
                : "Cadastrar cliente"}
            </button>

            {editingClientId && (
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
              <h2>Clientes cadastrados</h2>
              <p>Gerencie clientes cadastrados pelo painel e pelo link público.</p>
            </div>

            <button
              type="button"
              className="secondary-action-button"
              onClick={loadClients}
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
                <th>Agendamentos</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan="5">Nenhum cliente cadastrado.</td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id}>
                    <td>{client.name}</td>

                    <td>{client.email || "—"}</td>

                    <td>{client.phone || "—"}</td>

                    <td>{client._count?.appointments || 0}</td>

                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          onClick={() => handleEdit(client)}
                          disabled={updatingId === client.id}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => handleDelete(client.id)}
                          disabled={updatingId === client.id}
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