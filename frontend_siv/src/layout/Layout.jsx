// src/layout/Layout.jsx
import React from "react";
import AppNavbar from "./Navbar";
import Footer from "./Footer";

const Layout = ({ children }) => {
  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{
        background:
          "linear-gradient(135deg, rgba(28,100,242,1) 0%, rgba(30,64,175,1) 50%, rgba(59,130,246,1) 100%)",
        backgroundAttachment: "fixed",
        color: "#f9fafb",
      }}
    >
      <AppNavbar />
      <main className="flex-grow-1">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
