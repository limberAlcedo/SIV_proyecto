import React, { useEffect, useState } from "react";

const VEHICLE_MEDIUM = 5;
const VEHICLE_HIGH = 10;
const BACKEND_URL = "http://127.0.0.1:8000";

const CameraCard = ({ camId, title }) => {
  const [vehicles, setVehicles] = useState(0);
  const [online, setOnline] = useState(true);
  const [detenidos, setDetenidos] = useState(0);

  const updateData = async () => {
    try {
      const [statusRes, congestionRes, detenidosRes] = await Promise.all([
        fetch(`${BACKEND_URL}/camera/${camId}/status`).then((r) => r.json()),
        fetch(`${BACKEND_URL}/camera/${camId}/congestion`).then((r) => r.json()),
        fetch(`${BACKEND_URL}/camera/${camId}/detenidos`).then((r) => r.json()),
      ]);
      setOnline(statusRes.status === "online");
      if (statusRes.status === "online") {
        setVehicles(congestionRes.vehiculos || 0);
        setDetenidos(detenidosRes.detenidos || 0);
      }
    } catch {
      setOnline(false);
    }
  };

  useEffect(() => {
    updateData();
    const interval = setInterval(updateData, 4000);
    return () => clearInterval(interval);
  }, [camId]);

  // Nivel de congestión
  let nivel = "Baja";
  let color = "#16a34a";
  if (vehicles > VEHICLE_HIGH) {
    nivel = "Alta";
    color = "#dc2626";
  } else if (vehicles > VEHICLE_MEDIUM) {
    nivel = "Media";
    color = "#facc15";
  }

  return (
    <div style={{ ...styles.card, opacity: online ? 1 : 0.7 }}>
      {/* Header */}
      <div style={styles.header}>
        <h5 style={styles.title}>{title}</h5>
      </div>

      {/* Badges */}
      {online && (
        <div style={styles.badgeContainer}>
          <div style={styles.liveBadge}>EN VIVO 🔴</div>
          <div style={{ ...styles.badge, backgroundColor: color, marginLeft: "auto" }}>
            🚗 {nivel}
          </div>
        </div>
      )}

      {/* Video o placeholder */}
      <div style={styles.streamContainer}>
        {online ? (
          <img
            src={`${BACKEND_URL}/camera/${camId}/stream`}
            alt={title}
            style={styles.stream}
          />
        ) : (
          <div style={styles.offline}>OFFLINE ❌</div>
        )}
      </div>

      {/* Alerta de vehículos detenidos */}
      {online && detenidos > 0 && (
        <div style={styles.alertBadge}>
          🚨 {detenidos} vehículo{detenidos > 1 ? "s" : ""} detenido
        </div>
      )}
    </div>
  );
};

const styles = {
  card: {
    position: "relative",
    borderRadius: "20px",
    background: "linear-gradient(145deg, rgba(4,15,40,0.95), rgba(0,188,212,0.25))",
    overflow: "hidden",
    backdropFilter: "blur(8px)",
    transition: "all 0.3s ease",
    cursor: "pointer",
    width: "100%",
    height: "280px",
    minWidth: "340px",
    maxWidth: "400px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
  },
  header: {
    display: "flex",
    justifyContent: "center",
    background: "linear-gradient(90deg, #0284c7, #1e3a8a)",
    color: "#fff",
    padding: "10px 12px",
    fontWeight: 700,
    borderTopLeftRadius: "20px",
    borderTopRightRadius: "20px",
    textShadow: "0 0 5px rgba(0,0,0,0.4)",
  },
  title: {
    margin: 0,
    fontSize: "1.1rem",
    letterSpacing: "0.5px",
  },
  badgeContainer: {
    position: "absolute",
    top: "6px", 
    left: "12px",
    right: "12px",
    display: "flex",
    alignItems: "center",
  },
  liveBadge: {
    padding: "4px 10px", 
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#fff",
    backgroundColor: "#e53935",
    boxShadow: "0 0 8px #e53935, 0 0 14px #e53935aa",
    animation: "pulse 1.4s infinite",
  },
  badge: {
    padding: "4px 10px", 
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#fff",
    boxShadow: "0 0 8px rgba(0,0,0,0.4)",
  },
  streamContainer: {
    width: "100%",
    height: "calc(100% - 45px)",
    backgroundColor: "#000",
  },
  stream: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "0 0 20px 20px",
  },
  offline: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    color: "#fff",
    fontWeight: 600,
    fontSize: "1rem",
    background: "linear-gradient(180deg, #1f2937, #111827)",
  },
  alertBadge: {
    position: "absolute",
    bottom: "14px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "rgba(220, 38, 38, 0.9)",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "14px",
    fontWeight: 700,
    fontSize: "0.9rem",
    animation: "blink 1.2s infinite",
    boxShadow: "0 0 18px rgba(255, 0, 0, 0.8)",
  },
};

// Animaciones CSS
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(1.06); }
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    .camera-card:hover {
      transform: scale(1.02);
      box-shadow: 0 12px 25px rgba(0,191,255,0.35);
    }
  `;
  document.head.appendChild(style);
}

export default CameraCard;
