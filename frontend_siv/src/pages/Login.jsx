import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Si ya hay sesión guardada, redirigir automáticamente
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/camaras");
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simulación de validación (puedes conectar al backend después)
    if (email === "admin@test.com" && password === "1234") {
      alert("Inicio de sesión exitoso ✅");

      // Guardamos sesión
      localStorage.setItem("user", JSON.stringify({ email }));

      // Redirigimos
      navigate("/camaras");
    } else {
      alert("Credenciales incorrectas ❌");
    }
  };

  // Estilos globales (idénticos a los que tenías)
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      body {
        margin: 0;
        padding: 0;
        background: linear-gradient(120deg, #111827, #1e3a8a, #2563eb);
        background-size: 300% 300%;
        animation: gradientMove 8s ease infinite;
        height: 100vh;
        overflow: hidden;
      }

      @keyframes gradientMove {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      input:focus {
        box-shadow: 0 0 0 2px #3b82f6 inset !important;
        background-color: rgba(255, 255, 255, 0.25) !important;
      }

      button:hover {
        transform: scale(1.05);
        box-shadow: 0 0 25px rgba(37,99,235,0.8);
      }

      button:active {
        transform: scale(0.98);
      }

      .login-card:hover {
        transform: scale(1.03);
        backdrop-filter: blur(20px);
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={styles.container}>
      <div className="login-card" style={styles.card}>
        <h2 style={styles.title}>🚦 Bienvenido</h2>
        <p style={styles.subtitle}>Sistema de Monitoreo de Tráfico</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" style={styles.button}>
            Ingresar
          </button>
        </form>

        <a href="/register" style={styles.link}>
          ¿No tienes cuenta? <b>Regístrate</b>
        </a>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(10px)",
    fontFamily: "'Poppins', sans-serif",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    padding: "45px 40px",
    borderRadius: "18px",
    backdropFilter: "blur(15px)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
    color: "#fff",
    width: "100%",
    maxWidth: "380px",
    textAlign: "center",
    transition: "transform 0.4s ease, backdrop-filter 0.4s ease",
  },
  title: {
    marginBottom: "10px",
    fontWeight: 700,
    fontSize: "1.9rem",
    textShadow: "0 2px 10px rgba(254, 249, 249, 0.4)",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#d1d5db",
    marginBottom: "25px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    outline: "none",
    fontSize: "0.95rem",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    color: "#fff",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.2) inset",
    transition: "all 0.3s ease",
  },
  button: {
    marginTop: "10px",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    fontSize: "1rem",
    fontWeight: "bold",
    background: "linear-gradient(90deg, #3b82f6, #2563eb)",
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(37,99,235,0.5)",
    transition: "all 0.3s ease",
  },
  link: {
    marginTop: "18px",
    display: "block",
    color: "#cbd5e1",
    fontSize: "0.9rem",
    textDecoration: "none",
  },
};
