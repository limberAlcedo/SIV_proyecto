import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CameraCard from "../components/CameraCard";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, Camera } from "lucide-react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import "../styles/Camaras.css";

// ================= IMPORTAR FUNCIONES API =================
import { getCameraStatus, startCamera, stopCamera } from "../api/api.js";

// ================= CONSTANTES =================
const ALERT_COLORS = {
  vehiculo: "#ef4444",
  asistencia: "#10b981",
  personas: "#f97316",
  accidente: "#8b5cf6",
};

// URL backend (usar variable de entorno si existe)
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://3.93.58.208:8000";

export default function Camaras() {
  const navigate = useNavigate();

  // ================= ESTADOS =================
  const [alerts, setAlerts] = useState(0);             // Número total de alertas
  const [flow, setFlow] = useState(0);                 // Flujo estimado de vehículos
  const [activeCameras, setActiveCameras] = useState(0); // Número de cámaras online
  const [focusedCam, setFocusedCam] = useState(null);    // Cámara enfocada (fullscreen)
  const [cameraStatus, setCameraStatus] = useState({});  // Estado de cada cámara

  const videoRef = useRef(null); // Referencia al video fullscreen (por si se quiere grabar)

  // Lista de cámaras
  const cameras = [
    { id: 1, title: "CCTV 1.1" },
    { id: 2, title: "CCTV 1.2" },
    { id: 3, title: "CCTV 1.3" },
    { id: 4, title: "CCTV 1.4" },
    { id: 5, title: "CCTV 1.5" },
    { id: 6, title: "CCTV 1.6" },
  ];

  // ================= AUTENTICACIÓN =================
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) navigate("/"); // Redirigir al login si no hay usuario
  }, [navigate]);

  // ================= FETCH RAPIDO DE CÁMARAS Y ALERTAS =================
  useEffect(() => {
    const fetchStatus = async () => {
      let totalAlerts = 0;
      let onlineCount = 0;
      const statusMap = {};

      await Promise.all(
        cameras.map(async (cam) => {
          try {
            const res = await fetch(`${BACKEND_URL}/api/camera/${cam.id}/status_full`);
            const json = await res.json();

            // Determinar tipo de alerta (ejemplo)
            const alertType = json.detenidos > 0 ? "vehiculo" : null;

            statusMap[cam.id] = {
              status: json.status,
              alertType,
              nivel: json.nivel,
              vehiculos: json.vehiculos,
              detenidos: json.detenidos,
              asistencia: json.asistencia_detectada || false,
            };

            if (json.status === "online") {
              onlineCount++;
              if (alertType) totalAlerts++;
            }
          } catch (err) {
            console.error("Error cámara:", cam.id, err);
          }
        })
      );

      setCameraStatus(statusMap);
      setActiveCameras(onlineCount);
      setAlerts(totalAlerts);
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Cada 5s
    return () => clearInterval(interval);
  }, [cameras]);

  // ================= FLUJO ESTIMADO =================
  useEffect(() => {
    const fetchFlow = async () => {
      let flowActual = 0;
      let onlineCount = 0;

      await Promise.all(
        cameras.map(async (cam) => {
          try {
            const res = await fetch(`${BACKEND_URL}/api/camera/${cam.id}/status_full`);
            const json = await res.json();
            if (json.status === "online") {
              onlineCount++;
              flowActual += json.vehiculos || 0;
            }
          } catch (err) {
            console.error(err);
          }
        })
      );

      if (onlineCount > 0) flowActual = flowActual / onlineCount;
      setFlow(prev => Math.round(prev * 0.7 + flowActual * 0.3)); // suavizado
    };

    fetchFlow();
    const interval = setInterval(fetchFlow, 300000); // 5 min
    return () => clearInterval(interval);
  }, [cameras]);

  // ================= INICIAR / DETENER YOLO =================
  useEffect(() => {
    // Inicia todas las cámaras al montar el componente
    cameras.forEach(cam => {
      fetch(`${BACKEND_URL}/api/camara/${cam.id}/start`, { method: "POST" })
        .catch(err => console.error("Error al iniciar cámara:", err));
    });

    // Detiene todas al desmontar
    return () => {
      cameras.forEach(cam => {
        fetch(`${BACKEND_URL}/api/camara/${cam.id}/stop`, { method: "POST" })
          .catch(err => console.error("Error al detener cámara:", err));
      });
    };
  }, []);

  // ================= RENDER =================
  return (
    <motion.div
      className="camara-page d-flex flex-column align-items-center min-vh-100 text-white p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <ToastContainer />

      <Container className="text-center mb-4">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-4"
        >
          🚦 Sistema de Detección Vehicular
        </motion.h1>

        <Row className="justify-content-center g-3 mb-4">
          <Col xs={12} sm={6} md={4}>
            <KpiCard
              icon={<Camera size={28} />}
              label="Cámaras activas"
              value={`${activeCameras} / ${cameras.length}`}
              gradient={["#3b82f6", "#2563eb"]}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <AlertKpi alerts={alerts} />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <KpiCard
              icon={<Activity size={28} />}
              label="Flujo estimado"
              value={`${flow} / min`}
              gradient={["#34d399", "#10b981"]}
            />
          </Col>
        </Row>
      </Container>

      {/* GRID DE CÁMARAS */}
      <Container fluid className={focusedCam ? "blurred-grid" : ""}>
        <Row className="g-3 justify-content-center">
          {cameras.map(cam => (
            <Col key={cam.id} xs={12} sm={6} md={4} lg={3}>
              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.25 }}
                onClick={() => setFocusedCam(cam)}
              >
                <CameraCard
                  title={cam.title}
                  camId={cam.id}
                  alertColor={ALERT_COLORS[cameraStatus[cam.id]?.alertType]}
                  alertType={cameraStatus[cam.id]?.alertType}
                  nivel={cameraStatus[cam.id]?.nivel}
                  vehiculos={cameraStatus[cam.id]?.vehiculos}
                  detenidos={cameraStatus[cam.id]?.detenidos}
                  asistencia={cameraStatus[cam.id]?.asistencia}
                />
              </motion.div>
            </Col>
          ))}
        </Row>
      </Container>

      {/* FULLSCREEN */}
      {focusedCam && (
        <motion.div className="fullscreen-wrapper d-flex justify-content-center align-items-center">
          <motion.div
            className="fullscreen-content position-relative d-flex justify-content-center align-items-center"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <img
              ref={videoRef}
              src={`${BACKEND_URL}/api/cam/${focusedCam.id}/stream`}
              className="fullscreen-img"
              alt={focusedCam.title}
            />
            <Button
              variant="light"
              className="close-btn position-absolute"
              onClick={() => setFocusedCam(null)}
            >
              ✕
            </Button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ================= COMPONENTES AUXILIARES =================
const KpiCard = ({ icon, label, value, gradient }) => (
  <motion.div
    className="kpi-card text-center p-3 rounded-3"
    style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
    whileHover={{ scale: 1.05 }}
  >
    {icon}
    <h5 className="mt-2">{label}</h5>
    <p className="fs-4 fw-bold mt-1">{value}</p>
  </motion.div>
);

const AlertKpi = ({ alerts }) => (
  <motion.div
    className="kpi-card text-center p-3 rounded-3"
    style={{
      border: alerts > 0 ? "3px solid #ef4444" : "2px solid rgba(255,255,255,0.2)",
      background: alerts > 0 ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)",
      color: alerts > 0 ? "#ef4444" : "#9ca3af",
    }}
    animate={alerts > 0 ? { scale: [1, 1.1, 1], rotate: [0, 2, -2, 0] } : {}}
    transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
  >
    <AlertTriangle size={28} />
    <h5 className="mt-2">Alertas</h5>
    <p className="fs-3 fw-bold mt-1">{alerts}</p>
  </motion.div>
);
