import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';

const Footer = () => {
  const [glow, setGlow] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setGlow(prev => !prev), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Contenido principal vacío para empujar el footer */}
      <main style={{ flex: 1 }}></main>

      {/* Footer */}
      <footer
        className="bg-dark py-3 mt-auto"
        style={{ boxShadow: "0 -2px 10px rgba(255, 165, 0, 0.3)", textAlign: "center" }}
      >
        <Container fluid className="px-3">
          <span
            style={{
              background: "linear-gradient(90deg, #ff9500, #ffaa33)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: "600",
              fontSize: "1rem",
              textShadow: glow
                ? "0 0 8px #ff9500, 0 0 12px #ffaa33"
                : "0 0 4px #ff9500, 0 0 6px #ffaa33",
              transition: "all 0.5s ease",
            }}
          >
            © 2025 CCTV Dashboard
          </span>
        </Container>
      </footer>
    </div>
  );
};

export default Footer;
