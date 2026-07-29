import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import Sidebar from "../components/Sidebar";

export default function Company() {
  const [loading, setLoading] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    logoUrl: "",
    primaryColor: "#885AFE",
  });

  const publicLink = useMemo(() => {
    if (!form.slug) return "";

    return `${window.location.origin}/agendar/${form.slug}`;
  }, [form.slug]);

  function generateSlug(value) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  function validateSlug(slug) {
    if (!slug) {
      return "Informe o slug da empresa.";
    }

    if (slug.length < 3) {
      return "O slug precisa ter pelo menos 3 caracteres.";
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return "O slug deve conter apenas letras minúsculas, números e hífen.";
    }

    return null;
  }

  function applyCompanyIdentity(company) {
    const primaryColor = company?.primaryColor || "#885AFE";

    localStorage.setItem("@lopex:company", JSON.stringify(company));

    document.documentElement.style.setProperty("--primary-color", primaryColor);

    window.dispatchEvent(new Event("company-updated"));
  }

  function handleNameChange(e) {
    const name = e.target.value;

    setForm((prev) => ({
      ...prev,
      name,
      slug: prev.slug ? prev.slug : generateSlug(name),
    }));
  }

  function handleColorChange(color) {
    setForm((prev) => ({
      ...prev,
      primaryColor: color,
    }));

    document.documentElement.style.setProperty("--primary-color", color);
  }

  function generateSlugFromName() {
    if (!form.name.trim()) {
      setMessage("Informe o nome da empresa para gerar o slug.");
      return;
    }

    setForm((prev) => ({
      ...prev,
      slug: generateSlug(prev.name),
    }));

    setMessage("Slug gerado com base no nome da empresa.");
  }

  async function loadCompany() {
    try {
      setLoadingCompany(true);
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
    } finally {
      setLoadingCompany(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const payload = {
        name: form.name.trim(),
        slug: generateSlug(form.slug),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        logoUrl: form.logoUrl.trim() || null,
        primaryColor: form.primaryColor || "#885AFE",
      };

      if (!payload.name) {
        setMessage("Informe o nome da empresa.");
        return;
      }

      const slugError = validateSlug(payload.slug);

      if (slugError) {
        setMessage(slugError);
        return;
      }

      const response = await api.put("/companies/me", payload);

      const updatedCompany = response.data.company || response.data;

      setForm({
        name: updatedCompany.name || "",
        slug: updatedCompany.slug || "",
        email: updatedCompany.email || "",
        phone: updatedCompany.phone || "",
        logoUrl: updatedCompany.logoUrl || "",
        primaryColor: updatedCompany.primaryColor || "#885AFE",
      });

      applyCompanyIdentity(updatedCompany);

      setMessage("Dados da empresa atualizados com sucesso.");
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Erro ao atualizar os dados da empresa."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyPublicLink() {
    if (!publicLink) {
      setMessage("Informe o slug da empresa antes de copiar o link.");
      return;
    }

    try {
      await navigator.clipboard.writeText(publicLink);
      setMessage("Link público copiado com sucesso.");
    } catch (error) {
      console.error(error);
      setMessage(publicLink);
    }
  }

  function openPublicLink() {
    if (!publicLink) {
      setMessage("Informe o slug da empresa antes de abrir o link.");
      return;
    }

    window.open(publicLink, "_blank", "noopener,noreferrer");
  }

  useEffect(() => {
    loadCompany();
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="company-title-row">
          <div>
            <h1>Empresa</h1>
            <p>
              Personalize os dados, identidade visual e link público de
              agendamento.
            </p>
          </div>

          <button
            type="button"
            className="dashboard-refresh-button"
            onClick={loadCompany}
            disabled={loadingCompany || loading}
          >
            {loadingCompany ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        {message && <div className="alert-message">{message}</div>}

        <div className="company-grid">
          <form className="form-card" onSubmit={handleSubmit}>
            <h2>Dados da empresa</h2>

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
              <label>Slug do link público</label>

              <div className="slug-input-row">
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

                <button
                  type="button"
                  className="secondary-action-button"
                  onClick={generateSlugFromName}
                >
                  Gerar
                </button>
              </div>

              <small className="field-help">
                Esse texto será usado no link público de agendamento.
              </small>
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
              <small className="field-help">
                Use uma imagem em PNG, JPG ou WebP hospedada online.
              </small>
            </div>

            <div>
              <label>Cor principal</label>

              <div className="color-input-row">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                />

                <input
                  value={form.primaryColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  placeholder="#885AFE"
                />
              </div>
            </div>

            <div className="form-actions-row">
              <button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar empresa"}
              </button>

              <button
                type="button"
                className="secondary-action-button"
                onClick={openPublicLink}
              >
                Abrir link público
              </button>
            </div>
          </form>

          <aside className="company-preview-card">
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

            <div className="public-link-box">
              <label>Link público de agendamento</label>

              <div className="public-link-value">
                {publicLink || "Configure o slug para gerar o link"}
              </div>

              <div className="public-link-actions">
                <button
                  type="button"
                  className="copy-link-button"
                  onClick={copyPublicLink}
                >
                  Copiar link
                </button>

                <button
                  type="button"
                  className="secondary-action-button"
                  onClick={openPublicLink}
                >
                  Abrir
                </button>
              </div>
            </div>

            {form.slug && (
              <p className="public-link-preview">/agendar/{form.slug}</p>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}