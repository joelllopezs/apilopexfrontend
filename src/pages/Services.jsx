import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/api";
export default function Services() {
 const [services, setServices] = useState([]);
 const [name, setName] = useState("");
 const [description, setDescription] = useState("");
 const [duration, setDuration] = useState(30);
 const [price, setPrice] = useState(0);
 const [message, setMessage] = useState("");
 const [loading, setLoading] = useState(false);
 async function loadServices() {
 const response = await api.get("/services");
 setServices(response.data);
 }
 async function handleCreate(event) {
 event.preventDefault();
 try {
 setLoading(true);
 setMessage("");
 await api.post("/services", {
 name,
 description,
 duration: Number(duration),
 price: Number(price),
 });

 setName("");
 setDescription("");
 setDuration(30);
 setPrice(0);
 setMessage("Servico cadastrado com sucesso.");
 await loadServices();
 } catch (error) {
 setMessage(error.response?.data?.message || "Erro ao cadastrar servico.");
 } finally {
 setLoading(false);
 }
 }
 useEffect(() => {
 loadServices();
 }, []);
 return (
 <div className="layout">
 <Sidebar />
 <main className="content">
 <h1>Servicos</h1>
 <p style={{ color: "#b8b8c8" }}>Cadastre os servicos oferecidos pela empresa.</p>
 <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 20, marginTop: 24 }}>
 <form className="card" onSubmit={handleCreate}>
 <h2>Novo servico</h2>
 <div className="grid">
 <label>
 <span style={{ display: "block", marginBottom: 8 }}>Nome</span>
 <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Corte masculino" />
 </label>
 <label>
 <span style={{ display: "block", marginBottom: 8 }}>Descricao</span>
 <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Corte simples masculino" />
 </label>
 <label>
 <span style={{ display: "block", marginBottom: 8 }}>Duracao em minutos</span>
 <input className="input" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
 </label>
 <label>
 <span style={{ display: "block", marginBottom: 8 }}>Preco</span>
 <input className="input" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
 </label>
 {message && <div style={{ color: "#d8ccff" }}>{message}</div>}
 <button className="button" disabled={loading}>{loading ? "Salvando..." : "Cadastrar servico"}</button>
 </div>
 </form>
 <section className="card">
 <h2>Servicos cadastrados</h2>
 <table className="table">
 <thead>
 <tr><th>Nome</th><th>Duracao</th><th>Preco</th><th>Status</th></tr>
 </thead>
 <tbody>
 {services.map((service) => (
 <tr key={service.id}>
 <td>{service.name}</td>
 <td>{service.duration} min</td>
 <td>R$ {Number(service.price || 0).toFixed(2)}</td>
 <td><span className="badge">{service.status}</span></td>
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