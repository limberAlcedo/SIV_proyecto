import React from "react";
import { motion } from "framer-motion";

const CameraCard = ({ title = "CCTV 1.1", status = "offline" }) => {
  const isOnline = status === "online";

  return (
    <motion.div
      style={styles.card}
      whileHover={{
        scale: 1.03,
        boxShadow: "0 0 35px rgba(37,99,235,0.4)",
      }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      {/* HEADER */}
      <div style={styles.header}>
        <span style={styles.title}>{title}</span>
        <span
          style={{
            ...styles.statusDot,
            backgroundColor: isOnline ? "#22c55e" : "#ef4444",
          }}
        ></span>
      </div>

      {/* BODY */}
      <div style={styles.body}>
        {isOnline ? (
          <span style={styles.onlineText}>ONLINE ✅</span>
        ) : (
          <span style={styles.offlineText}>OFFLINE ❌</span>
        )}
      </div>
    </motion.div>
  );
};

export default CameraCard;

// 🎨 ESTILOS
const styles = {
  card: {
    background: "linear-gradient(180deg, #0f172a, #1e3a8a 40%, #1e40af 100%)",
    borderRadius: "18px",
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
    width: "100%",
    maxWidth: "380px", // 🔹 tamaño más grande
    height: "260px", // 🔹 altura mayor
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  header: {
    background: "linear-gradient(90deg, #0284c7, #2563eb, #1e40af)",
    padding: "10px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopLeftRadius: "18px",
    borderTopRightRadius: "18px",
    color: "#f8fafc",
  },
  title: {
    fontSize: "1rem",
    fontWeight: 600,
    letterSpacing: "0.3px",
  },
  statusDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    boxShadow: "0 0 8px rgba(255,255,255,0.5)",
  },
  body: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#f1f5f9",
    fontWeight: "700",
    fontSize: "1.15rem",
  },
  offlineText: {
    color: "#ef4444",
    letterSpacing: "0.5px",
    textShadow: "0 0 10px rgba(239,68,68,0.5)",
  },
  onlineText: {
    color: "#22c55e",
    letterSpacing: "0.5px",
    textShadow: "0 0 10px rgba(34,197,94,0.5)",
  },
};

// 📱 Responsividad
const responsiveStyles = document.createElement("style");
responsiveStyles.innerHTML = `
@media (max-width: 768px) {
  .camera-card {
    max-width: 90% !important;
    height: 220px !important;
  }
}
`;
document.head.appendChild(responsiveStyles);
