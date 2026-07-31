import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import Sidebar from "../components/Sidebar";

const SERVICE_MODES = [
  {
    id: "local",
    label: "Atendimento em local físico",
  },
  {
    id: "home",
    label: "Atendimento em domicílio",
  },
  {
    id: "online",
    label: "Atendimento online",
  },
  {
    id: "whatsapp",
    label: "Combinar pelo WhatsApp",
  },
];

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
    document: "",
    documentType: "cpf",
    serviceMode: "whatsapp",
    zipCode: "",
    street: "",
    number: "",
    neighborhood: "",
    complement: "",
    city: "",
    state: "",
  });

  const publicLink = useMemo(() => {
    if (!form.slug) return "";

    return `${window.location.origin}/agendar/${form.slug}`;
  }, [form.slug]);

  function onlyNumbers(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function generateSlug(value) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  function formatCpf(value) {
    const numbers = onlyNumbers(value).slice(0, 11);

    if (numbers.length <= 3) return numbers;

    if (numbers.length <= 6) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    }

    if (numbers.length <= 9) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
        6
      )}`;
    }

    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
      6,
      9
    )}-${numbers.slice(9)}`;
  }

  function formatCnpj(value) {
    const numbers = onlyNumbers(value).slice(0, 14);

    if (numbers.length <= 2) return numbers;

    if (numbers.length <= 5) {
      return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    }

    if (numbers.length <= 8) {
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(
        5
      )}`;
    }

    if (numbers.length <= 12) {
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(
        5,
        8
      )}/${numbers.slice(8)}`;
    }

    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(
      5,
      8
    )}/${numbers.slice(8, 12)}-${numbers.slice(12)}`;
  }

  function formatDocument(value, documentType) {
    if (documentType === "cnpj") {
      return formatCnpj(value);
    }

    return formatCpf(value);
  }

  function formatCep(value) {
    const numbers = onlyNumbers(value).slice(0, 8);

    if (numbers.length <= 5) {
      return numbers;
    }

    return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
  }

  function getServiceModeLabel(serviceMode) {
    const item = SERVICE_MODES.find((mode) => mode.id === serviceMode);

    return item?.label || "Combinar pelo WhatsApp";
  }

  function getAddressText() {
    if (form.serviceMode !== "local") {
      return getServiceModeLabel(form.serviceMode);
    }

    const parts = [
      form.street,
      form.number,
      form.neighborhood,
      form.city,
      form.state,
    ].filter(Boolean);

    if (parts.length === 0) {
      return "Endereço não informado";
    }

    return parts.join(" - ");
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

  function validateForm() {
    if (!form.name.trim()) {
      return "Informe o nome da empresa.";
    }

    const slugError = validateSlug(generateSlug(form.slug));

    if (slugError) {
      return slugError;
    }

    const documentNumbers = onlyNumbers(form.document);

    if (!documentNumbers) {
      return "Informe o CPF do responsável.";
    }

    if (form.documentType === "cpf" && documentNumbers.length !== 11) {
      return "Informe um CPF válido com 11 dígitos.";
    }

    if (form.documentType === "cnpj" && documentNumbers.length !== 14) {
      return "Informe um CNPJ válido com 14 dígitos.";
    }

    if (!form.serviceMode) {
      return "Informe o tipo de atendimento.";
    }

    if (!form.city.trim()) {
      return "Informe a cidade.";
    }

    if (!form.state.trim()) {
      return "Informe o estado.";
    }

    if (form.state.trim().length !== 2) {
      return "Informe o estado com 2 letras. Exemplo: SP.";
    }

    if (form.serviceMode === "local") {
      if (!form.zipCode.trim()) {
        return "Informe o CEP para atendimento em local físico.";
      }

      if (!form.street.trim()) {
        return "Informe a rua para atendimento em local físico.";
      }

      if (!form.number.trim()) {
        return "Informe o número para atendimento em local físico.";
      }

      if (!form.neighborhood.trim()) {
        return "Informe o bairro para atendimento em local físico.";
      }
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

  function handleDocumentTypeChange(documentType) {
    setForm((prev) => ({
      ...prev,
      documentType,
      document: "",
    }));
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
        document: formatDocument(company.document || "", company.documentType || "cpf"),
        documentType: company.documentType || "cpf",
        serviceMode: company.serviceMode || "whatsapp",
        zipCode: company.zipCode || "",
        street: company.street || "",
        number: company.number || "",
        neighborhood: company.neighborhood || "",
        complement: company.complement || "",
        city: company.city || "",
        state: company.state || "",
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

      const validationError = validateForm();

      if (validationError) {
        setMessage(validationError);
        return;
      }

      const payload = {
        name: form.name.trim(),
        slug: generateSlug(form.slug),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        logoUrl: form.logoUrl.trim() || null,
        primaryColor: form.primaryColor || "#885AFE",
        document: onlyNumbers(form.document),
        documentType: form.documentType,
        serviceMode: form.serviceMode,
        zipCode: form.zipCode.trim() || null,
        street: form.street.trim() || null,
        number: form.number.trim() || null,
        neighborhood: form.neighborhood.trim() || null,
        complement: form.complement.trim() || null,
        city: form.city.trim(),
        state: form.state.trim().toUpperCase(),
      };

      const response = await api.put("/companies/me", payload);

      const updatedCompany = response.data.company || response.data;

      setForm({
        name: updatedCompany.name || "",
        slug: updatedCompany.slug || "",
        email: updatedCompany.email || "",
        phone: updatedCompany.phone || "",
        logoUrl: updatedCompany.logoUrl || "",
        primaryColor: updatedCompany.primaryColor || "#885AFE",
        document: formatDocument(
          updatedCompany.document || "",
          updatedCompany.documentType || "cpf"
        ),
        documentType: updatedCompany.documentType || "cpf",
        serviceMode: updatedCompany.serviceMode || "whatsapp",
        zipCode: updatedCompany.zipCode || "",
        street: updatedCompany.street || "",
        number: updatedCompany.number || "",
        neighborhood: updatedCompany.neighborhood || "",
        complement: updatedCompany.complement || "",
        city: updatedCompany.city || "",
        state: updatedCompany.state || "",
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
              <label>Tipo de documento</label>
              <select
                value={form.documentType}
                onChange={(e) => handleDocumentTypeChange(e.target.value)}
              >
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
              </select>
            </div>

            <div>
              <label>{form.documentType === "cnpj" ? "CNPJ" : "CPF"} do responsável</label>
              <input
                value={form.document}
                onChange={(e) =>
                  setForm({
                    ...form,
                    document: formatDocument(e.target.value, form.documentType),
                  })
                }
                placeholder={
                  form.documentType === "cnpj"
                    ? "Ex: 12.345.678/0001-99"
                    : "Ex: 123.456.789-00"
                }
                required
              />
            </div>

            <div>
              <label>Tipo de atendimento</label>
              <select
                value={form.serviceMode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    serviceMode: e.target.value,
                  })
                }
                required
              >
                {SERVICE_MODES.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </div>

            <h2>Localização</h2>

            <div>
              <label>Cidade</label>
              <input
                value={form.city}
                onChange={(e) =>
                  setForm({
                    ...form,
                    city: e.target.value,
                  })
                }
                placeholder="Ex: Marília"
                required
              />
            </div>

            <div>
              <label>Estado</label>
              <input
                value={form.state}
                onChange={(e) =>
                  setForm({
                    ...form,
                    state: e.target.value.toUpperCase().slice(0, 2),
                  })
                }
                placeholder="Ex: SP"
                maxLength={2}
                required
              />
            </div>

            {form.serviceMode === "local" && (
              <>
                <div>
                  <label>CEP</label>
                  <input
                    value={form.zipCode}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        zipCode: formatCep(e.target.value),
                      })
                    }
                    placeholder="Ex: 17500-000"
                    required
                  />
                </div>

                <div>
                  <label>Rua</label>
                  <input
                    value={form.street}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        street: e.target.value,
                      })
                    }
                    placeholder="Ex: Rua São Luiz"
                    required
                  />
                </div>

                <div>
                  <label>Número</label>
                  <input
                    value={form.number}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        number: e.target.value,
                      })
                    }
                    placeholder="Ex: 123"
                    required
                  />
                </div>

                <div>
                  <label>Bairro</label>
                  <input
                    value={form.neighborhood}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        neighborhood: e.target.value,
                      })
                    }
                    placeholder="Ex: Centro"
                    required
                  />
                </div>

                <div>
                  <label>Complemento</label>
                  <input
                    value={form.complement}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        complement: e.target.value,
                      })
                    }
                    placeholder="Ex: Sala 2"
                  />
                </div>
              </>
            )}

            {form.serviceMode !== "local" && (
              <small className="field-help">
                Para este tipo de atendimento, apenas cidade e estado são
                obrigatórios.
              </small>
            )}

            <h2>Identidade visual</h2>

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
            <p>{getAddressText()}</p>

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