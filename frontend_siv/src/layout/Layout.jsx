// src/layout/Layout.jsx
import React from "react";
import AppNavbar from "./Navbar";
import Footer from "./Footer";

const Layout = ({ children }) => {
  return (
    <div className="d-flex flex-column min-vh-100 bg-dark text-light">
      <AppNavbar />
      <main className="flex-grow-1 container py-4">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
