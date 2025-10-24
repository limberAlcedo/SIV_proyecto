// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Badge, Modal, ProgressBar } from "react-bootstrap";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';

const cameras = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  title: `Cámara ${i + 1}`,
}));

const Dashboard = ({ setModalOpened }) => {
  const [showModal, setShowModal] = useState(null);
  const [congestion, setCongestion] = useState({});
  const [alerts, setAlerts] = useState({});
  const [floatingAlerts, setFloatingAlerts] = useState([]);
  const baseUrl = "http://127.0.0.1:8000";

  useEffect(() => {
    const interval = setInterval(() => {
      cameras.forEach(async (cam) => {
        try {
          const resC = await axios.get(`${baseUrl}/camera/${cam.id}/congestion`);
          const resA = await axios.get(`${baseUrl}/camera/${cam.id}/alerts`);

          setCongestion(prev => ({ ...prev, [cam.id]: resC.data.congestion }));
          setAlerts(prev => ({ ...prev, [cam.id]: resA.data.alerts }));

          // Actualizar alertas flotantes
          const newAlerts = resA.data.alerts?.map(a => ({
            camId: cam.id,
            tipo: a.tipo,
            timestamp: a.timestamp,
            id: `${cam.id}-${a.timestamp}-${Math.random()}`
          })) || [];
          setFloatingAlerts(prev => [...prev, ...newAlerts].slice(-10));
        } catch (err) {
          console.error(err);
        }
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const totalIncidents = Object.values(alerts).flat().length;
  const camerasActive = cameras.filter(cam => congestion[cam.id] !== undefined).length;

  const handleOpenModal = (camId) => {
    setShowModal(camId);
    setModalOpened(true);
  };

  const handleCloseModal = () => {
    setShowModal(null);
    setModalOpened(false);
  };

  return (
    <Container fluid className="dashboard-bg" style={{ minHeight: "100vh", padding: "2rem" }}>
      {/* Header */}
      <header className="text-center mb-4">
        <h2 className="fw-bold neon-text">Dashboard de Cámaras Inteligentes</h2>
        <p className="text-muted">Monitoreo en tiempo real con alertas automáticas de vehículos mediante IA (YOLOv8)</p>
      </header>

      {/* KPIs */}
      <div className="kpi-container mb-4">
        <Row className="g-3 justify-content-center">
          <Col xs={6} sm={3}>
            <div className="kpi-card">
              <h6>Cámaras operativas</h6>
              <p className="kpi-value">{camerasActive} / {cameras.length}</p>
            </div>
          </Col>
          <Col xs={6} sm={3}>
            <div className="kpi-card">
              <h6>Total de incidentes</h6>
              <p className="kpi-value">{totalIncidents}</p>
            </div>
          </Col>
          <Col xs={6} sm={3}>
            <div className="kpi-card">
              <h6>Flujo de vehículos</h6>
              <p className="kpi-value">{cameras.reduce((acc, cam) => acc + (congestion[cam.id] ? 5 : 0), 0)} / min aprox.</p>
            </div>
          </Col>
          <Col xs={6} sm={3}>
            <div className="kpi-card">
              <h6>Alertas recientes</h6>
              <p className="kpi-value">{floatingAlerts.length}</p>
            </div>
          </Col>
        </Row>
      </div>

      {/* Grid de cámaras */}
      <Row className="g-4">
        {cameras.map(cam => {
          const isCongested = congestion[cam.id] || false;
          return (
            <Col key={cam.id} xs={12} sm={6} lg={3}>
              <div
                className={`camera-card shadow-lg ${isCongested ? "congested" : "normal"}`}
                onClick={() => handleOpenModal(cam.id)}
              >
                <div className="camera-wrapper">
                  <img
                    src={`${baseUrl}/camera/${cam.id}/stream`}
                    className="camera-video"
                    alt={`Cámara ${cam.id}`}
                  />
                  <div className="badges">
                    <Badge className="live-badge">EN VIVO</Badge>
                    {isCongested && <Badge className="congestion-badge">🚨 CONGESTIÓN 🚨</Badge>}
                    {alerts[cam.id] && alerts[cam.id].length > 0 && (
                      <Badge className="alerts-badge">{alerts[cam.id].length} incidente{alerts[cam.id].length > 1 ? "s" : ""}</Badge>
                    )}
                  </div>
                </div>
                <div className="card-body text-center">
                  <h5>{cam.title}</h5>
                  {isCongested && (
                    <ProgressBar
                      now={100}
                      animated
                      variant="danger"
                      className="mt-2"
                      style={{ height: "6px", borderRadius: "4px" }}
                    />
                  )}
                </div>
              </div>
            </Col>
          );
        })}
      </Row>

      {/* Modal con cámara grande */}
      <Modal
        show={!!showModal}
        onHide={handleCloseModal}
        size="xl"
        centered
        backdropClassName="custom-backdrop"
      >
        <Modal.Body className="d-flex justify-content-center align-items-center p-0">
          {showModal && (
            <img
              src={`${baseUrl}/camera/${showModal}/stream`}
              style={{
                width: "90%",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: "12px",
                border: "2px solid #ff0000",
                boxShadow: "0 0 25px #ff0000"
              }}
              alt={`Cámara ${showModal}`}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Alertas flotantes */}
      <div className="floating-alerts">
        {floatingAlerts.map(alert => (
          <div key={alert.id} className="floating-alert">
            Cam {alert.camId}: {alert.tipo}
          </div>
        ))}
      </div>

      {/* CSS interno */}
      <style>{`
        .dashboard-bg {
          min-height: 100vh;
          background: radial-gradient(circle at 20% 30%, #0f0f1a, #050515);
          background-size: 400% 400%;
          animation: gradientAnimation 15s ease infinite;
        }
        @keyframes gradientAnimation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* KPIs */
        .kpi-container { display: flex; justify-content: center; flex-wrap: wrap; gap: 1rem; }
        .kpi-card {
          background: linear-gradient(145deg, #0a0a0a, #1a1a1a);
          border-radius: 12px;
          padding: 1rem;
          text-align: center;
          box-shadow: 0 0 15px rgba(255,0,0,0.3);
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .kpi-card:hover { transform: translateY(-5px); box-shadow: 0 0 25px rgba(255,0,0,0.6); }
        .kpi-card h6 { font-weight: bold; color: #ff0000; margin-bottom: 0.5rem; text-shadow: 0 0 5px #ff0000; }
        .kpi-value { font-size: 1.5rem; font-weight: bold; color: #fff; text-shadow: 0 0 5px #ff0000; }

        /* Tarjetas de cámara */
        .camera-card {
          border-radius: 15px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.3s, box-shadow 0.3s, border 0.3s;
          background: linear-gradient(145deg, #0a0a0a, #1a1a1a);
          color: #fff;
          border: 3px solid transparent;
        }
        .camera-card.normal {
          border: 3px solid #00ffcc;
          box-shadow: 0 0 15px #00ffcc;
        }
        .camera-card.congested {
          border: 3px solid #ff0000;
          box-shadow: 0 0 15px #ff0000;
        }
        .camera-card:hover { transform: translateY(-8px); box-shadow: 0 15px 25px rgba(255,0,0,0.4); }
        .camera-wrapper { position: relative; border-radius: 12px; overflow: hidden; }
        .camera-video { width: 100%; height: 200px; object-fit: cover; filter: brightness(0.9); }

        /* Badges */
        .badges { position: absolute; top: 10px; left: 10px; display: flex; flex-direction: column; gap: 5px; }
        .live-badge { background: linear-gradient(90deg, #ff0000, #cc0000); box-shadow: 0 0 6px #ff0000, 0 0 12px #cc0000; font-weight: bold; color: #fff; border-radius: 8px; padding: 4px 10px; font-size: 0.85rem; }
        .congestion-badge { background: linear-gradient(90deg, #ff4500, #ff0000); animation: blink 1s infinite; color:#fff; font-weight:bold; border-radius:8px; padding:4px 10px; }
        .alerts-badge { background: linear-gradient(90deg, #ffcc00, #ffaa00); color:#fff; font-weight:bold; border-radius:8px; padding:4px 10px; }
        @keyframes blink { 0%,50%,100% { opacity:1; } 25%,75% { opacity:0.4; } }

        /* Modal */
        .custom-backdrop { backdrop-filter: blur(10px) brightness(0.3); background-color: rgba(0,0,0,0.7) !important; }

        /* Neon Text */
        .neon-text { color: #ff0000; text-shadow: 0 0 5px #ff0000, 0 0 10px #ff0000; }

        /* Alertas flotantes */
        .floating-alerts { position: fixed; top: 1rem; right: 1rem; z-index: 9999; display: flex; flex-direction: column; gap: 0.5rem; }
        .floating-alert { background: rgba(255,0,0,0.8); padding: 0.5rem 1rem; border-radius: 8px; color: #fff; font-weight: bold; box-shadow: 0 0 10px #ff0000; animation: floatAlert 3s ease-in-out; }
        @keyframes floatAlert { 0% { transform: translateX(100px); opacity:0; } 50% { opacity:1; } 100% { transform: translateX(0); opacity:1; } }
      `}</style>
    </Container>
  );
};

export default Dashboard;
