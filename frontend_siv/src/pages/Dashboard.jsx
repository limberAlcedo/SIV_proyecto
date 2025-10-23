import React, { useState, useEffect } from "react";
import { Container, Row, Col, Badge, Modal } from "react-bootstrap";
import axios from "axios";

// Configura tus cámaras
const cameras = Array.from({ length: 4 }, (_, i) => ({
  id: i + 1,
  title: `Cámara ${i + 1}`,
}));

const Dashboard = () => {
  const [showModal, setShowModal] = useState(null); // id de cámara abierta
  const [congestion, setCongestion] = useState({}); // congestión por cámara
  const baseUrl = "http://127.0.0.1:8000" // backend FastAPI

  // 🔹 Chequear congestión cada 2 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      cameras.forEach(async (cam) => {
        try {
          const res = await axios.get(`${baseUrl}/camera/${cam.id}/congestion`);
          setCongestion((prev) => ({ ...prev, [cam.id]: res.data.congestion }));
        } catch (err) {
          console.error(err);
        }
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Container style={{ padding: "2rem 0" }}>
      {/* Header */}
      <header className="text-center mb-5">
        <h2 className="fw-bold">Dashboard de Cámaras Inteligentes</h2>
        <p className="text-muted">
          Monitoreo en tiempo real con alertas automáticas de vehículos mediante IA (YOLOv8)
        </p>
      </header>

      {/* Grid de cámaras */}
      <Row className="g-4">
        {cameras.map((cam) => (
          <Col key={cam.id} xs={12} sm={6} lg={3}>
            <div
              className="camera-card shadow-sm"
              onClick={() => setShowModal(cam.id)}
            >
              <div style={{ position: "relative" }}>
                {/* Streaming MJPEG */}
                <img
                  src={`${baseUrl}/camera/${cam.id}/stream`}
                  alt={cam.title}
                  className="camera-img"
                />
                {/* Badge EN VIVO */}
                <Badge className="live-badge">EN VIVO</Badge>
                {/* Badge de congestión */}
                {congestion[cam.id] && <Badge className="congestion-badge">🚨 CONGESTIÓN 🚨</Badge>}
              </div>
              <div className="card-body text-center">
                <h5>{cam.title}</h5>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Modal para ver cámara grande */}
      <Modal
        show={!!showModal}
        onHide={() => setShowModal(null)}
        size="xl"
        centered
        backdropClassName="custom-backdrop"
      >
        <Modal.Header closeButton>
          <Modal.Title>{showModal && cameras.find(c => c.id === showModal).title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex justify-content-center">
          {showModal && (
            <img
              src={`${baseUrl}/camera/${showModal}/stream`}
              alt={`Cam ${showModal}`}
              style={{ width: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: "12px" }}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* CSS global */}
      <style jsx global>{`
        .camera-card {
          border-radius: 15px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.3s, box-shadow 0.3s;
          background: linear-gradient(145deg, #fdfdfd, #eaeaea);
        }
        .camera-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 25px rgba(0, 0, 0, 0.2);
        }
        .camera-img {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-bottom: 3px solid #dee2e6;
          transition: transform 0.3s;
        }
        .camera-card:hover .camera-img {
          transform: scale(1.03);
        }
        .live-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          padding: 5px 12px;
          font-size: 0.85rem;
          font-weight: bold;
          color: #fff;
          border-radius: 8px;
          background: linear-gradient(90deg, #ff6b6b, #f06595);
          z-index: 2;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        .congestion-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 6px 12px;
          font-size: 0.85rem;
          font-weight: bold;
          color: #fff;
          border-radius: 8px;
          background-color: #ff0000;
          z-index: 3;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0.4; }
        }
        .custom-backdrop {
          backdrop-filter: blur(10px);
          background-color: rgba(0, 0, 0, 0.5) !important;
        }
      `}</style>
    </Container>
  );
};

export default Dashboard;
