// src/layout/Footer.jsx
import React from "react";
import { Container } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const Footer = () => {
  return (
    <footer
      role="contentinfo"
      className="bg-dark text-center py-3 mt-auto position-relative border-top border-warning-subtle"
      style={{
        boxShadow: "0 -2px 10px rgba(255, 165, 0, 0.2)",
      }}
    >
      <Container fluid>
        <small
          className="fw-semibold"
          style={{
            display: "inline-block",
            fontSize: "1rem",
            background: "linear-gradient(90deg, #ff9500, #ffaa33)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "glow 2s ease-in-out infinite alternate",
          }}
        >
          © {new Date().getFullYear()} CCTV Dashboard
        </small>

        <style>
          {`
            @keyframes glow {
              from {
                text-shadow: 0 0 6px #ff9500, 0 0 8px #ffaa33;
              }
              to {
                text-shadow: 0 0 12px #ff9500, 0 0 20px #ffaa33;x
              }
            }
          `}
        </style>
      </Container>
    </footer>
  );
};

export default Footer;
