// src/components/ProtectedRoute.jsx 
import { Navigate } from "react-router-dom";
// hooks

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
