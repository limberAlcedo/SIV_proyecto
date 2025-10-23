import React, { useState, useEffect } from "react";
import Card from "react-bootstrap/Card";
import Modal from "react-bootstrap/Modal";
import axios from "axios";

const CameraCard = ({ title, camId }) => {
  const [showModal, setShowModal] = useState(false);
  const [isCongested, setIsCongested] = useState(false);
  const baseUrl = "http://127.0.0.1:8030"; // backend FastAPI

  // 🔹 Chequear congestión desde backend cada 2 segundos
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${baseUrl}/camera/${camId}/congestion`);
        setIsCongested(res.data.congestion);
      } catch (err) {
        console.error(err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [camId]);

  return (
    <>
      <Card
        className="mb-4 shadow-lg camera-card"
        onClick={() => setShowModal(true)}
      >
        <div className="position-relative">
          <div className="live-badge">EN VIVO</div>

          {isCongested && (
            <div className="congestion-badge">🚨 CONGESTIÓN 🚨</div>
          )}

          {/* Video en vivo */}
          <video
            src={`${baseUrl}/camera/${camId}.mp4`} // si quieres streaming tipo MJPEG, cambia por /stream
            autoPlay
            muted
            loop
            className="camera-img"
          />
        </div>
        <Card.Body className="text-center">
          <Card.Title className="camera-title">{title}</Card.Title>
        </Card.Body>
      </Card>

      {/* Modal para ver cámara grande */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="xl"
        centered
        backdropClassName="custom-backdrop"
      >
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex justify-content-center">
          <video
            src={`${baseUrl}/camera/${camId}.mp4`}
            autoPlay
            muted
            loop
            style={{ width: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: "12px" }}
          />
        </Modal.Body>
      </Modal>

      {/* CSS Global */}
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
          height: 220px;
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
    </>
  );
};

export default CameraCard;
