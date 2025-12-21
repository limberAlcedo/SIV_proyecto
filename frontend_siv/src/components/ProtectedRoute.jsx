// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import useAuthFetch from "../hooks/useAuthFetch.js";

export default function ProtectedRoute({ children }) {
  const { TOKEN } = useAuthFetch([]); // solo para obtener el token

  if (!TOKEN) {
    // Si no hay token o expiró, limpiar localStorage y redirigir
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  return children;
}
