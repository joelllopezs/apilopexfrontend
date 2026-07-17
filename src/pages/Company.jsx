import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/api";
export default function Company() {
 const [user, setUser] = useState(null);
 const [form, setForm] = useState({
 name: "LopeX.IA",
 slug: "lopex-ia",
 email: "contato@lopex.ia",
 phone: "(14) 99999-9999",
 logoUrl: "/logo-lopex.png",
 primaryColor: "#885AFE",
 });
 const [message, setMessage] = useState("");
 async function loadMe() {
 const response = await api.get("/auth/me");
 setUser(response.data.user);
 }
 function updateField(field, value) {
 setForm((old) => ({ ...old, [field]: value }));
 }
 async function handleSetup(event) {
 event.preventDefault();
 try {
 const response = await api.post("/auth/setup-company", form);
 localStorage.setItem("@lopex:user", JSON.stringify(response.data.user));
 setMessage("Empresa criada e vinculada com sucesso. Faca login novamente se necessario.");
 await loadMe();
 } catch (error) {
 setMessage(error.response?.data?.message || "Erro ao configurar empresa.");
 }
 }
 useEffect(() => { loadMe(); }, []);
 return (
 <div className="layout">
 <Sidebar />
 <main className="content">
 <h1>Empresa</h1>
 <p style={{ color: "#b8b8c8" }}>Dados da empresa vinculada ao usuario logado.</p>
 {user?.company ? (
 <section className="card" style={{ marginTop: 24, maxWidth: 720 }}>
 <h2>{user.company.name}</h2>
 <p><strong>Slug:</strong> {user.company.slug}</p>
 <p><strong>E-mail:</strong> {user.company.email || "-"}</p>
 <p><strong>Telefone:</strong> {user.company.phone || "-"}</p>
 <p><strong>Cor principal:</strong> {user.company.primaryColor || "#885AFE"}</p>
 <span className="badge">{user.company.status}</span>
 </section>
 ) : (
 <form className="card" style={{ marginTop: 24, maxWidth: 520 }} onSubmit={handleSetup}>
 <h2>Configurar empresa</h2>
 <div className="grid">
 <input className="input" value={form.name} onChange={(e) => updateField("name", e.target.value)} />
 <input className="input" value={form.slug} onChange={(e) => updateField("slug", e.target.value)} />
 <input className="input" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
 <input className="input" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
 <input className="input" value={form.logoUrl} onChange={(e) => updateField("logoUrl", e.target.value)} />
 <input className="input" value={form.primaryColor} onChange={(e) => updateField("primaryColor", e.target.value)} />
 {message && <div style={{ color: "#d8ccff" }}>{message}</div>}
 <button className="button">Criar empresa</button>
 </div>
 </form>
 )}
 </main>
 </div>
 );
}