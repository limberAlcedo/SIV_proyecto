import { useState } from "react";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // -------------------------------
    // Aquí iría el fetch al backend
    // -------------------------------
    /*
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        onLogin();
      } else {
        alert(data.detail || "Error al iniciar sesión");
      }
    } catch (err) {
      console.error(err);
    }
    */

    // -------------------------------
    // Mock temporal para no hacer login
    // -------------------------------
    alert(`Inicio de sesión simulado para: ${email}`);
    onLogin && onLogin(); // opcional
  };

  return (
    <div className="auth-form">
      <h2>Iniciar Sesión</h2>
      <input
        type="email"
        placeholder="Correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="btn-warning" onClick={handleSubmit}>
        Ingresar
      </button>
      <a href="/register" className="form-link">
        ¿No tienes cuenta? Regístrate
      </a>
    </div>
  );
}
