import React from "react";
import { NavLink } from "react-router-dom";

const navLinks = [
  { path: "/camaras", label: "Cámaras" },
  { path: "/reportes", label: "Reportes" },
  { path: "/configuracion", label: "Configuración" },
];

const NavLinks = () => (
  <>
    {navLinks.map(({ path, label }) => (
      <NavLink
        key={path}
        to={path}
        className={({ isActive }) =>
          `nav-link fw-semibold ${isActive ? "text-warning" : "text-light"}`
        }
        style={{ transition: "color 0.3s ease, transform 0.2s ease" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#ffbb33";
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {label}
      </NavLink>
    ))}
  </>
);

export default NavLinks;
