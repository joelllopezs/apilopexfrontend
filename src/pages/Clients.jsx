import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/api";
export default function Clients() {
 const [clients, setClients] = useState([]);
 const [name, setName] = useState("");
 const [email, setEmail] = useState("");
 const [phone, setPhone] = useState("");
 const [message, setMessage] = useState("");
 async function loadClients() {
 const response = await api.get("/clients");
 setClients(response.data);
 }
 async function handleCreate(event) {
 event.preventDefault();
 try {
 await api.post("/clients", { name, email, phone });
 setName(""); setEmail(""); setPhone("");
 setMessage("Cliente cadastrado com sucesso.");
 await loadClients();
 } catch (error) {
 setMessage(error.response?.data?.message || "Erro ao cadastrar cliente.");
 }
 }
 useEffect(() => { loadClients(); }, []);
 return (
 <div className="layout">
 <Sidebar />
 <main className="content">
 <h1>Clientes</h1>
 <p style={{ color: "#b8b8c8" }}>Cadastre os clientes que podem ser agendados.</p>
 <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 20, marginTop: 24 }}>
 <form className="card" onSubmit={handleCreate}>
 <h2>Novo cliente</h2>
 <div className="grid">
 <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" />
 <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" />
 <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone" />
 {message && <div style={{ color: "#d8ccff" }}>{message}</div>}
 <button className="button">Cadastrar cliente</button>
 </div>
 </form>
 <section className="card">
 <h2>Clientes cadastrados</h2>
 <table className="table">
 <thead><tr><th>Nome</th><th>E-mail</th><th>Telefone</th></tr></thead>
 <tbody>
 {clients.map((item) => (
 <tr key={item.id}>
 <td>{item.name}</td><td>{item.email || "-"}</td><td>{item.phone || "-"}</td>
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