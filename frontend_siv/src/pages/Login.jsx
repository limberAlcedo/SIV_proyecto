import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, AlertCircle, UserPlus, Eye, EyeOff } from "lucide-react";
import { Container, Form, Button, InputGroup } from "react-bootstrap";
import "../styles/Login.css";
import "bootstrap/dist/css/bootstrap.min.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// ================= LOGIN API =================
async function loginUser(username, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Usuario o contraseña incorrectos ❌");
  }

  // Retorna token y usuario
  return data;
}

// ============ REDIRECCIÓN POR ROL ============
const redirectByRole = (navigate, role) => {
  const routes = {
    admin: "/usuarios",
    supervisor: "/reportes",
    user: "/camaras",
  };

  navigate(routes[role] || "/camaras", { replace: true });
};

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  // ===== SI YA ESTÁ LOGUEADO =====
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");

    if (user && token) {
      redirectByRole(navigate, user.role);
    }
  }, [navigate]);

  // ===== SUBMIT =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await loginUser(username, password);

      // Guardar token, tipo y usuario en localStorage
      localStorage.setItem("token", response.access_token);
      localStorage.setItem("token_type", response.token_type || "bearer");
      localStorage.setItem("user", JSON.stringify(response.user));

      // Llamar callback de login si existe
      onLogin?.(response.user);

      // Redirigir según rol
      redirectByRole(navigate, response.user.role);

    } catch (err) {
      setError(err.message);
      setShake(true);

      // Enfocar input
      (username ? passwordRef : usernameRef).current?.focus();
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="login-container">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          x: shake ? [0, -10, 10, -10, 10, 0] : 0,
        }}
        transition={{ duration: 0.5 }}
      >
        {/* HEADER */}
        <div className="login-header">
          <motion.div
            className="icon-wrapper"
            initial={{ rotate: -15 }}
            animate={{ rotate: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <LogIn size={42} color="#60a5fa" />
          </motion.div>
          <h2 className="title">SIV 2.0</h2>
          <p className="subtitle">Monitoreo Inteligente</p>
        </div>

        <Form onSubmit={handleSubmit}>
          {/* USERNAME */}
          <Form.Group className="mb-2">
            <Form.Label>Nombre de Usuario</Form.Label>
            <Form.Control
              ref={usernameRef}
              className="input-custom"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="usuario123"
              required
            />
          </Form.Group>

          {/* PASSWORD */}
          <Form.Group className="mb-2">
            <Form.Label>Contraseña</Form.Label>
            <InputGroup>
              <Form.Control
                ref={passwordRef}
                className="input-custom"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                required
              />
              <Button
                type="button"
                className="btn-show-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </Button>
            </InputGroup>
          </Form.Group>

          {/* ERROR */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="error-wrapper"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                <AlertCircle size={16} color="#ff6b6b" />
                <span className="error-text">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* BOTÓN LOGIN */}
          <Button type="submit" className="button-custom w-100" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>

          {/* CREAR USUARIO */}
          <Button
            variant="outline-primary"
            className="w-100 mt-3"
            onClick={() => navigate("/crear-usuario")}
          >
            <UserPlus size={16} /> Crear usuario
          </Button>
        </Form>

        <p className="footer-text">© {new Date().getFullYear()} SIV</p>
      </motion.div>
    </Container>
  );
}
