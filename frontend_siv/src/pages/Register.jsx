import { useState } from "react";

const API_URL = "http://127.0.0.1:8000";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      alert(data.message || data.detail);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="auth-form">
      <h2>Registrar</h2>
      <input
        type="text"
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
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
      <button className="btn-success" onClick={handleSubmit}>
        Registrar
      </button>
      <a href="/login" className="form-link">¿Ya tienes cuenta? Inicia sesión</a>
    </div>
  );
}
