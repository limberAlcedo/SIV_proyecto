import React from "react";
import { Container } from "react-bootstrap";
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";
import "./../styles/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <Container className="footer-container">
        <div className="footer-brand">
          <p>© {new Date().getFullYear()} Todos los derechos reservados</p>
        </div>

        <div className="footer-middle">
          <p>🔒 Seguridad y control en tiempo real</p>
        </div>

        <div className="footer-icons">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
          >
            <FaGithub />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
          >
            <FaLinkedin />
          </a>
          <a href="mailto:someone@example.com" aria-label="Email">
            <FaEnvelope />
          </a>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
///Users/limberalcedo/Desktop/Proyecto/SIV_proyecto/frontend_siv/src/layout/Footer.jsx