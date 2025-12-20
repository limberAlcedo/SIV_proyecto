import React, { useEffect, useState } from "react";
import { Navbar, Container, Nav, Button, Dropdown, Modal, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { User, Camera, FileText, Settings, Users, AlertTriangle, BarChart, Shield, Key } from "lucide-react";
import NavLinks from "./NavLinks";
import "../styles/AppNavbar.css";

const AppNavbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  if (!user) return null;

  return (
    <>
      <Navbar
        expand="lg"
        variant="dark"
        sticky="top"
        className={`navbar-custom shadow-sm ${isScrolled ? "scrolled" : ""}`}
      >
        <Container fluid className="px-4">
          <Navbar.Brand
            onClick={() => navigate("/camaras")}
            role="button"
            className="d-flex align-items-center gap-2 fw-bold fs-5 text-white"
          >
            🚦 SIV Dashboard
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="main-navbar" />

          <Navbar.Collapse id="main-navbar">
            <Nav className="ms-auto align-items-center gap-3">
              {/* Links dinámicos */}
              <NavLinks user={user} />

              {/* User Dropdown */}
              <Dropdown align="end">
                <Dropdown.Toggle className="dropdown-toggle-custom rounded-pill d-flex align-items-center px-3 py-1 fw-medium">
                  <User size={18} /> <span className="ms-2">{user.name || user.username}</span>
                  <Badge
                    bg={
                      user.role_name === "admin"
                        ? "danger"
                        : user.role_name === "supervisor"
                        ? "warning"
                        : "info"
                    }
                    className="ms-2 text-uppercase"
                    style={{ fontSize: "0.7rem" }}
                  >
                    {user.role_name}
                  </Badge>
                </Dropdown.Toggle>

                <Dropdown.Menu className="shadow border-0 mt-2 py-2" style={{ minWidth: 220 }}>
                  {/* Opciones comunes */}
                  <Dropdown.Item onClick={() => alert("Perfil próximamente")}>
                    <User size={16} className="me-2" /> Mi perfil
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => navigate("/configuracion")}>
                    <Settings size={16} className="me-2" /> Configuración
                  </Dropdown.Item>

                  <Dropdown.Divider />

                  {/* Opciones por rol */}
                  {user.role_name === "operador" && (
                    <>
                      <Dropdown.Item onClick={() => navigate("/camaras")}>
                        <Camera size={16} className="me-2" /> Ver cámaras
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => navigate("/incidentes")}>
                        <AlertTriangle size={16} className="me-2" /> Incidentes
                      </Dropdown.Item>
                    </>
                  )}

                  {user.role_name === "supervisor" && (
                    <>
                      <Dropdown.Item onClick={() => navigate("/grabaciones")}>
                        <FileText size={16} className="me-2" /> Consultar grabaciones
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => navigate("/incidentes")}>
                        <AlertTriangle size={16} className="me-2" /> Incidentes
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => navigate("/usuarios")}>
                        <Users size={16} className="me-2" /> Usuarios
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => navigate("/reportes")}>
                        <BarChart size={16} className="me-2" /> Reportes
                      </Dropdown.Item>
                    </>
                  )}

                  {user.role_name === "admin" && (
                    <>
                      <Dropdown.Item onClick={() => navigate("/camaras")}>
                        <Camera size={16} className="me-2" /> Administrar cámaras
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => navigate("/incidentes")}>
                        <AlertTriangle size={16} className="me-2" /> Incidentes
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => navigate("/usuarios")}>
                        <Users size={16} className="me-2" /> Usuarios
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => navigate("/configuracion")}>
                        <Settings size={16} className="me-2" /> Configuración completa
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => navigate("/reportes")}>
                        <BarChart size={16} className="me-2" /> Reportes
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => alert("Seguridad y roles")}>
                        <Shield size={16} className="me-2" /> Permisos y roles
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => alert("Gestión de claves")}>
                        <Key size={16} className="me-2" /> Claves y auditoría
                      </Dropdown.Item>
                    </>
                  )}

                  <Dropdown.Divider />
                  <Dropdown.Item
                    onClick={() => setShowLogoutModal(true)}
                    className="text-danger fw-semibold"
                  >
                    Cerrar sesión
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Modal de logout */}
      <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered size="sm">
        <Modal.Header closeButton>
          <Modal.Title>Cerrar sesión</Modal.Title>
        </Modal.Header>
        <Modal.Body>¿Estás seguro de que quieres cerrar sesión?</Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setShowLogoutModal(false);
              handleLogout();
            }}
          >
            Cerrar sesión
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AppNavbar;
