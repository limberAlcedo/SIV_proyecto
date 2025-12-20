import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

// ==================== CONSTANTES ====================
const API_URL = "http://127.0.0.1:8000/api/incidentes";
const USERS_API = "http://127.0.0.1:8000/api/users/";

const INCIDENT_TYPES = ["Robo", "Accidente", "Intrusión", "Falla técnica"];
const PRIORITIES = ["Alta", "Media", "Baja"];
const CAMERAS = ["C1", "C2", "C3"];
const SECTORS = ["Interior", "Exterior"];
const PISTAS = ["Pista 1", "Pista 2", "Pista 3"];
const SEÑALIZACIONES = ["Señal A", "Señal B", "Señal C"];
const TRABAJOS_VIA = ["Obra A", "Obra B", "Obra C"];

const glassCard = {
  background: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 16,
  padding: "8px",
};

const emptyForm = () => ({
  type: "",
  priority: "",
  camera: "",
  sector: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  observacion: "",
  pista: [],
  ubicacion_via: "",
  senalizacion: "",
  trabajos_via: [],
  status: "Activo",
});

// ==================== COMPONENTE PRINCIPAL ====================
export default function IncidentesKanban({ currentUser = { id: 1, username: "Juan", role: "supervisor", token: "" } }) {
  const [incidents, setIncidents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editIncident, setEditIncident] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filter, setFilter] = useState({ status: "", priority: "", from: "", to: "" });

  // ---------- FETCH INCIDENTES Y USUARIOS ----------
  const fetchIncidents = async () => {
    setLoading(true);
    const token = localStorage.getItem("token") || currentUser.token;
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
      setIncidents(await incRes.json());

      if (usersRes.ok) {
        setUsers(await usersRes.json());
      } else if (usersRes.status === 403) {
        setUsers([]);
      } else {
        throw new Error("Error al cargar usuarios");
      }

    } catch (err) {
      console.error("Error al cargar datos:", err);
      toast.error(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncidents(); }, []);

  // ---------- EDICIÓN Y CIERRE ----------
  const handleEdit = (incident) => { setEditIncident(incident); setIsFormOpen(true); };
  const handleCloseIncident = async (incident) => {
    const token = localStorage.getItem("token") || currentUser.token;
    if (!token) { toast.error("❌ Usuario no autenticado"); return; }

    try {
      const res = await fetch(`${API_URL}/cerrar/${incident.id}/?cerrado_por_id=${currentUser.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("No se pudo cerrar el incidente");
      toast.success("✅ Incidente cerrado");
      fetchIncidents();
    } catch (err) {
      console.error("Error al cerrar incidente:", err);
      toast.error(`❌ ${err.message}`);
    }
  };

  const clearEdit = () => { setEditIncident(null); setIsFormOpen(false); };

  // ---------- FILTROS ----------
  const visibleIncidents = useMemo(() => {
    if (["supervisor", "administrador"].includes(currentUser.role)) return incidents;
    return incidents.filter(
      i => i.status === "Activo" || (i.status === "Cerrado" && i.cerrado_por_id === currentUser.id)
    );
  }, [incidents, currentUser]);

  const filtered = visibleIncidents.filter(i => {
    const createdAt = new Date(i.created_at);
    const from = filter.from ? new Date(filter.from) : null;
    const to = filter.to ? new Date(filter.to) : null;

    const matchesStatus = !filter.status || i.status === filter.status;
    const matchesPriority = !filter.priority || i.priority === filter.priority;
    const matchesFrom = !from || createdAt >= from;
    const matchesTo = !to || createdAt <= to;

    return matchesStatus && matchesPriority && matchesFrom && matchesTo;
  });

  const usersMap = useMemo(() => {
    const map = new Map();
    users.forEach(u => map.set(u.id, u.username));
    return map;
  }, [users]);

  // ---------- RENDER ===========
  return (
    <div style={styles.page}>
      <ToastContainer autoClose={2500} />
      <motion.h1 style={styles.title}>🚨 Incidentes</motion.h1>

      <div style={styles.controls}>
        <button style={styles.primaryBtn} onClick={() => { setEditIncident(null); setIsFormOpen(true); }}>➕ Crear incidente</button>
        <button style={styles.secondaryBtn} onClick={() => setShowFilters(!showFilters)}>🔍 Filtrar</button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div style={{ ...glassCard, display:"flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px", justifyContent:"center", alignItems:"center" }}>
              
              {/* Estado */}
              <div style={styles.filterGroup}>
                <span style={styles.filterLabel}>Estado:</span>
                {["Activo", "Cerrado"].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilter({ ...filter, status: filter.status === status ? "" : status })}
                    style={{ ...styles.filterBadge, background: filter.status === status ? "#22c55e" : "rgba(255,255,255,0.1)", color: filter.status === status ? "#fff" : "#ccc" }}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Prioridad */}
              <div style={styles.filterGroup}>
                <span style={styles.filterLabel}>Prioridad:</span>
                {["Alta", "Media", "Baja"].map(priority => (
                  <button
                    key={priority}
                    onClick={() => setFilter({ ...filter, priority: filter.priority === priority ? "" : priority })}
                    style={{ ...styles.filterBadge, background: filter.priority === priority ? "#f59e0b" : "rgba(255,255,255,0.1)", color: filter.priority === priority ? "#fff" : "#ccc" }}
                  >
                    {priority}
                  </button>
                ))}
              </div>

              {/* Fechas */}
              <div style={styles.filterGroup}>
                <span style={styles.filterLabel}>Fecha:</span>
                <input type="date" value={filter.from || ""} onChange={(e) => setFilter({ ...filter, from: e.target.value })} style={styles.dateInput} />
                <span style={{ margin: "0 4px" }}>→</span>
                <input type="date" value={filter.to || ""} onChange={(e) => setFilter({ ...filter, to: e.target.value })} style={styles.dateInput} />
              </div>

              <button onClick={() => setFilter({ status: "", priority: "", from: "", to: "" })} style={{ ...styles.filterBadge, background: "#64748b", color: "#fff" }}>Limpiar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <p style={styles.message}>⏳ Cargando incidentes...</p>
      ) : filtered.length === 0 ? (
        <p style={styles.message}>📭 No hay incidentes con esos filtros</p>
      ) : (
        <div style={styles.grid}>
          {filtered.map(i => (
            <IncidentCard key={i.id} incident={i} usersMap={usersMap} currentUser={currentUser} onEdit={handleEdit} onClose={handleCloseIncident} />
          ))}
        </div>
      )}

      {isFormOpen && (
        <IncidenteForm
          currentUser={currentUser}
          editIncident={editIncident}
          setIsOpen={setIsFormOpen}
          isOpen={isFormOpen}
          clearEdit={clearEdit}
          refreshIncidents={fetchIncidents}
        />
      )}
    </div>
  );
}

// ---------- COMPONENTE INCIDENT CARD ----------
function IncidentCard({ incident, usersMap, currentUser, onEdit, onClose }) {
  const borderColor = incident.status === "Activo" ? "#22c55e" : "#ef4444";
  const badgeColor = incident.status === "Activo" ? "#22c55e" : "#ef4444";

  const canEdit = incident.status === "Activo";
  const canClose = incident.status === "Activo";

  return (
    <motion.div whileHover={{ y: -4, boxShadow: "0 8px 16px rgba(0,0,0,0.3)" }} style={{ ...styles.card, borderLeft: `6px solid ${borderColor}` }}>
      <div style={styles.cardHeader}>
        <strong>{incident.type}</strong>
        <span style={{ ...styles.badge, background: badgeColor, boxShadow: `0 0 8px ${badgeColor}` }}>{incident.status}</span>
      </div>
      <div style={styles.meta}>🕒 {new Date(incident.created_at).toLocaleTimeString()} · 📅 {new Date(incident.created_at).toLocaleDateString()}</div>
      <div style={styles.obs}>{incident.observacion || "Sin observaciones"}</div>
      <div style={styles.users}>👤 Creado por: {usersMap.get(incident.created_by_id) || "Desconocido"} <br /> 🔒 Cerrado por: {incident.cerrado_por_id ? (usersMap.get(incident.cerrado_por_id) || "Desconocido") : "-"}</div>
      <div style={styles.actions}>
        {canEdit && <motion.button whileHover={{ scale: 1.05 }} style={styles.editBtn} onClick={() => onEdit(incident)}>✏️ Editar</motion.button>}
        {canClose && <motion.button whileHover={{ scale: 1.05 }} style={styles.closeBtn} onClick={() => onClose(incident)}>🔒 Cerrar</motion.button>}
      </div>
    </motion.div>
  );
}

// ---------- STYLES ----------
const styles = {
  page: { minHeight: "100vh", padding: "16px", background: "linear-gradient(135deg, #0f172a, #1a3776, #0a3098)", color: "#fff", fontFamily: "Inter, sans-serif" },
  title: { textAlign: "center", marginBottom: "16px", fontWeight: 800, fontSize: "1.8rem" },
  controls: { display: "flex", justifyContent: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" },
  primaryBtn: { background: "#22c55e", border: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", color: "#fff" },
  secondaryBtn: { background: "#334155", border: "none", padding: "8px 14px", borderRadius: "8px", color: "#fff", cursor: "pointer", transition: "all 0.2s" },
  filterGroup: { display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "0" },
  filterLabel: { fontWeight: 600, marginRight: "4px" },
  filterBadge: { padding: "4px 10px", borderRadius: "999px", border: "none", cursor: "pointer", fontWeight: 600, transition: "all 0.2s", fontSize: ".8rem" },
  dateInput: { padding: "4px 6px", borderRadius: "6px", border: "none", fontSize: ".75rem", cursor: "pointer", background: "rgba(255,255,255,0.1)", color: "#fff", width: "110px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "12px" },
  card: { background: "rgba(255,255,255,0.07)", borderRadius: "12px", padding: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", justifyContent: "space-between", transition: "all 0.2s" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", fontSize: ".9rem" },
  badge: { fontSize: ".7rem", padding: "4px 8px", borderRadius: "999px", fontWeight: 700, color: "#fff" },
  meta: { fontSize: ".7rem", opacity: 0.8, marginBottom: "6px" },
  obs: { fontSize: ".8rem", background: "rgba(255,255,255,.1)", padding: "8px", borderRadius: "6px", marginBottom: "10px", minHeight: "40px" },
  users: { fontSize: ".7rem", opacity: 0.85, marginBottom: "8px" },
  actions: { display: "flex", justifyContent: "space-between", gap: "6px" },
  editBtn: { background: "#facc15", border: "none", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", fontWeight: 600, color: "#000", transition: "all 0.2s", fontSize: ".75rem" },
  closeBtn: { background: "#ef4444", border: "none", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", fontWeight: 600, color: "#fff", transition: "all 0.2s", fontSize: ".75rem" },
  message: { textAlign: "center", fontSize: ".9rem", padding: "16px 0", opacity: 0.85 },
};

// ==================== INCIDENTE FORM ====================
function IncidenteForm({ isOpen, setIsOpen, editIncident, clearEdit, refreshIncidents, currentUser }) {
  const [form, setForm] = useState(emptyForm());
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [disableSubmit, setDisableSubmit] = useState(false);

  const customToastStyle = {
    background: "linear-gradient(135deg, #244b89ff, #0e274aff)",
    color: "#f9fafb",
    fontWeight: "700",
    borderRadius: "12px",
    textAlign: "center",
  };

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [isOpen]);

  useEffect(() => {
    if (editIncident) {
      setForm({
        ...emptyForm(),
        ...editIncident,
        pista: Array.isArray(editIncident.pista) ? editIncident.pista : editIncident.pista?.split(",") || [],
        trabajos_via: Array.isArray(editIncident.trabajos_via) ? editIncident.trabajos_via : editIncident.trabajos_via?.split(",") || [],
        startDate: editIncident.start_date || "",
        startTime: editIncident.start_time || "",
        endDate: editIncident.end_date || "",
        endTime: editIncident.end_time || "",
        observacion: editIncident.observacion || "",
        sector: editIncident.sector || "",
        ubicacion_via: editIncident.ubicacion_via || "",
        senalizacion: editIncident.senalizacion || "",
        status: editIncident.status || "Activo",
      });
      setEditing(true);
    } else {
      setForm(emptyForm());
      setEditing(false);
    }
  }, [editIncident]);

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === "Escape" && isOpen) { setIsOpen(false); clearEdit(); } };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, clearEdit]);

  const handleChange = (key, value) => { setForm(prev => ({ ...prev, [key]: value })); setErrors(prev => ({ ...prev, [key]: false })); };

  const handleSaveIncident = async (newStatus = null) => {
    if (!currentUser.token) { toast.error("❌ No hay token válido"); return; }
    try {
      setDisableSubmit(true);

      const tempErrors = {};
      ["type", "priority", "camera", "startDate", "startTime"].forEach(f => { if (!form[f]) tempErrors[f] = true; });
      setErrors(tempErrors);
      if (Object.keys(tempErrors).length > 0) { setDisableSubmit(false); return; }

      const payload = {
        type: form.type,
        priority: form.priority,
        camera: form.camera,
        sector: form.sector || "",
        pista: form.pista,
        senalizacion: form.senalizacion || "",
        trabajos_via: form.trabajos_via,
        ubicacion_via: form.ubicacion_via || "",
        observacion: form.observacion || "",
        start_date: form.startDate,
        start_time: form.startTime,
        end_date: form.endDate,
        end_time: form.endTime,
        status: newStatus || form.status || "Activo",
        created_by_id: editing ? editIncident?.created_by_id : currentUser.id,
      };

      if (editing && newStatus === "Cerrado") payload.cerrado_por_id = currentUser.id;

      const headers = { Authorization: `Bearer ${currentUser.token}` };

      if (editing) {
        await axios.put(`${API_URL}${editIncident.id}/`, payload, { headers });
        toast.success(newStatus === "Cerrado" ? "Incidente cerrado" : "Incidente actualizado", { style: customToastStyle, onClose: () => setDisableSubmit(false) });
      } else {
        await axios.post(API_URL, payload, { headers });
        toast.success("Incidente creado", { style: customToastStyle, onClose: () => setDisableSubmit(false) });
      }

      refreshIncidents();
      setIsOpen(false);
      clearEdit();

    } catch (error) {
      console.error("Error guardando incidente:", error.response?.data || error);
      toast.error("Complete el formulario o revise el token", { style: customToastStyle, onClose: () => setDisableSubmit(false) });
    }
  };

  // ---------- CAMPOS FORMULARIO ----------
  const InputField = ({ label, type = "text", value, onChange, error }) => (
    <div className="col-12 col-md-6 mb-3">
      <label className="fw-semibold text-white">{label}</label>
      <input type={type} className={`form-control ${error ? "is-invalid" : ""}`} value={value ?? ""} onChange={e => onChange(e.target.value)}
        style={{ background: "rgba(0,0,0,.35)", color: "#fff", borderRadius: "10px", border: "1px solid #ffffff50", padding: "4px" }} />
      {error && <div className="invalid-feedback d-block">Campo obligatorio</div>}
    </div>
  );

  const SelectField = ({ label, value, onChange, options, error, multiple = false }) => (
    <div className="col-12 col-md-6 mb-3">
      <label className="fw-semibold text-white">{label}</label>
      <select className={`form-select ${error ? "is-invalid" : ""}`} value={value ?? (multiple ? [] : "")} onChange={e => multiple ? onChange(Array.from(e.target.selectedOptions, o => o.value)) : onChange(e.target.value)} multiple={multiple}
        style={{ background: "rgba(0,0,0,.35)", color: "#fff", borderRadius: "10px", border: "1px solid #ffffff50", padding: "8px" }}>
        {!multiple && <option value="">Seleccione</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <div className="invalid-feedback d-block">Campo obligatorio</div>}
    </div>
  );

  const CheckboxCardField = ({ label, options, selected, onChange }) => (
    <div className="col-12 col-md-6 mb-3">
      <label className="fw-semibold text-white">{label}</label>
      <div className="d-flex flex-wrap gap-2 mt-1">
        {options.map(o => (
          <div key={o} className={`checkbox-card ${selected.includes(o) ? "selected" : ""}`} onClick={() => onChange(selected.includes(o) ? selected.filter(x => x !== o) : [...selected, o])}>{o}</div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <ToastContainer position="top-center" autoClose={3000} />
      <AnimatePresence>
        {isOpen && (
          <motion.div className="modal-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsOpen(false); clearEdit(); }}>
            <motion.div className="modal-card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <h2 className="text-center mb-4">{editing ? "Editar Incidente" : "Crear Incidente"}</h2>

              <div className="container">
                <div className="row">
                  <SelectField label="Tipo" value={form.type} onChange={v => handleChange("type", v)} options={INCIDENT_TYPES} error={errors.type} />
                  <SelectField label="Prioridad" value={form.priority} onChange={v => handleChange("priority", v)} options={PRIORITIES} error={errors.priority} />
                  <SelectField label="Cámara" value={form.camera} onChange={v => handleChange("camera", v)} options={CAMERAS} error={errors.camera} />
                  <SelectField label="Sector" value={form.sector} onChange={v => handleChange("sector", v)} options={SECTORS} />
                </div>

                <div className="row">
                  <CheckboxCardField label="Pistas" options={PISTAS} selected={form.pista} onChange={v => handleChange("pista", v)} />
                  <CheckboxCardField label="Trabajos" options={TRABAJOS_VIA} selected={form.trabajos_via} onChange={v => handleChange("trabajos_via", v)} />
                </div>

                <div className="row">
                  <SelectField label="Ubicación" value={form.ubicacion_via} onChange={v => handleChange("ubicacion_via", v)} options={SECTORS} />
                  <SelectField label="Señalización" value={form.senalizacion} onChange={v => handleChange("senalizacion", v)} options={SEÑALIZACIONES} />
                </div>

                <div className="row">
                  <InputField label="Fecha inicio" type="date" value={form.startDate} onChange={v => handleChange("startDate", v)} error={errors.startDate} />
                  <InputField label="Hora inicio" type="time" value={form.startTime} onChange={v => handleChange("startTime", v)} error={errors.startTime} />
                  <InputField label="Fecha fin" type="date" value={form.endDate} onChange={v => handleChange("endDate", v)} />
                  <InputField label="Hora fin" type="time" value={form.endTime} onChange={v => handleChange("endTime", v)} />
                </div>

                <div className="row mb-3">
                  <textarea className={`form-control ${errors.observacion ? "is-invalid" : ""}`} placeholder="Observaciones" value={form.observacion} onChange={e => handleChange("observacion", e.target.value)}
                    style={{ background: "rgba(0,0,0,.35)", color: "#fff", borderRadius: "10px", border: "1px solid #ffffff50", padding: "5px", minHeight: "80px" }} />
                </div>

                <div className="d-flex gap-3 justify-content-center mt-3 flex-wrap">
                  <button className="btn btn-success w-40" onClick={() => handleSaveIncident()} disabled={disableSubmit}>{editing ? "Guardar" : "Crear"}</button>
                  {editing && form.status !== "Cerrado" && <button className="btn btn-warning w-40" onClick={() => handleSaveIncident("Cerrado")} disabled={disableSubmit}>🔒 Cerrar</button>}
                  <button className="btn btn-danger w-40" onClick={() => { setIsOpen(false); clearEdit(); }} disabled={disableSubmit}>Cancelar</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .modal-bg{ position: fixed; inset:0; background: rgba(0,0,0,.6); display:flex; justify-content:center; align-items:flex-start; padding:100px 15px 15px 15px; overflow-y:auto; z-index:200; }
        .modal-card{ background: rgba(30,58,115,0.95); backdrop-filter: blur(6px); padding: 10px; border-radius:20px; max-width:650px; max-height:90vh; overflow-y:auto; width:100%; color:#fff; box-shadow:0 8px 20px rgba(66,101,161,0.5); transition: all 0.3s ease; }
        @media (max-width:500px){ .modal-card{ padding:15px; border-radius:15px; max-width:90%; max-height:85vh; box-shadow:0 6px 18px rgba(66,101,161,0.5); } }
        .row > .col-12.col-md-6{ padding-left:6px; padding-right:6px; transition: all 0.2s ease; }
        @media (max-width:500px){ .row > .col-12.col-md-6{ width:100%; padding-left:0; padding-right:0; } }
        .checkbox-card{ padding: 6px 14px; border-radius:12px; border:2px solid #ffffff50; cursor:pointer; font-size:0.87rem; transition: all 0.2s; }
        .checkbox-card.selected{ background:#0ea5e9; font-weight:600; color:#fff; border:1px solid #0ea5e9; }
        .form-select, .form-control{ transition: all 0.2s; }
        .form-select:focus, .form-control:focus{ outline:none; box-shadow:0 0 6px #0ea5e9; }
        .btn-success{ background-color:#22c55e; border:none; border-radius:12px; padding:8px 14px; font-size:0.9rem; }
        .btn-success:hover{ background-color:#16a34a; }
        .btn-danger{ background-color:#ef4444; border:none; border-radius:12px; padding:8px 14px; font-size:0.9rem; }
        .btn-danger:hover{ background-color:#dc2626; }
        .btn-warning{ background-color:#f59e0b; border:none; color:#fff; border-radius:12px; padding:8px 14px; font-size:0.9rem; }
        .btn-warning:hover{ background-color:#d97706; }
      `}</style>
    </>
  );
}
