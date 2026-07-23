import { useEffect, useState } from "react";
import api from "../api/api";
import Sidebar from "../components/Sidebar";

export default function Company() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    logoUrl: "",
    primaryColor: "#885AFE",
  });

  function generateSlug(value) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  function applyCompanyIdentity(company) {
    const primaryColor = company?.primaryColor || "#885AFE";

    localStorage.setItem("@lopex:company", JSON.stringify(company));

    document.documentElement.style.setProperty(
      "--primary-color",
      primaryColor
    );

    window.dispatchEvent(new Event("company-updated"));
  }

  function handleNameChange(e) {
    const name = e.target.value;

    setForm((prev) => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }));
  }

  async function loadCompany() {
    try {
      setMessage("");

      const response = await api.get("/companies/me");
      const company = response.data;

      setForm({
        name: company.name || "",
        slug: company.slug || "",
        email: company.email || "",
        phone: company.phone || "",
        logoUrl: company.logoUrl || "",
        primaryColor: company.primaryColor || "#885AFE",
      });

      applyCompanyIdentity(company);
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message || "Erro ao carregar dados da empresa."
      );
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const response = await api.put("/companies/me", {
        name: form.name,
        slug: form.slug,
        email: form.email || null,
        phone: form.phone || null,
        logoUrl: form.logoUrl || null,
        primaryColor: form.primaryColor || "#885AFE",
      });

      const updatedCompany = response.data.company;

      setForm({
        name: updatedCompany.name || "",
        slug: updatedCompany.slug || "",
        email: updatedCompany.email || "",
        phone: updatedCompany.phone || "",
        logoUrl: updatedCompany.logoUrl || "",
        primaryColor: updatedCompany.primaryColor || "#885AFE",
      });

      applyCompanyIdentity(updatedCompany);

      setMessage("Identidade da empresa atualizada com sucesso.");
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Erro ao atualizar identidade da empresa."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompany();
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <h1>Empresa</h1>
        <p>Personalize os dados, logo e cor principal da sua empresa.</p>

        {message && <div className="alert-message">{message}</div>}

        <div className="company-grid">
          <form className="form-card" onSubmit={handleSubmit}>
            <div>
              <label>Nome da empresa</label>
              <input
                value={form.name}
                onChange={handleNameChange}
                placeholder="Ex: Barbearia do Kleber"
                required
              />
            </div>

            <div>
              <label>Slug da empresa</label>
              <input
                value={form.slug}
                onChange={(e) =>
                  setForm({
                    ...form,
                    slug: generateSlug(e.target.value),
                  })
                }
                placeholder="Ex: barbearia-do-kleber"
                required
              />
            </div>

            <div>
              <label>E-mail da empresa</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                placeholder="Ex: contato@empresa.com"
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

            <div>
              <label>URL da logo</label>
              <input
                value={form.logoUrl}
                onChange={(e) =>
                  setForm({
                    ...form,
                    logoUrl: e.target.value,
                  })
                }
                placeholder="https://site.com/logo.png"
              />
            </div>

            <div>
              <label>Cor principal</label>
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) =>
                  setForm({
                    ...form,
                    primaryColor: e.target.value,
                  })
                }
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar identidade"}
            </button>
          </form>

          <div className="company-preview-card">
            <span>Pré-visualização</span>

            <div
              className="company-preview-logo"
              style={{ borderColor: form.primaryColor }}
            >
              {form.logoUrl ? (
                <img src={form.logoUrl} alt={form.name || "Logo da empresa"} />
              ) : (
                <strong style={{ color: form.primaryColor }}>
                  {form.name ? form.name.slice(0, 2).toUpperCase() : "LX"}
                </strong>
              )}
            </div>

            <h2>{form.name || "Nome da empresa"}</h2>
            <p>{form.email || "email@empresa.com"}</p>
            <p>{form.phone || "(00) 00000-0000"}</p>

            <button
              type="button"
              style={{
                background: form.primaryColor,
              }}
            >
              Botão exemplo
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}