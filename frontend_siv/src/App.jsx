// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./layout/Navbar";
import Footer from "./layout/Footer";
// import Login from "./pages/Login"; // Comentado por ahora
// import Register from "./pages/Register"; // Comentado por ahora
import Dashboard from "./pages/Dashboard";
import { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import "./styles/App.css";

function App() {
  // Estado para simular login (no se usa por ahora)
  const [isLoggedIn, setIsLoggedIn] = useState(true); // true para saltar login

  return (
    <Router>
      {/* Navbar solo si está logueado */}
      {isLoggedIn && <Navbar />}

      {/* Contenedor principal */}
      <div className={`app-container ${!isLoggedIn ? "blurred" : ""}`}>
        <Container fluid className="py-4">
          <Row className="justify-content-center">
            <Col xs={12} md={10} lg={8}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                {/* <Route path="/register" element={<Register />} /> */}
                {/* <Route path="/login" element={<Login onLogin={() => setIsLoggedIn(true)} />} /> */}
              </Routes>
            </Col>
          </Row>
        </Container>

        {/* Footer solo si está logueado */}
        {isLoggedIn && <Footer />}
      </div>

      {/* Overlay de login comentado por ahora */}
      {/*
      {!isLoggedIn && (
        <div className="overlay">
          <Login onLogin={() => setIsLoggedIn(true)} />
        </div>
      )}
      */}
    </Router>
  );
}

export default App;
