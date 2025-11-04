// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Badge } from "react-bootstrap";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';

const cameras = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  title: `Cámara ${i + 1}`,
}));

const Dashboard = ({ setModalOpened }) => {
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

  const handleOpenModal = (camId) => setModalOpened(true);
  const handleCloseModal = () => setModalOpened(false);

  return (
    <Container fluid className="dashboard-bg py-4">
      {/* Header */}
      <header className="text-center mb-5">
        <h2 className="fw-bold neon-text mb-2">Dashboard de Cámaras Inteligentes</h2>
        <p className="text-muted fs-6">Monitoreo en tiempo real de vehículos con alertas automáticas mediante IA</p>
      </header>

      {/* KPIs */}
      <Row className="g-4 justify-content-center mb-5">
        <Col xs={6} sm={3}>
          <div className="kpi-card shadow-sm p-3 rounded text-center">
            <h6 className="text-secondary">Cámaras activas</h6>
            <p className="kpi-value display-6 text-primary">{camerasActive}/{cameras.length}</p>
          </div>
        </Col>
        <Col xs={6} sm={3}>
          <div className="kpi-card shadow-sm p-3 rounded text-center">
            <h6 className="text-secondary">Total de incidentes</h6>
            <p className="kpi-value display-6 text-danger">{totalIncidents}</p>
          </div>
        </Col>
        <Col xs={6} sm={3}>
          <div className="kpi-card shadow-sm p-3 rounded text-center">
            <h6 className="text-secondary">Flujo aprox.</h6>
            <p className="kpi-value display-6 text-success">{cameras.reduce((acc, cam) => acc + (congestion[cam.id] ? 5 : 0), 0)} / min</p>
          </div>
        </Col>
        <Col xs={6} sm={3}>
          <div className="kpi-card shadow-sm p-3 rounded text-center">
            <h6 className="text-secondary">Alertas recientes</h6>
            <p className="kpi-value display-6 text-warning">{floatingAlerts.length}</p>
          </div>
        </Col>
      </Row>

      {/* Grid de cámaras */}
      <Row className="g-4">
        {cameras.map(cam => (
          <Col key={cam.id} xs={12} sm={6} lg={3}>
            <div
              className="camera-card shadow-sm rounded overflow-hidden"
              onClick={() => handleOpenModal(cam.id)}
            >
              <div className="camera-wrapper position-relative">
                <img
                  src={`${baseUrl}/camera/${cam.id}/mini`}
                  className="camera-video w-100"
                  alt={`Cámara ${cam.id}`}
                />
                <Badge className="live-badge position-absolute top-2 start-2 bg-danger text-white">EN VIVO</Badge>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* CSS interno */}
      <style>{`
        .dashboard-bg {
          background: #1e1e2f;
          color: #fff;
          min-height: 100vh;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .neon-text {
          color: #00f0ff;
          text-shadow: 0 0 5px #00f0ff, 0 0 10px #00f0ff, 0 0 20px #00f0ff, 0 0 30px #00f0ff;
        }

        .kpi-card {
          background: #2a2a3f;
          transition: transform 0.2s, box-shadow 0.2s;
          text-align: center;
        }
        .kpi-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.4);
        }
        .kpi-card h6 {
          font-size: 0.9rem;
          color: #a0a0b0;
          margin-bottom: 0.5rem;
        }
        .kpi-value {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0;
        }

        .camera-card {
          cursor: pointer;
          background: #2a2a3f;
          border-radius: 0.75rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .camera-card:hover {
          transform: scale(1.03);
          box-shadow: 0 8px 25px rgba(0,0,0,0.5);
        }

        .camera-wrapper {
          position: relative;
        }

        .camera-video {
          display: block;
          width: 100%;
          height: auto;
          border-radius: 0.5rem;
          object-fit: cover;
        }

        .live-badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
        }

        @media (max-width: 768px) {
          .kpi-value { font-size: 1.5rem; }
        }
        @media (max-width: 576px) {
          .kpi-card { padding: 0.75rem; }
          .kpi-value { font-size: 1.3rem; }
        }
      `}</style>
    </Container>
  );
};

export default Dashboard;
