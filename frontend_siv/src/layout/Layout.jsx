import React from "react";
import AppNavbar from "./Navbar";
import Footer from "./Footer";
import "../styles/Layout.css"; // importamos estilos separados

const Layout = ({ children }) => {
  return (
    <div className="layout-container">
      <AppNavbar />
      <main className="layout-main">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;

///Users/limberalcedo/Desktop/Proyecto/SIV_proyecto/frontend_siv/src/layout/Layout.jsx