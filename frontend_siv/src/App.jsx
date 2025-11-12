// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layout/Layout";
import Login from "./pages/Login";
import Camaras from "./pages/Camaras";
import Reportes from "./pages/Reportes";
import Configuracion from "./pages/Configuracion";
import "bootstrap/dist/css/bootstrap.min.css";

// Componente que protege las rutas
const ProtectedRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/" />;
  return <Layout>{children}</Layout>;
};

const App = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <Router>
      <Routes>
        {/* Página de login */}
        <Route path="/" element={user ? <Navigate to="/camaras" /> : <Login />} />

        {/* Rutas internas protegidas */}
        <Route
          path="/camaras"
          element={
            <ProtectedRoute user={user}>
              <Camaras />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reportes"
          element={
            <ProtectedRoute user={user}>
              <Reportes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracion"
          element={
            <ProtectedRoute user={user}>
              <Configuracion />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
