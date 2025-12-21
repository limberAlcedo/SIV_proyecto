// src/App.jsx
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layout/Layout";
import Login from "./pages/Login";
import Usuarios from "./pages/Usuarios";
import Camaras from "./pages/Camaras";
import Grabaciones from "./pages/Grabaciones";
import Reportes from "./pages/Reportes";
import IncidentesKanban from "./pages/Incidentes/IncidentesMain";
import Configuracion from "./pages/Configuracion"; // <--- importamos Configuración
import CameraCard from "./components/CameraCard.jsx"; // ajusta según la ruta


// Ruta privada con control de roles
function PrivateRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  let user = null;
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) user = JSON.parse(userStr);
  } catch {
    localStorage.removeItem("user");
  }

  if (!token || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role_name?.toLowerCase())) return <Navigate to="/login" replace />;

  return children;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  const handleLogin = (user) => setCurrentUser(user);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />

        <Route
          path="/usuarios"
          element={
            <PrivateRoute allowedRoles={["admin", "supervisor"]}>
              <Layout>
                <Usuarios currentUser={currentUser} />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/reportes"
          element={
            <PrivateRoute allowedRoles={["supervisor", "admin"]}>
              <Layout>
                <Reportes currentUser={currentUser} />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/camaras"
          element={
            <PrivateRoute allowedRoles={["operador", "supervisor", "admin"]}>
              <Layout>
                <Camaras currentUser={currentUser} />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/grabaciones"
          element={
            <PrivateRoute allowedRoles={["supervisor", "admin"]}>
              <Layout>
                <Grabaciones currentUser={currentUser} />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/incidentes"
          element={
            <PrivateRoute allowedRoles={["operador", "supervisor", "admin"]}>
              <Layout>
                <IncidentesKanban currentUser={currentUser} />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* Nueva ruta de Configuración */}
        <Route
          path="/configuracion"
          element={
            <PrivateRoute allowedRoles={["admin", "supervisor"]}>
              <Layout>
                <Configuracion currentUser={currentUser} />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
