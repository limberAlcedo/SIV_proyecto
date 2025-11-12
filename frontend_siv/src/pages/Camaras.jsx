import React, { useState, useEffect } from "react";
import CameraCard from "../components/CameraCard";

const BACKEND_URL = "http://127.0.0.1:8000"; // Cambia si tu backend usa otro puerto

const Camaras = () => {
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
  const [alertList, setAlertList] = useState([]);
  const [focusedCam, setFocusedCam] = useState(null);

  // 📊 Cargar KPIs y alertas
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/stats`);
        if (res.ok) {
          const data = await res.json();
          setActiveCameras(data.camaras_activas);
          setAlerts(data.alertas);
          setFlow(data.flujo_estimado);
        }
      } catch (err) {
        console.error("Error al obtener estadísticas:", err);
      }
    };

    const fetchAlerts = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/alerts`);
        if (res.ok) {
          const data = await res.json();
          setAlertList(data.alertas);
        }
      } catch (err) {
        console.error("Error al obtener alertas:", err);
      }
    };

    // 🚨 Nueva función: obtener vehículos detenidos
    const fetchStoppedVehicles = async () => {
      try {
        const newAlerts = [];
        for (const cam of cameras) {
          const res = await fetch(`${BACKEND_URL}/camera/${cam.id}/detenidos`);
          if (res.ok) {
            const data = await res.json();
            if (data.detenidos > 0) {
              newAlerts.push(
                `${cam.title}: ${data.detenidos} vehículo${
                  data.detenidos > 1 ? "s" : ""
                } detenido${data.detenidos > 1 ? "s" : ""} 🚨`
              );
            }
          }
        }
        // Si hay nuevos, los mezclamos con las alertas recientes (sin duplicar)
        if (newAlerts.length > 0) {
          setAlertList((prev) => {
            const combined = [...new Set([...newAlerts, ...prev])];
            return combined.slice(0, 10); // limitar a 10 alertas visibles
          });
        }
      } catch (err) {
        console.error("Error al obtener vehículos detenidos:", err);
      }
    };

    fetchStats();
    fetchAlerts();
    fetchStoppedVehicles();

    const interval = setInterval(() => {
      fetchStats();
      fetchAlerts();
      fetchStoppedVehicles();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>🚦 Sistema de Detección Vehicular</h1>
        <p style={styles.subtitle}>
          Monitoreo en tiempo real con IA (YOLOv8 + FastAPI)
        </p>
      </header>

      {/* KPIs */}
      {!focusedCam && (
        <div style={styles.kpiContainer} className="container">
          <div className="row">
            <div className="col-md-4 mb-3">
              <div style={{ ...styles.kpiCard, backgroundColor: "#1e3a8a" }}>
                <h6 style={styles.kpiLabel}>Cámaras activas</h6>
                <p style={styles.kpiValue}>
                  {activeCameras} / {cameras.length}
                </p>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div style={{ ...styles.kpiCard, backgroundColor: "#b91c1c" }}>
                <h6 style={styles.kpiLabel}>Alertas recientes</h6>
                <p style={styles.kpiValue}>{alerts}</p>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div style={{ ...styles.kpiCard, backgroundColor: "#047857" }}>
                <h6 style={styles.kpiLabel}>Flujo estimado</h6>
                <p style={styles.kpiValue}>{flow} / min</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📋 Alertas */}
      {!focusedCam && (
        <div className="container mt-4 text-center">
          <h5 style={{ color: "#ffcc00" }}>🚨 Alertas recientes</h5>
          <div style={styles.alertBox}>
            {alertList.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {alertList.map((alert, idx) => (
                  <li key={idx} style={styles.alertItem}>
                    {alert}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: "#999" }}>Sin alertas recientes</p>
            )}
          </div>
        </div>
      )}

      {/* Cámaras */}
      <div
        className="container mt-4"
        style={{
          filter: focusedCam ? "blur(6px)" : "none",
          transition: "all 0.3s ease",
          pointerEvents: focusedCam ? "none" : "auto",
        }}
      >
        <div className="row">
          {cameras.map((cam) => (
            <div key={cam.id} className="col-md-6 col-lg-3 mb-4">
              <div
                style={styles.cardWrapper}
                onClick={() => setFocusedCam(cam)}
              >
                <CameraCard title={cam.title} camId={cam.id} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vista ampliada */}
      {focusedCam && (
        <div style={styles.focusOverlay}>
          <div style={styles.focusCard}>
            <CameraCard title={focusedCam.title} camId={focusedCam.id} />
            <button style={styles.closeBtn} onClick={() => setFocusedCam(null)}>
              ✕
            </button>
            <h3 style={styles.focusTitle}>{focusedCam.title}</h3>
          </div>
        </div>
      )}
    </div>
  );
};

// 🎨 Estilos
const styles = {
  container: {
    background: "linear-gradient(to bottom, #111, #1c1c2e)",
    color: "#fff",
    minHeight: "100vh",
    paddingBottom: "60px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    position: "relative",
  },
  header: {
    textAlign: "center",
    paddingTop: "30px",
    paddingBottom: "20px",
  },
  title: {
    color: "#00bcd4",
    fontWeight: 700,
    marginBottom: "8px",
  },
  subtitle: {
    color: "#aaa",
    fontSize: "1rem",
  },
  kpiContainer: { marginTop: "20px" },
  kpiCard: {
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
    color: "#fff",
    boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
  },
  kpiLabel: { fontSize: "0.85rem", marginBottom: "5px" },
  kpiValue: { fontSize: "1.7rem", fontWeight: 700 },
  alertBox: {
    backgroundColor: "#222",
    borderRadius: "10px",
    padding: "10px",
    maxHeight: "150px",
    overflowY: "auto",
    marginTop: "10px",
    boxShadow: "inset 0 0 10px rgba(255,255,255,0.1)",
  },
  alertItem: {
    color: "#ffcc00",
    fontSize: "0.95rem",
    padding: "4px 0",
  },
  cardWrapper: {
    position: "relative",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
    cursor: "pointer",
    transition: "transform 0.3s, box-shadow 0.3s",
  },
  focusOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    zIndex: 9999,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "opacity 0.3s ease",
  },
  focusCard: {
    position: "relative",
    background: "#0a0a0a",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 0 30px rgba(0,0,0,0.8)",
    maxWidth: "85%",
    maxHeight: "85%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    animation: "zoomIn 0.3s ease",
  },
  closeBtn: {
    position: "absolute",
    top: "10px",
    right: "15px",
    fontSize: "1.5rem",
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },
  focusTitle: { marginTop: "12px", color: "#00bcd4" },
};

export default Camaras;
