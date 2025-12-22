import React, { useEffect, useState, useRef } from "react";

const BACKEND_URL = "http://127.0.0.1:8000";

const ALERT_COLORS = {
  asistencia: "#16a34a",
  vehiculo: "#dc2626",
  accidente: "#8b5cf6",
  conos: "#facc15",
};

const NORMAL_BORDER = "#555";

const CameraCard = ({ camId, title }) => {
  const [data, setData] = useState({
    nivel: "Baja",
    nivel_color: "#16a34a",
    vehiculos: 0,
    detenidos: 0,
    alertType: null,
    asistencia: null,
    conos_detectados: false,
  });

  const [online, setOnline] = useState(true);
  const videoRef = useRef(null);

  // Fetch del estado de la cámara
  const fetchData = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/camera/${camId}/status_full`);
      const json = await res.json();

      setOnline(json.status === "online");

      let alertType = null;
      if (json.asistencia_detectada) alertType = "asistencia";
      else if (json.conos_detectados) alertType = "conos";
      else if (json.alerta_vehiculo) alertType = "vehiculo";
      else if (json.accidente_detectado) alertType = "accidente";

      setData({
        nivel: json.nivel,
        nivel_color: json.nivel_color || "#16a34a",
        vehiculos: json.vehiculos,
        detenidos: json.detenidos,
        asistencia: json.asistencia_nombre || null,
        alertType,
        conos_detectados: json.conos_detectados || false,
      });
    } catch (err) {
      console.error(err);
      setOnline(false);
    }
  };

  // Polling del estado cada 10s
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [camId]);

  // 🔹 Forzar carga del stream al montar el componente
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = `${BACKEND_URL}/api/cam/${camId}/stream_low`; // mini video baja calidad
    }
  }, [camId]);

  const borderColor = data.alertType ? ALERT_COLORS[data.alertType] : NORMAL_BORDER;

  const borderStyle = {
    border: online ? `4px solid ${borderColor}` : `2px solid ${NORMAL_BORDER}`,
    borderRadius: "20px",
    boxShadow: data.alertType
      ? `0 8px 20px ${borderColor}55`
      : "0 6px 18px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
    animation:
      data.alertType && data.alertType !== "asistencia"
        ? "borderPulse 1.5s infinite alternate"
        : "none",
  };

  return (
    <div className={`camera-card ${online ? "" : "offline-card"}`} style={borderStyle}>
      <div className="stream-container">
        {online ? (
          <>
            <img
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="stream"
            />

            <div className="camera-title">{data.asistencia ? data.asistencia : title}</div>
            <div className="live-badge">EN VIVO 🔴</div>
            <div className="level-badge" style={{ background: data.nivel_color }}>
              🚦 {data.nivel}
            </div>

            {data.alertType === "vehiculo" && data.detenidos > 0 && (
              <div className="alert-badge vehiculo-alert">
                🚨 {data.detenidos} Vehiculo{data.detenidos > 1 ? "s" : ""} detenido
              </div>
            )}
          </>
        ) : (
          <div className="offline">OFFLINE ❌</div>
        )}
      </div>

      {/* Aquí se mantienen todos los estilos originales */}

      <style>{`
        .camera-card {
          position: relative;
          width: 100%;
          max-width: 420px;
          aspect-ratio: 16 / 9;
          background: linear-gradient(145deg, #031230, #0042b0 90%);
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .offline-card {
          opacity: 0.6;
        }

        .stream-container {
          position: relative;
          width: 100%;
          height: 100%;
          background: #000;
          overflow: hidden;
        }

        .stream {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 20px;
        }

        .offline {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          color: #fff;
          font-weight: 700;
          background: #111827;
        }

        .camera-title {
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.5);
          color: #fff;
          padding: 0.3em 0.8em;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          text-align: center;
          z-index: 10;
        }

        .live-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          padding: 0.3em 0.8em;
          font-size: 0.8rem;
          font-weight: 700;
          color: #fff;
          background-color: #dc2626;
          border-radius: 12px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }

        .level-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 0.3em 0.8em;
          font-size: 0.8rem;
          font-weight: 700;
          color: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          text-shadow: 0 0 4px rgba(0,0,0,0.3);
          animation: pulse 2s infinite alternate;
          transition: all 0.3s ease;
        }

@keyframes glowPulse {
  0% {
    box-shadow: 0 0 8px #dc2626aa, 0 0 14px #ef4444aa, 0 0 20px #f87171aa;
    transform: translateX(-50%) scale(1);
  }
  50% {
    box-shadow: 0 0 12px #dc2626cc, 0 0 18px #ef4444cc, 0 0 24px #f87171cc;
    transform: translateX(-50%) scale(1.05);
  }
  100% {
    box-shadow: 0 0 8px #dc2626aa, 0 0 14px #ef4444aa, 0 0 20px #f87171aa;
    transform: translateX(-50%) scale(1);
  }
}


        @keyframes pulse {
          0% { transform: translateY(0px) scale(1); opacity: 0.85; }
          50% { transform: translateY(-2px) scale(1.05); opacity: 1; }
          100% { transform: translateY(0px) scale(1); opacity: 0.85; }
        }

        @keyframes glowPulse {
          0% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.05); }
          100% { transform: translateX(-50%) scale(1); }
        }

        @keyframes borderPulse {
          0% { box-shadow: 0 8px 20px ${borderColor}55; }
          50% { box-shadow: 0 8px 28px ${borderColor}88; }
          100% { box-shadow: 0 8px 20px ${borderColor}55; }
        }

        @media (max-width: 480px) {
          .camera-title, .live-badge, .level-badge, .alert-badge {
            font-size: 0.7rem;
            padding: 0.25em 0.6em;
          }
        }
      `}</style>
    </div>
  );
};

export default CameraCard;
