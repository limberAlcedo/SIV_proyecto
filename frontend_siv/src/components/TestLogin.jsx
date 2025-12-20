import React, { useState } from "react";
import { loginUser, fetchUsers } from "../api/auth";

export default function TestLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  // Login
  const handleLogin = async () => {
    setError("");
    try {
      const data = await loginUser({ username, password });
      setToken(data.access_token);
      alert(`Login exitoso! Usuario: ${data.user.username}`);
    } catch (err) {
      setError(err.message);
    }
  };

  // Listar usuarios
  const handleFetchUsers = async () => {
    setError("");
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h2>💻 Test Login y Usuarios</h2>

      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ padding: "5px", marginRight: "10px" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: "5px", marginRight: "10px" }}
        />
        <button onClick={handleLogin}>Login</button>
      </div>

      {token && (
        <div style={{ marginBottom: "10px" }}>
          <strong>Token JWT:</strong>
          <textarea
            readOnly
            value={token}
            style={{ width: "100%", height: "80px" }}
          />
        </div>
      )}

      <button onClick={handleFetchUsers}>📄 Listar Usuarios</button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {users.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Usuarios:</h3>
          <table border="1" cellPadding="5" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
