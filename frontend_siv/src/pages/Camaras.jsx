import React, { useState, useEffect } from "react";
import CameraCard from "../components/CameraCard";
import "bootstrap/dist/css/bootstrap.min.css";

const Camaras = () => {
  const cameras = [
    { id: 1, title: "Cámara 1" },
    { id: 2, title: "Cámara 2" },
    { id: 3, title: "Cámara 3" },
    { id: 4, title: "Cámara 4" },
  ];

  // Simulación de KPIs (puedes conectarlo al backend después)
  const [alerts, setAlerts] = useState(5);
  const [flow, setFlow] = useState(12);
  const [activeCameras, setActiveCameras] = useState(4);

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>🚦 Sistema de Detección de Congestión Vehicular</h1>
        <p style={styles.subtitle}>Monitoreo en tiempo real mediante IA (YOLOv8 + FastAPI)</p>
      </header>

      {/* KPIs */}
      <div style={styles.kpiContainer} className="container">
        <div className="row">
          <div className="col-md-4 mb-3">
            <div style={{...styles.kpiCard, backgroundColor: "#1e3a8a"}}>
              <h6 style={styles.kpiLabel}>Cámaras activas</h6>
              <p style={styles.kpiValue}>{activeCameras}/{cameras.length}</p>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div style={{...styles.kpiCard, backgroundColor: "#b91c1c"}}>
              <h6 style={styles.kpiLabel}>Alertas recientes</h6>
              <p style={styles.kpiValue}>{alerts}</p>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div style={{...styles.kpiCard, backgroundColor: "#047857"}}>
              <h6 style={styles.kpiLabel}>Flujo estimado</h6>
              <p style={styles.kpiValue}>{flow} / min</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de cámaras */}
      <div className="container mt-4">
        <div className="row">
          {cameras.map((cam) => (
            <div key={cam.id} className="col-md-6 col-lg-3 mb-4">
              <div
                style={styles.cardWrapper}
                className="camera-hover"
              >
                <CameraCard title={cam.title} camId={cam.id} />

                {/* Mini overlay de congestión */}
                <div style={styles.overlay}>
                  <span style={{...styles.congestionBadge, backgroundColor: "#16a34a"}}>Baja</span>
                  {/* Cambiar colores según congestión real: verde, amarillo, rojo */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        Desarrollado por <b>Limber Alcedo</b> — YOLOv8 + FastAPI
      </footer>
    </div>
  );
};

const styles = {
  container: {
    background: "linear-gradient(to bottom, #111, #1c1c2e)",
    color: "#fff",
    minHeight: "100vh",
    paddingBottom: "60px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
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
  kpiContainer: {
    marginTop: "20px",
  },
  kpiCard: {
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
    color: "#fff",
    boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
    transition: "transform 0.3s, box-shadow 0.3s",
  },
  kpiCardHover: {
    transform: "translateY(-5px)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.7)",
  },
  kpiLabel: {
    fontSize: "0.85rem",
    marginBottom: "5px",
  },
  kpiValue: {
    fontSize: "1.7rem",
    fontWeight: 700,
  },
  cardWrapper: {
    position: "relative",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
    transition: "transform 0.3s, box-shadow 0.3s",
  },
  overlay: {
    position: "absolute",
    top: "10px",
    right: "10px",
  },
  congestionBadge: {
    padding: "4px 8px",
    borderRadius: "8px",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#fff",
  },
  footer: {
    marginTop: "50px",
    textAlign: "center",
    color: "#888",
    fontSize: "0.9rem",
  },
};

export default Camaras;
