import React, { useEffect, useState } from "react";

const VEHICLE_MEDIUM = 5;
const VEHICLE_HIGH = 10;
const BACKEND_URL = "http://127.0.0.1:8000";

const CameraCard = ({ camId, title }) => {
  const [vehicles, setVehicles] = useState(0);
  const [online, setOnline] = useState(true);
  const [detenidos, setDetenidos] = useState(0);

  // 🔌 Verificar si la cámara está online
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const data = await fetch(`${BACKEND_URL}/camera/${camId}/status`).then(res => res.json());
        setOnline(data.status === "online");
      } catch (err) {
        setOnline(false);
      }
    };
    checkStatus();
    const intervalStatus = setInterval(checkStatus, 5000);
    return () => clearInterval(intervalStatus);
  }, [camId]);

  // 🚗 Obtener conteo de vehículos
  useEffect(() => {
    if (!online) return;
    const interval = setInterval(async () => {
      try {
        const data = await fetch(`${BACKEND_URL}/camera/${camId}/congestion`).then(res => res.json());
        setVehicles(data.vehiculos);
      } catch (err) {
        console.error(err);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [camId, online]);

  // 🛑 Obtener cantidad de vehículos detenidos
  useEffect(() => {
    if (!online) return;
    const interval = setInterval(async () => {
      try {
        const data = await fetch(`${BACKEND_URL}/camera/${camId}/detenidos`).then(res => res.json());
        setDetenidos(data.detenidos || 0);
      } catch (err) {
        console.error(err);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [camId, online]);

  // 🧭 Determinar nivel de congestión
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
    <div style={{ ...styles.cardWrapper, opacity: online ? 1 : 0.5 }}>
      <h5 style={styles.title}>{title}</h5>

      {/* 🔴 Badge EN VIVO */}
      {online && (
        <div style={styles.liveBadge}>
          EN VIVO 🔴
        </div>
      )}

      {/* 🖼️ Stream o estado offline */}
      {online ? (
        <img
          src={`${BACKEND_URL}/camera/${camId}/stream`}
          alt={title}
          style={{ width: "100%", display: "block" }}
        />
      ) : (
        <div style={styles.offlineContainer}>
          OFFLINE ❌
        </div>
      )}

      {/* 🚦 Badge congestión */}
      {online && (
        <div style={{ ...styles.congestionBadge, backgroundColor: color }}>
          🚗 {nivel}
        </div>
      )}

      {/* 🛑 Badge de vehículos detenidos */}
      {online && detenidos > 0 && (
        <div style={styles.alertBadge}>
          🚨 {detenidos} vehículo{detenidos > 1 ? "s" : ""} detenido
        </div>
      )}
    </div>
  );
};

// 🎨 Estilos visuales
const styles = {
  cardWrapper: {
    position: "relative",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
    transition: "transform 0.3s, box-shadow 0.3s",
  },
  title: {
    textAlign: "center",
    margin: 0,
    padding: "10px",
    background: "linear-gradient(90deg, #00bcd4, #1e3a8a)",
    color: "#fff",
    fontWeight: 700,
    textShadow: "0 0 6px rgba(0,0,0,0.5)",
  },
  liveBadge: {
    position: "absolute",
    top: "10px",
    left: "8px",
    padding: "3px 10px",
    borderRadius: "10px",
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#fff",
    backgroundColor: "#e53935",
    boxShadow: "0 0 6px #e53935, 0 0 12px #e53935aa",
    textShadow: "0 0 3px #fff",
    backdropFilter: "blur(1.5px)",
    animation: "pulse 1.5s infinite",
  },
  congestionBadge: {
    position: "absolute",
    top: "10px",
    right: "10px",
    padding: "4px 10px",
    borderRadius: "14px",
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#fff",
    textAlign: "center",
    boxShadow: "0 0 10px rgba(0,0,0,0.5)",
  },
  alertBadge: {
    position: "absolute",
    bottom: "10px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "rgba(220, 38, 38, 0.9)",
    color: "#fff",
    padding: "6px 14px",
    borderRadius: "10px",
    fontWeight: 700,
    fontSize: "0.8rem",
    animation: "blink 1.2s infinite",
    boxShadow: "0 0 12px rgba(255, 0, 0, 0.7)",
  },
  offlineContainer: {
    width: "100%",
    height: "200px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#333",
    color: "#fff",
    fontWeight: "bold",
  },
};

// 🔄 Animaciones CSS
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.75; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  `;
  document.head.appendChild(style);
}

export default CameraCard;
