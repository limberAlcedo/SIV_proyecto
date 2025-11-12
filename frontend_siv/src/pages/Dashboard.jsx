import React from "react";
import CameraCard from "../components/CameraCard";

const Dashboard = () => {
    const cameras = [
        { id: 1, title: "Cámara 1" },
        { id: 2, title: "Cámara 2" },
        { id: 3, title: "Cámara 3" },
    ];

    return (
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", padding: "20px", background: "#111", minHeight: "100vh", color: "#fff" }}>
            {cameras.map(cam => (
                <CameraCard key={cam.id} camId={cam.id} title={cam.title} />
            ))}
        </div>
    );
};

export default Dashboard;
