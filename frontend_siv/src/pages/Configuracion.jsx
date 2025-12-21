// src/pages/ConfiguracionAvanzada.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

// ---------------------------
// Componente RoleCard
// ---------------------------
const RoleCard = ({ role, pages, permissions, togglePermission, settings, updateSetting }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{ ...styles.roleCard, borderTopColor: role.color }}
    >
      <h3 style={{ ...styles.roleTitle, color: role.color }}>{role.name}</h3>

      {/* Permisos a páginas */}
      <div style={styles.pagesContainer}>
        {pages.map((page) => {
          const active = permissions[role.id]?.[page];
          return (
            <motion.div
              key={page}
              whileHover={{ scale: 1.05 }}
              style={{
                ...styles.pageItem,
                background: active ? role.color : "rgba(255,255,255,0.05)",
                color: active ? "#fff" : "#e0e7ff",
              }}
              onClick={() => togglePermission(role.id, page)}
            >
              {page}
            </motion.div>
          );
        })}
      </div>

      {/* Configuraciones útiles */}
      <div style={{ marginTop: 15 }}>
        <Form.Check
          type="switch"
          id={`${role.id}-notifications`}
          label="Activar notificaciones"
          checked={settings[role.id]?.notifications || false}
          onChange={() => updateSetting(role.id, "notifications")}
        />
        <Form.Check
          type="switch"
          id={`${role.id}-create`}
          label="Puede crear"
          checked={settings[role.id]?.create || false}
          onChange={() => updateSetting(role.id, "create")}
        />
        <Form.Check
          type="switch"
          id={`${role.id}-edit`}
          label="Puede editar"
          checked={settings[role.id]?.edit || false}
          onChange={() => updateSetting(role.id, "edit")}
        />
        <Form.Check
          type="switch"
          id={`${role.id}-delete`}
          label="Puede eliminar"
          checked={settings[role.id]?.delete || false}
          onChange={() => updateSetting(role.id, "delete")}
        />
        <Form.Check
          type="switch"
          id={`${role.id}-export`}
          label="Puede exportar datos"
          checked={settings[role.id]?.export || false}
          onChange={() => updateSetting(role.id, "export")}
        />
        <Form.Check
          type="switch"
          id={`${role.id}-specialReports`}
          label="Acceso a reportes especiales"
          checked={settings[role.id]?.specialReports || false}
          onChange={() => updateSetting(role.id, "specialReports")}
        />
      </div>
    </motion.div>
  );
};

// ---------------------------
// Componente principal
// ---------------------------
const ConfiguracionAvanzada = () => {
  const [roles] = useState([
    { id: "admin", name: "Administrador", color: "#EF4444" },
    { id: "user", name: "Usuario", color: "#3B82F6" },
    { id: "guest", name: "Invitado", color: "#FACC15" },
  ]);

  const [pages] = useState(["Dashboard", "Usuarios", "Configuración", "Reportes"]);

  const [permissions, setPermissions] = useState({});
  const [settings, setSettings] = useState({});

  // Cargar desde localStorage
  useEffect(() => {
    const savedPermissions = JSON.parse(localStorage.getItem("permissions") || "{}");
    const savedSettings = JSON.parse(localStorage.getItem("settings") || "{}");
    setPermissions(savedPermissions);
    setSettings(savedSettings);
  }, []);

  // Toggle permisos
  const togglePermission = useCallback((roleId, page) => {
    setPermissions((prev) => {
      const updated = { ...prev, [roleId]: { ...prev[roleId], [page]: !prev[roleId]?.[page] } };
      localStorage.setItem("permissions", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Actualizar configuraciones adicionales
  const updateSetting = useCallback((roleId, key) => {
    setSettings((prev) => {
      const updated = { ...prev, [roleId]: { ...prev[roleId], [key]: !prev[roleId]?.[key] } };
      localStorage.setItem("settings", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Guardar todo
  const handleSave = () => {
    localStorage.setItem("permissions", JSON.stringify(permissions));
    localStorage.setItem("settings", JSON.stringify(settings));
    alert("✅ Configuración guardada correctamente");
  };

  return (
    <motion.div style={styles.page}>
      <motion.h2 style={styles.title} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        Configuración avanzada de roles (Local)
      </motion.h2>

      <div style={styles.rolesContainer}>
        <AnimatePresence>
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              pages={pages}
              permissions={permissions}
              togglePermission={togglePermission}
              settings={settings}
              updateSetting={updateSetting}
            />
          ))}
        </AnimatePresence>
      </div>

      <Button style={styles.saveBtn} onClick={handleSave}>
        Guardar configuración
      </Button>
    </motion.div>
  );
};

// ---------------------------
// Estilos
// ---------------------------
const styles = {
  page: {
    width: "100%",
    minHeight: "100vh",
    padding: 20,
    fontFamily: "'Poppins', sans-serif",
    background: "linear-gradient(135deg, #0f172a, #1a3776, #0a3098)",
    color: "#fff",
  },
  title: {
    textAlign: "center",
    marginBottom: 30,
    color: "#e0e7ff",
    textShadow: "1px 1px 4px rgba(0,0,0,0.3)",
    fontWeight: 700,
  },
  rolesContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: 20,
    justifyContent: "center",
  },
  roleCard: {
    background: "linear-gradient(145deg, #1e3a73, #3b82f6)",
    borderRadius: 16,
    padding: 20,
    minWidth: 300,
    maxWidth: 340,
    boxShadow: "0 16px 44px rgba(0,0,0,0.4)",
    borderTop: "6px solid",
  },
  roleTitle: {
    marginBottom: 12,
    textAlign: "center",
    fontSize: "1.3rem",
    fontWeight: 700,
  },
  pagesContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    marginBottom: 15,
  },
  pageItem: {
    padding: "8px 14px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 600,
    transition: "all 0.2s",
    userSelect: "none",
  },
  saveBtn: {
    display: "block",
    margin: "30px auto 0 auto",
    fontWeight: 700,
    padding: "10px 26px",
    borderRadius: 14,
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
  },
};

export default ConfiguracionAvanzada;
