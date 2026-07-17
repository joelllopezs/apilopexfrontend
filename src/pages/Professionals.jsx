import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/api";
export default function Professionals() {
 const [professionals, setProfessionals] = useState([]);
 const [name, setName] = useState("");
 const [email, setEmail] = useState("");
 const [phone, setPhone] = useState("");
 const [message, setMessage] = useState("");
 async function loadProfessionals() {
 const response = await api.get("/professionals");
 setProfessionals(response.data);
 }
 async function handleCreate(event) {
 event.preventDefault();
 try {
 await api.post("/professionals", { name, email, phone });
 setName(""); setEmail(""); setPhone("");
 setMessage("Profissional cadastrado com sucesso.");
 await loadProfessionals();
 } catch (error) {
 setMessage(error.response?.data?.message || "Erro ao cadastrar profissional.");
 }
 }
 useEffect(() => { loadProfessionals(); }, []);
 return (
 <div className="layout">
 <Sidebar />
 <main className="content">
 <h1>Profissionais</h1>
 <p style={{ color: "#b8b8c8" }}>Cadastre os profissionais da empresa.</p>
 <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 20, marginTop: 24 }}>
 <form className="card" onSubmit={handleCreate}>
 <h2>Novo profissional</h2>
 <div className="grid">
 <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" />
 <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" />
 <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone" />
 {message && <div style={{ color: "#d8ccff" }}>{message}</div>}
 <button className="button">Cadastrar profissional</button>
 </div>
 </form>
 <section className="card">
 <h2>Profissionais cadastrados</h2>
 <table className="table">
 <thead><tr><th>Nome</th><th>E-mail</th><th>Telefone</th><th>Status</th></tr></thead>
 <tbody>
 {professionals.map((item) => (
 <tr key={item.id}>
 <td>{item.name}</td><td>{item.email || "-"}</td><td>{item.phone || "-"}</td>
 <td><span className="badge">{item.status}</span></td>
 </tr>
 ))}
 </tbody>
 </table>
 </section>
 </div>
 </main>
 </div>
 );
}