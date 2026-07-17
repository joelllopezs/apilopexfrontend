import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/api";
const dayNames = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"];
export default function BusinessHours() {
 const [hours, setHours] = useState([]);
 const [form, setForm] = useState({
 dayOfWeek: 1,
 isOpen: true,
 openTime: "08:00",
 closeTime: "18:00",
 breakStart: "12:00",
 breakEnd: "13:00",
 });
 const [message, setMessage] = useState("");
 async function loadHours() {
 const response = await api.get("/business-hours");
 setHours(response.data);
 }
 function updateField(field, value) {
 setForm((old) => ({ ...old, [field]: value }));
 }
 async function handleSave(event) {
 event.preventDefault();
 try {
 const payload = {
 ...form,
 dayOfWeek: Number(form.dayOfWeek),
 isOpen: Boolean(form.isOpen),
 };
 if (!payload.isOpen) {
 delete payload.openTime;
 delete payload.closeTime;
 delete payload.breakStart;
 delete payload.breakEnd;
 }
 await api.post("/business-hours", payload);
 setMessage("Horario salvo com sucesso.");
 await loadHours();
 } catch (error) {
 setMessage(error.response?.data?.message || "Erro ao salvar horario.");
 }
 }
 useEffect(() => { loadHours(); }, []);
 return (
 <div className="layout">
 <Sidebar />
 <main className="content">
 <h1>Horarios</h1>
 <p style={{ color: "#b8b8c8" }}>Configure abertura, fechamento e intervalo.</p>
 <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 20, marginTop: 24 }}>
 <form className="card" onSubmit={handleSave}>
 <h2>Configurar dia</h2>
 <div className="grid">
 <select className="input" value={form.dayOfWeek} onChange={(e) => updateField("dayOfWeek", e.target.value)}>
 {dayNames.map((name, index) => <option key={index} value={index}>{name}</option>)}
 </select>
 <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
 <input type="checkbox" checked={form.isOpen} onChange={(e) => updateField("isOpen", e.target.checked)} />
 Aberto neste dia
 </label>
 {form.isOpen && (
 <>
 <input className="input" type="time" value={form.openTime} onChange={(e) => updateField("openTime", e.target.value)} />
 <input className="input" type="time" value={form.closeTime} onChange={(e) => updateField("closeTime", e.target.value)} />
 <input className="input" type="time" value={form.breakStart} onChange={(e) => updateField("breakStart", e.target.value)} />
 <input className="input" type="time" value={form.breakEnd} onChange={(e) => updateField("breakEnd", e.target.value)} />
 </>
 )}
 {message && <div style={{ color: "#d8ccff" }}>{message}</div>}
 <button className="button">Salvar horario</button>
 </div>
 </form>
 <section className="card">
 <h2>Semana cadastrada</h2>
 <table className="table">
 <thead><tr><th>Dia</th><th>Status</th><th>Horario</th><th>Intervalo</th></tr></thead>
 <tbody>
 {hours.map((item) => (
 <tr key={item.id}>
 <td>{dayNames[item.dayOfWeek]}</td>
 <td><span className="badge">{item.isOpen ? "Aberto" : "Fechado"}</span></td>
 <td>{item.isOpen ? `${item.openTime} - ${item.closeTime}` : "-"}</td>
 <td>{item.breakStart && item.breakEnd ? `${item.breakStart} - ${item.breakEnd}` : "-"}</td>
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
