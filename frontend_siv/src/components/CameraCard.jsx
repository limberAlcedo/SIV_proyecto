// src/components/CameraCard.jsx
import React, { useState, useEffect } from "react";
import Card from "react-bootstrap/Card";
import Modal from "react-bootstrap/Modal";
import axios from "axios";

const CameraCard = ({ title, camId }) => {
  const [showModal, setShowModal] = useState(false);
  const [congestionInfo, setCongestionInfo] = useState({ nivel: "Desconocido", porcentaje: 0, congestion: false });
  const baseUrl = "http://127.0.0.1:8000";

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${baseUrl}/camera/${camId}/congestion`);
        setCongestionInfo(res.data);
      } catch (err) {
        console.error(err);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [camId]);

  const getBadgeClass = (nivel) => {
    switch(nivel) {
      case "Alta": return "congestion-badge alta";
      case "Media": return "congestion-badge media";
      case "Baja": return "congestion-badge baja";
      default: return "congestion-badge desconocida";
    }
  };

  return (
    <>
      <Card className="mb-4 shadow-lg camera-card" onClick={() => setShowModal(true)}>
        <div className="position-relative">
          {/* Mini video */}
          <img
            src={`${baseUrl}/camera/${camId}/mini`}
            alt={title}
            className="camera-img"
          />

          {/* Badge de congestión */}
          <div className={getBadgeClass(congestionInfo.nivel)}>
            🚨 {Math.round(congestionInfo.porcentaje)}%
          </div>
        </div>

        <Card.Body className="text-center">
          <Card.Title className="camera-title">{title}</Card.Title>
        </Card.Body>
      </Card>

      {/* Modal con video completo */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex justify-content-center">
          <img
            src={`${baseUrl}/camera/${camId}/stream`}
            alt={title}
            style={{
              width: "100%",
              maxHeight: "80vh",
              objectFit: "contain",
              borderRadius: "12px",
            }}
          />
        </Modal.Body>
      </Modal>

      {/* Estilos */}
      <style>{`
        .camera-card {
          border-radius: 20px;
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
          height: 180px;
          object-fit: cover;
          border-bottom: 3px solid #dee2e6;
          transition: transform 0.3s;
        }

        .camera-card:hover .camera-img {
          transform: scale(1.03);
        }

        .camera-title {
          color: #495057;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .congestion-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          padding: 6px 10px;
          border-radius: 12px;
          color: #fff;
          z-index: 3;
          box-shadow: 0 0 8px rgba(255,0,0,0.7), 0 0 15px rgba(255,0,0,0.4);
          animation: blink 1.2s infinite;
        }

        .congestion-badge.alta {
          background: linear-gradient(135deg, #ff4d4d, #ff1a1a);
          font-size: 1.2rem;
        }

        .congestion-badge.media {
          background: linear-gradient(135deg, #ffc107, #ffea00);
          font-size: 1.1rem;
        }

        .congestion-badge.baja {
          background: linear-gradient(135deg, #28a745, #63e673);
          font-size: 1rem;
        }

        @keyframes blink {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
};

export default CameraCard;
