// src/layout/Layout.jsx
import React from "react";
import AppNavbar from "./Navbar";
import Footer from "./Footer";

const Layout = ({ children }) => (
  <div style={{ minHeight: "100vh", background: "#111", color: "#fff" }}>
    <AppNavbar />
    <main>{children}</main>
    <Footer />
  </div>
);

export default Layout;
