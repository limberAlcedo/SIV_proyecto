// ============================
// src/components/IncidentesKanban.jsx
// ============================
import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import IncidenteForm from "./IncidenteForm";

const API_URL = "http://127.0.0.1:8000/api/incidentes";
const USERS_API = "http://127.0.0.1:8000/api/users/";

const glassCard = {
  background: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 16,
  padding: "8px",
};

const PRIORITY_COLORS = { Alta: "#ef4444", Media: "#facc15", Baja: "#22c55e" };
const PRIORITY_BORDER = { Alta: 6, Media: 4, Baja: 2 };

export default function IncidentesKanban({ currentUser = { id: 1, username: "Juan", role: "supervisor", token: "" } }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editIncident, setEditIncident] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filter, setFilter] = useState({
    status: "",
    priority: "",
    fromDate: "",
    fromTime: "00:00",
    toDate: "",
    toTime: "23:59"
  });

  const getToken = () => currentUser.token || localStorage.getItem("token");

  // ---------- FETCH DATOS ----------
  const fetchIncidents = async () => {
    setLoading(true);
    const token = getToken();
    if (!token) {
      toast.error("❌ Usuario no autenticado");
      setLoading(false);
      return;
    }

    try {
      const [incRes, usersRes] = await Promise.all([
        fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(USERS_API, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (!incRes.ok) throw new Error("Error al cargar incidentes");
      const incData = await incRes.json();

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        const usersMap = new Map(usersData.map(u => [Number(u.id), u.username]));

        incData.forEach(inc => {
          const createdId = Number(inc.created_by_id || 0);
          const closedId = Number(inc.close_by_id || 0);
          inc.created_by_name = usersMap.get(createdId) || "Desconocido";
          inc.closed_by_name = usersMap.get(closedId) || "No cerrado";
        });
      }

      setIncidents(incData);
    } catch (err) {
      toast.error(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncidents(); }, []);

  // ---------- EDICIÓN ----------
  const handleEdit = incident => { setEditIncident(incident); setIsFormOpen(true); };
  const clearEdit = () => { setEditIncident(null); setIsFormOpen(false); };

  // ---------- INCIDENTES VISIBLES ----------
  const visibleIncidents = useMemo(() => incidents, [incidents]);

  // ---------- FUNCIÓN PARA FORMATEAR FECHA LOCAL ----------
  const formatDateTimeLocal = dtStr => {
    if (!dtStr) return "No disponible";
    const d = new Date(dtStr); // UTC → hora local
    return d.toLocaleString("es-CL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // ---------- FILTROS ----------
  const filtered = visibleIncidents.filter(i => {
    const createdAt = new Date(i.created_at);

    const from = filter.fromDate ? new Date(`${filter.fromDate}T${filter.fromTime}:00`) : null;
    const to = filter.toDate ? new Date(`${filter.toDate}T${filter.toTime}:59`) : null;

    const matchesStatus = !filter.status || i.status === filter.status;
    const matchesPriority = !filter.priority || i.priority === filter.priority;
    const matchesFrom = !from || createdAt >= from;
    const matchesTo = !to || createdAt <= to;

    return matchesStatus && matchesPriority && matchesFrom && matchesTo;
  });

  // ---------- RENDER ==========
  return (
    <div style={styles.page}>
      <ToastContainer autoClose={2500} />
      <h1 style={styles.title}>Panel de incidentes</h1>

      {/* PANEL DE FILTROS */}
      <motion.div
        style={{ ...glassCard, display:"flex", gap:"12px", flexWrap:"wrap", marginBottom:"16px", justifyContent:"center", alignItems:"center", padding:"16px" }}
        whileHover={{ boxShadow: "0 0 20px rgba(255,255,255,0.4)" }}
      >
        <motion.select style={styles.filterSelect} value={filter.status} onChange={e => setFilter(prev => ({ ...prev, status: e.target.value }))}>
          <option value="">Todos los estados</option>
          <option value="Activo">Activo</option>
          <option value="Cerrado">Cerrado</option>
        </motion.select>

        <motion.select style={styles.filterSelect} value={filter.priority} onChange={e => setFilter(prev => ({ ...prev, priority: e.target.value }))}>
          <option value="">Todas las prioridades</option>
          <option value="Alta">Alta</option>
          <option value="Media">Media</option>
          <option value="Baja">Baja</option>
        </motion.select>

        <motion.input type="date" style={styles.filterInput} value={filter.fromDate} onChange={e => setFilter(prev => ({ ...prev, fromDate: e.target.value }))} />
        <motion.input type="time" style={styles.filterInput} value={filter.fromTime} onChange={e => setFilter(prev => ({ ...prev, fromTime: e.target.value }))} />
        <motion.input type="date" style={styles.filterInput} value={filter.toDate} onChange={e => setFilter(prev => ({ ...prev, toDate: e.target.value }))} />
        <motion.input type="time" style={styles.filterInput} value={filter.toTime} onChange={e => setFilter(prev => ({ ...prev, toTime: e.target.value }))} />

        <motion.button style={styles.clearBtn} onClick={() => setFilter({ status: "", priority: "", fromDate: "", fromTime: "00:00", toDate: "", toTime: "23:59" })} whileHover={{ boxShadow: "0 0 12px #ef4444" }}>
          Limpiar
        </motion.button>

        <motion.button style={styles.createBtn} onClick={() => { setEditIncident(null); setIsFormOpen(true); }} whileHover={{ boxShadow: "0 0 12px #22c55e" }}>
          Crear Incidente
        </motion.button>
      </motion.div>

      {/* INCIDENTES */}
      {loading ? (
        <p style={styles.message}>⏳ Cargando incidentes...</p>
      ) : filtered.length === 0 ? (
        <p style={styles.message}>📭 No hay incidentes con esos filtros</p>
      ) : (
        <div style={styles.grid}>
          {filtered.map(i => <IncidentCard key={i.id} incident={i} formatDateTimeLocal={formatDateTimeLocal} onEdit={handleEdit} />)}
        </div>
      )}

      <IncidenteForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        editIncident={editIncident}
        clearEdit={clearEdit}
        refreshIncidents={fetchIncidents}
        currentUser={currentUser}
      />
    </div>
  );
}

// ---------- COMPONENTE INCIDENT CARD ----------
function IncidentCard({ incident, onEdit, formatDateTimeLocal }) {
  const statusColor = incident.status === "Activo" ? "#22c55e" : "#ef4444";
  const priorityColor = PRIORITY_COLORS[incident.priority] || "#ccc";
  const borderWidth = PRIORITY_BORDER[incident.priority] || 2;
  const canEdit = incident.status === "Activo";

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: `0 0 20px ${priorityColor}` }}
      style={{ ...styles.card, borderLeft: `${borderWidth}px solid ${statusColor}`, backgroundColor: priorityColor + "20" }}
    >
      <div style={styles.cardHeader}>
        <strong>{incident.type}</strong>
        <span style={{ ...styles.badge, background: statusColor, boxShadow: `0 0 8px ${statusColor}` }}>{incident.status}</span>
      </div>

      <div style={styles.meta}>🕒 Creado: {formatDateTimeLocal(incident.created_at)}</div>
      {incident.closed_at && <div style={styles.meta}>🔒 Cerrado: {formatDateTimeLocal(incident.closed_at)}</div>}

      <div style={styles.obs} title={incident.observacion || "Sin observaciones"}>
        {incident.observacion || "Sin observaciones"}
      </div>

      <div style={styles.users}>
        👤 Creado por: {incident.created_by_name || "Desconocido"} <br />
        🔒 Cerrado por: {incident.closed_by_name || "No cerrado"}
      </div>

      {canEdit && (
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 0 12px #facc15" }}
          style={styles.editBtn}
          onClick={() => onEdit(incident)}
        >
          ✏️ Editar
        </motion.button>
      )}
    </motion.div>
  );
}

// ---------- STYLES ===========
const styles = {
  page: { minHeight: "100vh", padding: "16px", background: "linear-gradient(135deg,#0f172a,#1a3776,#0a3098)", color: "#fff", fontFamily: "Inter, sans-serif" },
  title: { textAlign: "center", marginBottom: "16px", fontWeight: 800, fontSize: "2rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", justifyContent: "center", width: "100%", maxWidth: "1300px", margin: "0 auto" },
  card: { borderRadius: "12px", padding: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", justifyContent: "space-between", transition: "all 0.2s" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", fontSize: "1rem" },
  badge: { fontSize: ".8rem", padding: "5px 10px", borderRadius: "999px", fontWeight: 700, color: "#fff" },
  meta: { fontSize: ".85rem", opacity: 0.85, marginBottom: "6px" },
  obs: { fontSize: ".85rem", background: "rgba(255,255,255,.1)", padding: "10px", borderRadius: "6px", marginBottom: "12px", minHeight: "40px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  users: { fontSize: ".8rem", opacity: 0.9, marginBottom: "10px", lineHeight: 1.4 },
  editBtn: { marginTop: "8px", background: "#facc15", border: "none", borderRadius: "6px", padding: "8px 14px", cursor: "pointer", fontWeight: 600, color: "#000", transition: "all 0.2s", fontSize: ".8rem" },
  message: { textAlign: "center", fontSize: "1rem", padding: "16px 0", opacity: 0.85 },
  filterSelect: { padding: "12px 16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.12)", color: "#fff", fontWeight: 500, cursor: "pointer", transition: "all 0.3s", outline: "none" },
  filterInput: { padding: "12px 16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.12)", color: "#fff", fontWeight: 500, cursor: "pointer", transition: "all 0.3s", outline: "none" },
  clearBtn: { background: "#ef4444", border: "none", borderRadius: "10px", padding: "12px 18px", cursor: "pointer", color: "#fff", fontWeight: 600, transition: "all 0.3s", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" },
  createBtn: { background: "#22c55e", border: "none", borderRadius: "10px", padding: "12px 18px", cursor: "pointer", color: "#fff", fontWeight: 700, transition: "all 0.3s", boxShadow: "0 4px 12px rgba(0,0,0,0.25)" },
};
