import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "react-bootstrap";

const rolesMock = [
  { id: 1, name: "Admin", color: "#EF4444" },
  { id: 2, name: "Supervisor", color: "#FBBF24" },
  { id: 3, name: "Operador", color: "#3B82F6" },
];

const pagesMock = [
  "Incidentes",
  "Usuarios",
  "Cámaras",
  "Configuración",
  "Reportes",
  "Estadísticas",
];

const Configuracion = () => {
  const [permissions, setPermissions] = useState({});
  const [notification, setNotification] = useState({ msg: "", type: "success" });

  // Inicializar permisos
  useEffect(() => {
    const initial = {};
    rolesMock.forEach((role) => {
      initial[role.id] = {};
      pagesMock.forEach((page) => (initial[role.id][page] = false));
    });
    setPermissions(initial);
  }, []);

  const togglePermission = (roleId, page) => {
    setPermissions((prev) => ({
      ...prev,
      [roleId]: { ...prev[roleId], [page]: !prev[roleId][page] },
    }));
  };

  const handleSave = () => {
    console.log("Permisos guardados:", permissions);
    setNotification({ msg: "Permisos guardados ✅", type: "success" });
    setTimeout(() => setNotification({ msg: "", type: "success" }), 2500);
  };

  return (
    <motion.div style={styles.page}>
      <motion.h2
        style={styles.title}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        Configuración de permisos
      </motion.h2>

      <div style={styles.rolesContainer}>
        <AnimatePresence>
          {rolesMock.map((role) => (
            <motion.div
              key={role.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ ...styles.roleCard, borderTopColor: role.color }}
            >
              <h3 style={{ ...styles.roleTitle, color: role.color }}>{role.name}</h3>
              <div style={styles.pagesContainer}>
                {pagesMock.map((page) => (
                  <motion.div
                    key={page}
                    whileHover={{ scale: 1.05 }}
                    style={{
                      ...styles.pageItem,
                      background: permissions[role.id]?.[page] ? role.color : "rgba(255,255,255,0.05)",
                      color: permissions[role.id]?.[page] ? "#fff" : "#e0e7ff",
                    }}
                    onClick={() => togglePermission(role.id, page)}
                  >
                    {page}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Button style={styles.saveBtn} onClick={handleSave}>
        Guardar permisos
      </Button>

      {/* NOTIFICACIÓN */}
      <AnimatePresence>
        {notification.msg && (
          <motion.div
            style={{
              ...styles.notification,
              background: notification.type === "error" ? "#EF4444" : "#14b8a6",
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {notification.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

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
    minWidth: 280,
    maxWidth: 320,
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
  notification: {
    position: "fixed",
    top: 20,
    right: 20,
    color: "#fff",
    padding: "12px 18px",
    borderRadius: 14,
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
    zIndex: 10000,
  },
};

export default Configuracion;
