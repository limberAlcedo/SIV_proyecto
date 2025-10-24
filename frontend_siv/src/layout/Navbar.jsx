import React from "react";
import { Navbar, Container, Nav, Button, Dropdown } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "#camaras", label: "Cámaras" },
  { href: "#reportes", label: "Reportes" },
  { href: "#configuracion", label: "Configuración" },
];

const AppNavbar = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top" className="shadow-sm">
      <Container fluid>
        {/* Brand */}
        <Navbar.Brand
          href="/"
          className="fw-bold text-uppercase"
          style={{ letterSpacing: "1px" }}
        >
          SIV 2.0 Dashboard
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar" />

        <Navbar.Collapse id="main-navbar">
          <Nav className="ms-auto align-items-center">
            {navLinks.map(link => (
              <Nav.Link key={link.href} href={link.href}>
                {link.label}
              </Nav.Link>
            ))}

            {/* Botón Login futurista */}
            <Button
              className="ms-2 fw-bold"
              style={{
                background: "linear-gradient(90deg, #ff9500, #ffaa33)",
                color: "#fff",
                border: "none",
                borderRadius: "50px",
                boxShadow: "0 0 6px #ff9500, 0 0 12px #ffaa33",
                transition: "all 0.3s ease, color 0.3s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = "0 0 12px #ff9500, 0 0 18px #ffaa33";
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.color = "#000";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = "0 0 6px #ff9500, 0 0 12px #ffaa33";
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.color = "#fff";
              }}
              onClick={() => alert("Login clickeado")}
            >
              Login
            </Button>

            {/* Dropdown de perfil usando un emoji */}
            <Dropdown align="end" className="ms-3">
              <Dropdown.Toggle
                variant="dark"
                id="dropdown-user"
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "1.5rem",
                }}
              >
                👤
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item href="#perfil">Mi Perfil</Dropdown.Item>
                <Dropdown.Item href="#config">Configuración</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item href="#logout">Cerrar sesión</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
