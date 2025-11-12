// src/layout/Navbar.jsx
import React from "react";
import { Navbar, Container, Nav, Button, Dropdown } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const navLinks = [
  { path: "/camaras", label: "Cámaras" },
  { path: "/reportes", label: "Reportes" },
  { path: "/configuracion", label: "Configuración" },
];

const AppNavbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <Navbar
      expand="lg"
      bg="dark"
      variant="dark"
      sticky="top"
      className="shadow-sm border-bottom border-warning-subtle"
      style={{
        backdropFilter: "blur(8px)",
        background: "rgba(0, 0, 0, 0.9)",
      }}
    >
      <Container fluid>
        {/* ---------- Brand ---------- */}
        <Navbar.Brand
          onClick={() => navigate("/camaras")}
          role="button"
          aria-label="Ir al dashboard"
          className="fw-bold text-uppercase d-flex align-items-center gap-2 text-warning"
          style={{
            cursor: "pointer",
            fontSize: "1.25rem",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ffd166")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#ffbb33")}
        >
          🚦 <span>SIV Dashboard</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar" />

        {/* ---------- Menu ---------- */}
        <Navbar.Collapse id="main-navbar">
          <Nav className="ms-auto align-items-center gap-3">
            {user &&
              navLinks.map(({ path, label }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `fw-semibold nav-link ${
                      isActive ? "text-warning" : "text-light"
                    }`
                  }
                  style={{ transition: "color 0.3s ease, transform 0.2s ease" }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  {label}
                </NavLink>
              ))}

            {/* ---------- Login / Usuario ---------- */}
            {!user ? (
              <Button
                variant="warning"
                className="fw-semibold rounded-pill px-4 shadow-sm"
                style={{
                  background: "linear-gradient(90deg, #ff9500, #ffaa33)",
                  border: "none",
                  boxShadow: "0 0 8px #ff9500, 0 0 14px #ffaa33",
                  transition: "all 0.3s ease",
                  color: "#000",
                }}
                onClick={() => navigate("/")}
              >
                Iniciar sesión
              </Button>
            ) : (
              <Dropdown align="end">
                <Dropdown.Toggle
                  id="dropdown-user"
                  variant="outline-warning"
                  className="rounded-pill d-flex align-items-center px-3 py-1 text-warning border-warning"
                  style={{
                    background: "transparent",
                    fontWeight: "500",
                    fontSize: "0.95rem",
                  }}
                >
                  👤 <span className="ms-2">{user.email || "Usuario"}</span>
                </Dropdown.Toggle>

                <Dropdown.Menu
                  className="shadow border-0 rounded-3 mt-2"
                  style={{ fontSize: "0.95rem", minWidth: "180px" }}
                >
                  <Dropdown.Item onClick={() => alert("Perfil próximamente")}>
                    Mi perfil
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => alert("Configuración próximamente")}>
                    Configuración
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item
                    onClick={handleLogout}
                    className="text-danger fw-semibold"
                  >
                    Cerrar sesión
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
