// ============================
// src/components/IncidenteForm.jsx
// ============================
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ================= CONSTANTES =================
const API_URL = "http://127.0.0.1:8000/api/incidentes/";
const INCIDENT_TYPES = ["Robo", "Accidente", "Intrusión", "Falla técnica"];
const PRIORITIES = ["Alta", "Media", "Baja"];
const CAMERAS = ["C1", "C2", "C3"];
const SECTORS = ["Interior", "Exterior"];
const PISTAS = ["Pista 1", "Pista 2", "Pista 3"];
const SEÑALIZACIONES = ["Señal A", "Señal B", "Señal C"];
const TRABAJOS_VIA = ["Obra A", "Obra B", "Obra C"];

const customToastStyle = {
  background: "linear-gradient(135deg, #244b89ff, #0e274aff)",
  color: "#f9fafb",
  fontWeight: "700",
  borderRadius: "12px",
  textAlign: "center",
};

// ================= FUNCIONES =================
const emptyForm = () => {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  return {
    type: "",
    priority: "",
    camera: "",
    sector: "",
    startDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )}`,
    startTime: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    endDate: "",
    endTime: "",
    observacion: "",
    pista: [],
    ubicacion_via: "",
    senalizacion: "",
    trabajos_via: [],
    status: "Activo",
  };
};

// ================= CAMPOS =================
const InputField = ({ label, type = "text", value, onChange, error }) => (
  <div className="col-12 col-md-6 mb-3">
    <label className="fw-semibold text-white">{label}</label>
    <input
      type={type}
      className={`form-control ${error ? "is-invalid" : ""}`}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: "rgba(0,0,0,.35)",
        color: "#fff",
        borderRadius: "10px",
        border: "1px solid #ffffff50",
        padding: "4px",
      }}
    />
    {error && <div className="invalid-feedback d-block">Campo obligatorio</div>}
  </div>
);

const SelectField = ({
  label,
  value,
  onChange,
  options,
  error,
  multiple = false,
}) => (
  <div className="col-12 col-md-6 mb-3">
    <label className="fw-semibold text-white">{label}</label>
    <select
      className={`form-select ${error ? "is-invalid" : ""}`}
      value={value ?? (multiple ? [] : "")}
      onChange={(e) =>
        multiple
          ? onChange(
              Array.from(e.target.selectedOptions, (option) => option.value)
            )
          : onChange(e.target.value)
      }
      multiple={multiple}
      style={{
        background: "rgba(0,0,0,.35)",
        color: "#fff",
        borderRadius: "10px",
        border: "1px solid #ffffff50",
        padding: "8px",
      }}
    >
      {!multiple && <option value="">Seleccione</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
    {error && <div className="invalid-feedback d-block">Campo obligatorio</div>}
  </div>
);

const CheckboxCardField = ({ label, options, selected, onChange }) => (
  <div className="col-12 col-md-6 mb-3">
    <label className="fw-semibold text-white">{label}</label>
    <div className="d-flex flex-wrap gap-2 mt-1">
      {options.map((o) => (
        <div
          key={o}
          className={`checkbox-card ${selected.includes(o) ? "selected" : ""}`}
          onClick={() =>
            onChange(
              selected.includes(o)
                ? selected.filter((x) => x !== o)
                : [...selected, o]
            )
          }
        >
          {o}
        </div>
      ))}
    </div>
  </div>
);

// ================= COMPONENTE FORM =================
export default function IncidenteForm({
  isOpen,
  setIsOpen,
  editIncident,
  clearEdit,
  refreshIncidents,
  currentUser,
}) {
  const [form, setForm] = useState(emptyForm());
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [disableSubmit, setDisableSubmit] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [isOpen]);

  useEffect(() => {
    if (editIncident) {
      // Formatear correctamente las fechas y arrays
      const formatDate = (d) => (d ? d.split("T")[0] : "");
      const formatTime = (t) => {
        if (!t) return "";
        const [h, m] = t.split(":");
        return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
      };
      setForm({
        type: editIncident.type || "",
        priority: editIncident.priority || "",
        camera: editIncident.camera || "",
        sector: editIncident.sector || "",
        startDate: formatDate(editIncident.start_date) || emptyForm().startDate,
        startTime: formatTime(editIncident.start_time) || emptyForm().startTime,
        endDate: formatDate(editIncident.end_date),
        endTime: formatTime(editIncident.end_time),
        observacion: editIncident.observacion || "",
        pista: editIncident.pista
          ? Array.isArray(editIncident.pista)
            ? editIncident.pista
            : editIncident.pista.split(",").map((x) => x.trim())
          : [],
        trabajos_via: editIncident.trabajos_via
          ? Array.isArray(editIncident.trabajos_via)
            ? editIncident.trabajos_via
            : editIncident.trabajos_via.split(",").map((x) => x.trim())
          : [],
        ubicacion_via: editIncident.ubicacion_via || "",
        senalizacion: editIncident.senalizacion || "",
        status: editIncident.status || "Activo",
      });
      setEditing(true);
    } else if (isOpen) {
      setForm(emptyForm());
      setEditing(false);
    }
  }, [editIncident, isOpen]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: false }));
  };

  const handleSaveIncident = async (newStatus = null) => {
    try {
      setDisableSubmit(true);

      // ================= VALIDACIÓN =================
      const tempErrors = {};
      ["type", "priority", "camera", "startDate", "startTime"].forEach((f) => {
        if (!form[f]) tempErrors[f] = true;
      });

      // Si se quiere cerrar, campos obligatorios extra
      if (newStatus === "Cerrado") {
        [
          "sector",
          "pista",
          "trabajos_via",
          "ubicacion_via",
          "senalizacion",
        ].forEach((f) => {
          const value = form[f];
          // Forzar arrays desde strings
          const arrValue =
            typeof value === "string" && value.includes(",")
              ? value.split(",").map((x) => x.trim())
              : value;
          if (!arrValue || (Array.isArray(arrValue) && arrValue.length === 0))
            tempErrors[f] = true;
        });
      }

      setErrors(tempErrors);
      if (Object.keys(tempErrors).length > 0) {
        toast.error("❌ Completa todos los campos obligatorios antes de cerrar", {
          style: customToastStyle,
        });
        setDisableSubmit(false);
        return;
      }

      const payload = {
        type: form.type || null,
        priority: form.priority || null,
        camera: form.camera || null,
        sector: form.sector || null,
        pista: form.pista,
        senalizacion: form.senalizacion || null,
        trabajos_via: form.trabajos_via,
        ubicacion_via: form.ubicacion_via || null,
        observacion: form.observacion,
        start_date: form.startDate,
        start_time: form.startTime,
        end_date: form.endDate || null,
        end_time: form.endTime || null,
        status: newStatus || form.status,
        created_by_id: editing ? editIncident?.created_by_id : currentUser.id,
      };

      if (editing && newStatus === "Cerrado") payload.cerrado_por_id = currentUser.id;

      const token = currentUser.token || localStorage.getItem("token");
      if (!token) {
        toast.error("❌ Usuario no autenticado", { style: customToastStyle });
        setDisableSubmit(false);
        return;
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editing) await axios.put(`${API_URL}${editIncident.id}/`, payload, config);
      else await axios.post(API_URL, payload, config);

      toast.success(
        editing
          ? newStatus === "Cerrado"
            ? "Incidente cerrado"
            : "Incidente actualizado"
          : "Incidente creado",
        { style: customToastStyle }
      );
      refreshIncidents();
      setIsOpen(false);
      clearEdit();
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar incidente", { style: customToastStyle });
    } finally {
      setDisableSubmit(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-bg"
      onClick={() => {
        setIsOpen(false);
        clearEdit();
      }}
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          className="close-btn"
          onClick={() => {
            setIsOpen(false);
            clearEdit();
          }}
        >
          ×
        </button>

        <h2 className="text-center mb-4">
          {editing ? "Editar Incidente" : "Crear Incidente"}
        </h2>

        <div className="container">
          <div className="row">
            <SelectField
              label="Tipo"
              value={form.type}
              onChange={(v) => handleChange("type", v)}
              options={INCIDENT_TYPES}
              error={errors.type}
            />
            <SelectField
              label="Prioridad"
              value={form.priority}
              onChange={(v) => handleChange("priority", v)}
              options={PRIORITIES}
              error={errors.priority}
            />
            <SelectField
              label="Cámara"
              value={form.camera}
              onChange={(v) => handleChange("camera", v)}
              options={CAMERAS}
              error={errors.camera}
            />
            <SelectField
              label="Sector"
              value={form.sector}
              onChange={(v) => handleChange("sector", v)}
              options={SECTORS}
              error={errors.sector}
            />
          </div>

          <div className="row">
            <CheckboxCardField
              label="Pistas"
              options={PISTAS}
              selected={form.pista}
              onChange={(v) => handleChange("pista", v)}
            />
            <CheckboxCardField
              label="Trabajos"
              options={TRABAJOS_VIA}
              selected={form.trabajos_via}
              onChange={(v) => handleChange("trabajos_via", v)}
            />
          </div>

          <div className="row">
            <SelectField
              label="Ubicación"
              value={form.ubicacion_via}
              onChange={(v) => handleChange("ubicacion_via", v)}
              options={SECTORS}
            />
            <SelectField
              label="Señalización"
              value={form.senalizacion}
              onChange={(v) => handleChange("senalizacion", v)}
              options={SEÑALIZACIONES}
            />
          </div>

          <div className="row">
            <InputField
              label="Fecha inicio"
              type="date"
              value={form.startDate}
              onChange={(v) => handleChange("startDate", v)}
              error={errors.startDate}
            />
            <InputField
              label="Hora inicio"
              type="time"
              value={form.startTime}
              onChange={(v) => handleChange("startTime", v)}
              error={errors.startTime}
            />
            <InputField
              label="Fecha fin"
              type="date"
              value={form.endDate}
              onChange={(v) => handleChange("endDate", v)}
            />
            <InputField
              label="Hora fin"
              type="time"
              value={form.endTime}
              onChange={(v) => handleChange("endTime", v)}
            />
          </div>

          <div className="row mb-3">
            <textarea
              className="form-control"
              placeholder="Observaciones"
              value={form.observacion}
              onChange={(e) => handleChange("observacion", e.target.value)}
              style={{
                background: "rgba(0,0,0,.35)",
                color: "#fff",
                borderRadius: "10px",
                border: "1px solid #ffffff50",
                padding: "5px",
                minHeight: "80px",
              }}
            />
          </div>

          <div className="d-flex gap-3 justify-content-center mt-3 flex-wrap">
            <button
              className="btn btn-success"
              onClick={() => handleSaveIncident()}
              disabled={disableSubmit}
            >
              Guardar
            </button>

            {editing && form.status !== "Cerrado" && (
              <button
                className="btn btn-danger"
                onClick={() => handleSaveIncident("Cerrado")}
                disabled={disableSubmit}
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;justify-content:center;align-items:flex-start;padding:100px 15px 15px 15px;overflow-y:auto;z-index:200;}
        .modal-card{position:relative;background:rgba(30,58,115,0.95);backdrop-filter:blur(6px);padding:10px;border-radius:20px;max-width:650px;max-height:90vh;overflow-y:auto;width:100%;color:#fff;box-shadow:0 8px 20px rgba(66,101,161,0.5);}
        .close-btn{position:absolute;top:12px;right:12px;background:transparent;border:none;color:#fff;font-size:1.5rem;font-weight:700;cursor:pointer;}
        .close-btn:hover{color:#f59e0b;}
        .checkbox-card{ padding: 6px 14px; border-radius: 12px; border: 2px solid #ffffff50; cursor: pointer; font-size: 0.87rem; transition: all 0.2s; }
        .checkbox-card.selected{ background: #0ea5e9; font-weight: 600; color: #fff; border: 1px solid #0ea5e9; }
        .form-select, .form-control { transition: all 0.2s; }
        .form-select:focus, .form-control:focus { outline: none; box-shadow: 0 0 6px #0ea5e9; }
        .btn-success{ background-color:#22c55e; border:none; border-radius: 12px; padding:8px 14px; font-size:0.9rem; color:#fff; }
        .btn-success:hover{ background-color:#16a34a; }
        .btn-danger{ background-color:#dc2626; border:none; border-radius: 12px; padding:8px 14px; font-size:0.9rem; color:#fff; }
        .btn-danger:hover{ background-color:#b91c1c; }
      `}</style>
    </div>
  );
}
