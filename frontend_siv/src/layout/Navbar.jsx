import React from "react";
import { Navbar, Container, Nav } from "react-bootstrap";

const AppNavbar = () => {
  return (
    <Navbar
      bg="dark"
      variant="dark"
      expand="lg"
      sticky="top"
      className="shadow-sm"
    >
      <Container>
        <Navbar.Brand
          href="/"
          className="fw-bold text-uppercase"
          style={{ letterSpacing: "1px" }}
        >
          SIV 2.0 Dashboard
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          <Nav className="ms-auto">
            <Nav.Link href="/">Inicio</Nav.Link>
            <Nav.Link href="#camaras">Cámaras</Nav.Link>
            <Nav.Link href="#reportes">Reportes</Nav.Link>
            <Nav.Link href="#configuracion">Configuración</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
