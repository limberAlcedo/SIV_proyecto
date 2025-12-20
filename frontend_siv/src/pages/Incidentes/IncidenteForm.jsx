import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

// ================= CONST =================
const API_URL = "http://127.0.0.1:8000/api/incidentes/";

const INCIDENT_TYPES = ["Robo", "Accidente", "Intrusión", "Falla técnica"];
const PRIORITIES = ["Alta", "Media", "Baja"];
const CAMERAS = ["C1", "C2", "C3"];
const SECTORS = ["Interior", "Exterior"];
const PISTAS = ["Pista 1", "Pista 2", "Pista 3"];
const SEÑALIZACIONES = ["Señal A", "Señal B", "Señal C"];
const TRABAJOS_VIA = ["Obra A", "Obra B", "Obra C"];

// ================= ESTILOS =================
const customToastStyle = {
  background: "linear-gradient(135deg, #244b89ff, #0e274aff)",
  color: "#f9fafb",
  fontWeight: "700",
  borderRadius: "12px",
  textAlign: "center",
};

// ================= FORMULARIO VACÍO =================
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

// ================= COMPONENTES =================
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

const SelectField = ({ label, value, onChange, options, error, multiple = false }) => (
  <div className="col-12 col-md-6 mb-3">
    <label className="fw-semibold text-white">{label}</label>
    <select
      className={`form-select ${error ? "is-invalid" : ""}`}
      value={value ?? (multiple ? [] : "")}
      onChange={(e) =>
        multiple
          ? onChange(Array.from(e.target.selectedOptions, (option) => option.value))
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

// ================= FORM PRINCIPAL =================
const IncidenteForm = ({
  isOpen,
  setIsOpen,
  editIncident,
  clearEdit,
  refreshIncidents,
  currentUser,
}) => {
  const [form, setForm] = useState(emptyForm());
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [disableSubmit, setDisableSubmit] = useState(false);

  // Bloquear scroll de fondo
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [isOpen]);

  // Editar incidente
  useEffect(() => {
    if (editIncident) {
      setForm({
        ...emptyForm(),
        ...editIncident,
        pista: Array.isArray(editIncident.pista)
          ? editIncident.pista
          : editIncident.pista
          ? editIncident.pista.split(",")
          : [],
        trabajos_via: Array.isArray(editIncident.trabajos_via)
          ? editIncident.trabajos_via
          : editIncident.trabajos_via
          ? editIncident.trabajos_via.split(",")
          : [],
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

  // Cerrar modal con ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        clearEdit();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, clearEdit]);

  // Actualizar campo
  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: false }));
  };

  // Guardar incidente
  const handleSaveIncident = async (newStatus = null) => {
    try {
      setDisableSubmit(true);

      // Validación básica
      const tempErrors = {};
      ["type", "priority", "camera", "startDate", "startTime"].forEach((field) => {
        if (!form[field]) tempErrors[field] = true;
      });
      setErrors(tempErrors);
      if (Object.keys(tempErrors).length > 0) {
        setDisableSubmit(false);
        return;
      }

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

      if (editing) {
        await axios.put(`${API_URL}${editIncident.id}/`, payload);
        toast.success(newStatus === "Cerrado" ? "Incidente cerrado" : "Incidente actualizado", {
          style: customToastStyle,
          onClose: () => setDisableSubmit(false),
        });
      } else {
        await axios.post(API_URL, payload);
        toast.success("Incidente creado", {
          style: customToastStyle,
          onClose: () => setDisableSubmit(false),
        });
      }

      refreshIncidents();
      setIsOpen(false);
      clearEdit();
    } catch (error) {
      console.error("Error guardando incidente:", error.response?.data || error);
      toast.error("Complete el formulario", {
        style: customToastStyle,
        onClose: () => setDisableSubmit(false),
      });
    }
  };

  return (
    <>
      <ToastContainer position="top-center" autoClose={3000} />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setIsOpen(false); clearEdit(); }}
          >
            <motion.div
              className="modal-card"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-center mb-4">{editing ? "Editar Incidente" : "Crear Incidente"}</h2>

              <div className="container">
                <div className="row">
                  <SelectField label="Tipo" value={form.type} onChange={(v) => handleChange("type", v)} options={INCIDENT_TYPES} error={errors.type} />
                  <SelectField label="Prioridad" value={form.priority} onChange={(v) => handleChange("priority", v)} options={PRIORITIES} error={errors.priority} />
                  <SelectField label="Cámara" value={form.camera} onChange={(v) => handleChange("camera", v)} options={CAMERAS} error={errors.camera} />
                  <SelectField label="Sector" value={form.sector} onChange={(v) => handleChange("sector", v)} options={SECTORS} />
                </div>

                <div className="row">
                  <CheckboxCardField label="Pistas" options={PISTAS} selected={form.pista} onChange={(v) => handleChange("pista", v)} />
                  <CheckboxCardField label="Trabajos" options={TRABAJOS_VIA} selected={form.trabajos_via} onChange={(v) => handleChange("trabajos_via", v)} />
                </div>

                <div className="row">
                  <SelectField label="Ubicación" value={form.ubicacion_via} onChange={(v) => handleChange("ubicacion_via", v)} options={SECTORS} />
                  <SelectField label="Señalización" value={form.senalizacion} onChange={(v) => handleChange("senalizacion", v)} options={SEÑALIZACIONES} />
                </div>

                <div className="row">
                  <InputField label="Fecha inicio" type="date" value={form.startDate} onChange={(v) => handleChange("startDate", v)} error={errors.startDate} />
                  <InputField label="Hora inicio" type="time" value={form.startTime} onChange={(v) => handleChange("startTime", v)} error={errors.startTime} />
                  <InputField label="Fecha fin" type="date" value={form.endDate} onChange={(v) => handleChange("endDate", v)} />
                  <InputField label="Hora fin" type="time" value={form.endTime} onChange={(v) => handleChange("endTime", v)} />
                </div>

                <div className="row mb-3">
                  <textarea
                    className={`form-control ${errors.observacion ? "is-invalid" : ""}`}
                    placeholder="Observaciones"
                    value={form.observacion}
                    onChange={(e) => handleChange("observacion", e.target.value)}
                    style={{ background: "rgba(0,0,0,.35)", color: "#fff", borderRadius: "10px", border: "1px solid #ffffff50", padding: "5px", minHeight: "80px" }}
                  />
                </div>

                <div className="d-flex gap-3 justify-content-center mt-3 flex-wrap">
                  <button className="btn btn-success w-40" onClick={() => handleSaveIncident()} disabled={disableSubmit}>
                    {editing ? "Guardar" : "Crear"}
                  </button>

                  {editing && form.status !== "Cerrado" && (
                    <button className="btn btn-warning w-40" onClick={() => handleSaveIncident("Cerrado")} disabled={disableSubmit}>
                      🔒 Cerrar
                    </button>
                  )}

                  <button className="btn btn-danger w-40" onClick={() => { setIsOpen(false); clearEdit(); }} disabled={disableSubmit}>
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .modal-bg{
          position: fixed;
          inset:0;
          background: rgba(0,0,0,.6);
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 100px 15px 15px 15px;
          overflow-y: auto;
          z-index: 200;
        }
        .modal-card{
          background: rgba(30, 58, 115, 0.95);
          backdrop-filter: blur(6px);
          padding: 10px;
          border-radius: 20px;
          max-width: 650px;
          max-height: 90vh;
          overflow-y: auto;
          width: 100%;
          color: #fff;
          box-shadow: 0 8px 20px rgba(66, 101, 161, 0.5);
          transition: all 0.3s ease;
        }
        @media (max-width: 500px) {
          .modal-card { padding: 15px; border-radius: 15px; max-width: 90%; max-height: 85vh; box-shadow: 0 6px 18px rgba(66, 101, 161, 0.5); }
        }
        .row > .col-12.col-md-6 { padding-left:6px; padding-right:6px; transition: all 0.2s ease; }
        @media (max-width: 500px) { .row > .col-12.col-md-6 { width: 100%; padding-left:0; padding-right:0; } }
        .checkbox-card{ padding: 6px 14px; border-radius: 12px; border: 2px solid #ffffff50; cursor: pointer; font-size: 0.87rem; transition: all 0.2s; }
        .checkbox-card.selected{ background: #0ea5e9; font-weight: 600; color: #fff; border: 1px solid #0ea5e9; }
        .form-select, .form-control { transition: all 0.2s; }
        .form-select:focus, .form-control:focus { outline: none; box-shadow: 0 0 6px #0ea5e9; }
        .btn-success { background-color:#22c55e; border:none; border-radius: 12px; padding: 8px 14px; font-size: 0.9rem; }
        .btn-success:hover { background-color:#16a34a; }
        .btn-danger { background-color:#ef4444; border:none; border-radius: 12px; padding: 8px 14px; font-size: 0.9rem; }
        .btn-danger:hover { background-color:#dc2626; }
        .btn-warning { background-color:#f59e0b; border:none; color:#fff; border-radius: 12px; padding: 8px 14px; font-size: 0.9rem; }
        .btn-warning:hover { background-color:#d97706; }
      `}</style>
    </>
  );
};

export default IncidenteForm;
