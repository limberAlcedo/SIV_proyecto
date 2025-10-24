import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./layout/Navbar";
import Footer from "./layout/Footer";
// import Login from "./pages/Login"; // Comentado por ahora
// import Register from "./pages/Register"; // Comentado por ahora
import Dashboard from "./pages/Dashboard";
import { useState } from "react";
import { Container } from "react-bootstrap";
import "./styles/App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // true para saltar login
  const [modalOpened, setModalOpened] = useState(false); // Controla blur cuando abre modal

  return (
    <Router>
      {/* Navbar solo si está logueado */}
      {isLoggedIn && <Navbar />}

      {/* Contenedor principal */}
      <div className={`app-container ${!isLoggedIn ? "blurred" : ""} ${modalOpened ? "modal-active" : ""}`}>
        <Container fluid className="py-4 px-4" style={{ width: "100%", maxWidth: "100%" }}>
          <Routes>
            <Route path="/" element={<Dashboard setModalOpened={setModalOpened} />} />
            <Route path="/dashboard" element={<Dashboard setModalOpened={setModalOpened} />} />
            {/* <Route path="/register" element={<Register />} /> */}
            {/* <Route path="/login" element={<Login onLogin={() => setIsLoggedIn(true)} />} /> */}
          </Routes>
        </Container>

        {/* Footer solo si está logueado */}
        {isLoggedIn && <Footer />}
      </div>

      {/* CSS global del App */}
      <style>{`
        body, html, .app-container {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
          font-family: 'Segoe UI', sans-serif;
          background: radial-gradient(circle at 20% 30%, #0f0f1a, #050515);
          background-size: 400% 400%;
          animation: gradientAnimation 15s ease infinite;
          transition: filter 0.3s ease;
        }
        .app-container.modal-active {
          filter: blur(8px) brightness(0.6);
        }
        @keyframes gradientAnimation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </Router>
  );
}

export default App;
