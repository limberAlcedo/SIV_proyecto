import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CameraCard from "../components/CameraCard";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, Camera } from "lucide-react";

const BACKEND_URL = "http://127.0.0.1:8000";

export default function Camaras() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) navigate("/");
  }, [navigate]);

  const cameras = [
    { id: 1, title: "CCTV 1.1" },
    { id: 2, title: "CCTV 1.2" },
    { id: 3, title: "CCTV 1.3" },
    { id: 4, title: "CCTV 1.4" },
    { id: 5, title: "CCTV 1.5" },
    { id: 6, title: "CCTV 1.6" },
    { id: 7, title: "CCTV 1.7" },
    { id: 8, title: "CCTV 1.8" },
  ];

  const [alerts, setAlerts] = useState(0);
  const [flow, setFlow] = useState(0);
  const [activeCameras, setActiveCameras] = useState(0);
  const [focusedCam, setFocusedCam] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let onlineCount = 0;
        let totalDetenidos = 0;

        for (const cam of cameras) {
          try {
            const statusRes = await fetch(`${BACKEND_URL}/camera/${cam.id}/status`);
            const statusData = await statusRes.json();
            if (statusData.status === "online") onlineCount++;
          } catch {}
          try {
            const detenidosRes = await fetch(`${BACKEND_URL}/camera/${cam.id}/detenidos`);
            const data = await detenidosRes.json();
            totalDetenidos += data.detenidos || 0;
          } catch {}
        }

        setActiveCameras(onlineCount);
        setAlerts(totalDetenidos);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      style={styles.page}
    >
      <header style={styles.header}>
        <motion.h1
          style={styles.title}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          🚦 Sistema de Detección Vehicular
        </motion.h1>
        <p style={styles.subtitle}>
          Monitoreo Inteligente con IA (YOLOv8 + FastAPI)
        </p>
      </header>

      {/* KPIs */}
      {!focusedCam && (
        <div style={styles.kpiContainer}>
          <KpiCard
            icon={<Camera size={28} />}
            label="Cámaras activas"
            value={`${activeCameras} / ${cameras.length}`}
            gradient={["#3b82f6", "#2563eb"]}
          />

          <AlertKpi alerts={alerts} />

          <KpiCard
            icon={<Activity size={28} />}
            label="Flujo estimado"
            value={`${flow} / min`}
            gradient={["#34d399", "#10b981"]}
          />
        </div>
      )}

      {/* Grid de cámaras */}
      <div
        style={{
          ...styles.gridContainer,
          filter: focusedCam ? "blur(6px)" : "none",
          pointerEvents: focusedCam ? "none" : "auto",
        }}
      >
        {cameras.map((cam) => (
          <motion.div
            key={cam.id}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.25 }}
            style={styles.cameraWrapper}
            onClick={() => setFocusedCam(cam)}
          >
            <CameraCard title={cam.title} camId={cam.id} />
          </motion.div>
        ))}
      </div>

      {/* Fullscreen cámara */}
      {focusedCam && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={styles.fullscreenWrapper}
        >
          <motion.div style={styles.fullscreenContent} initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} transition={{ duration: 0.3 }}>
            <img
              src={`${BACKEND_URL}/camera/${focusedCam.id}/stream`}
              alt={focusedCam.title}
              style={styles.fullscreenImg}
            />
            <button style={styles.closeButton} onClick={() => setFocusedCam(null)}>✕</button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

// KPI genérico
const KpiCard = ({ icon, label, value, gradient }) => (
  <motion.div
    style={{
      ...styles.kpiCard,
      background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
      color: "#fff",
    }}
    whileHover={{ scale: 1.05 }}
  >
    {icon}
    <h5 style={styles.kpiLabel}>{label}</h5>
    <p style={styles.kpiValue}>{value}</p>
  </motion.div>
);

// KPI de alertas
const AlertKpi = ({ alerts }) => (
  <motion.div
    style={{
      ...styles.kpiCard,
      border: alerts > 0 ? "3px solid #ef4444" : "2px solid #ccc",
      background: alerts > 0 ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)",
      color: alerts > 0 ? "#ef4444" : "#9ca3af",
      position: "relative",
      overflow: "hidden",
    }}
    animate={
      alerts > 0
        ? {
            scale: [1, 1.1, 1],
            boxShadow: [
              "0 0 0px rgba(239,68,68,0.6)",
              "0 0 30px rgba(239,68,68,1)",
              "0 0 0px rgba(239,68,68,0.6)",
            ],
            rotate: [0, 2, -2, 0],
          }
        : {}
    }
    transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
  >
    <AlertTriangle color={alerts > 0 ? "#ef4444" : "#9ca3af"} size={28} />
    <h5 style={styles.kpiLabel}>Alertas</h5>
    <p style={{ ...styles.kpiValue, fontSize: "1.8rem" }}>{alerts}</p>

    {alerts > 0 && (
      <>
        <motion.div
          style={{
            position: "absolute",
            top: -10,
            right: -10,
            width: 20,
            height: 20,
            borderRadius: "50%",
            backgroundColor: "#ef4444",
            opacity: 0.7,
          }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 0.7, repeat: Infinity }}
        />
        <motion.div
          style={{
            position: "absolute",
            bottom: -10,
            left: -10,
            width: 15,
            height: 15,
            borderRadius: "50%",
            backgroundColor: "#f87171",
            opacity: 0.6,
          }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
        />
      </>
    )}
  </motion.div>
);

// Estilos
const styles = {
  page: {
    width: "100%",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
    color: "#f9fafb",
    padding: "40px 0 80px",
    fontFamily: "'Poppins', sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  header: { textAlign: "center", marginBottom: "35px" },
  title: { fontSize: "2.2rem", fontWeight: 700, color: "#fff" },
  subtitle: { fontSize: "1rem", color: "#d1d5db", marginTop: "6px" },

  kpiContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "25px",
    flexWrap: "wrap",
    marginBottom: "30px",
  },
  kpiCard: {
    borderRadius: "18px",
    padding: "20px 25px",
    width: "200px",
    textAlign: "center",
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
    backdropFilter: "blur(15px)",
    transition: "all 0.3s ease",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
  kpiLabel: { marginTop: "5px", fontSize: "1rem", color: "#f3f4f6" },
  kpiValue: { fontSize: "1.6rem", fontWeight: 700, marginTop: "5px" },

  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
    gap: "20px",
    justifyItems: "center",
    width: "95%",
    maxWidth: "1800px",
  },
  cameraWrapper: {
    width: "90%",
    height: "280px",
    borderRadius: "20px",
    overflow: "hidden",
    background: "rgba(255,255,255,0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 5px 20px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
    cursor: "pointer",
  },
  fullscreenWrapper: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.85)",
    zIndex: 9999,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(8px)",
  },
  fullscreenContent: {
    position: "relative",
    width: "90vw",
    height: "90vh",
    background: "rgba(0,0,0,0.95)",
    borderRadius: "16px",
    boxShadow: "0 0 40px rgba(0,0,0,0.9)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    borderRadius: "12px",
  },
  closeButton: {
    position: "absolute",
    top: "10px",
    right: "15px",
    fontSize: "2rem",
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    zIndex: 10,
  },
};
