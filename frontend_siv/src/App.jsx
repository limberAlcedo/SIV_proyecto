// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "./layout/Layout";
import Login from "./pages/Login";
import Camaras from "./pages/Camaras";
import Grabaciones from "./pages/Grabaciones";
import Incidentes from "./pages/Incidentes/IncidentesMain";
import Reportes from "./pages/Reportes";
import Configuracion from "./pages/Configuracion";
import Usuarios from "./pages/Usuarios";
import "bootstrap/dist/css/bootstrap.min.css";

// ------------------------
// Protected Route
// ------------------------
const ProtectedRoute = ({ user, allowedRoles = [], children }) => {
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role.toLowerCase())) {
    return <Navigate to="/camaras" replace />;
  }
  return <Layout>{children}</Layout>;
};

// ------------------------
// Main App
// ------------------------
const App = () => {
  const [user, setUser] = useState(null);

  // Cargar usuario desde localStorage al iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm("¿Estás seguro de que quieres cerrar sesión?");
    if (!confirmLogout) return;
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  // ------------------------
  // Animación de rutas
  // ------------------------
  const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  return (
    <div style={styles.appBackground}>
      <Router>
        <AnimatePresence exitBeforeEnter>
          <Routes>
            {/* Login */}
            <Route
              path="/"
              element={user ? <Navigate to="/camaras" replace /> : <Login onLogin={handleLogin} />}
            />

            {/* Rutas protegidas */}
            <Route
              path="/camaras"
              element={
                <ProtectedRoute user={user}>
                  <motion.div {...pageTransition}><Camaras onLogout={handleLogout} /></motion.div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/incidentes"
              element={
                <ProtectedRoute user={user}>
                  <motion.div {...pageTransition}><Incidentes currentUser={user} onLogout={handleLogout} /></motion.div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/configuracion"
              element={
                <ProtectedRoute user={user}>
                  <motion.div {...pageTransition}><Configuracion onLogout={handleLogout} /></motion.div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/grabaciones"
              element={
                <ProtectedRoute user={user} allowedRoles={["supervisor", "admin"]}>
                  <motion.div {...pageTransition}><Grabaciones onLogout={handleLogout} /></motion.div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/reportes"
              element={
                <ProtectedRoute user={user} allowedRoles={["supervisor", "admin"]}>
                  <motion.div {...pageTransition}><Reportes onLogout={handleLogout} /></motion.div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/usuarios"
              element={
                <ProtectedRoute user={user} allowedRoles={["supervisor", "admin"]}>
                  <motion.div {...pageTransition}><Usuarios onLogout={handleLogout} /></motion.div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AnimatePresence>
      </Router>
    </div>
  );
};

// ------------------------
// Estilos
// ------------------------
const styles = {
  appBackground: {
    minHeight: "100vh",
    width: "100%",
    fontFamily: "'Poppins', sans-serif",
    background: "linear-gradient(135deg, #0f172a, #1a3776, #0a3098)",
    backgroundAttachment: "fixed",
    color: "#fff",
    transition: "all 0.3s",
  },
};

export default App;
