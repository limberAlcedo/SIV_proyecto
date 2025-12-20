import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "./../styles/NavLinks.css";

const navLinks = [
  { path: "/camaras", label: "Cámaras", roles: ["operador", "supervisor", "admin"] },
  { path: "/grabaciones", label: "Grabaciones", roles: ["supervisor", "admin"] },
  { path: "/reportes", label: "Reportes", roles: ["supervisor", "admin"] },
  { path: "/configuracion", label: "Configuración", roles: ["operador", "supervisor", "admin"] },
  { path: "/usuarios", label: "Usuarios", roles: ["supervisor", "admin"] },
  { path: "/incidentes", label: "Incidentes", roles: ["operador", "supervisor", "admin"] },
];

const NavLinks = ({ user }) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (!user) return null;

  // Normalizamos el role_name a minúsculas para que funcione con el filtro
  const userRole = user.role_name?.toLowerCase();

  const filteredLinks = navLinks.filter((link) =>
    link.roles.includes(userRole)
  );

  return (
    <nav className={`nav-links-container ${loaded ? "fade-in" : ""}`}>
      {filteredLinks.map(({ path, label }, index) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `nav-link-ultra ${isActive ? "nav-link-active" : ""}`
          }
          style={{
            transition: "all 0.3s ease",
            transitionDelay: `${index * 80}ms`,
          }}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
};

export default NavLinks;
