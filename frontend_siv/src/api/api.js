import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

export const getCameraStream = (camId) => `${API_BASE}/camera/${camId}/stream`;

export const getCameraCongestion = async (camId) => {
    try {
        const res = await axios.get(`${API_BASE}/camera/${camId}/congestion`);
        // Devuelve nivel y porcentaje para mostrar badge
        const counts = res.data.counts;
        const total = counts.auto + counts.person;
        const porcentaje = total > 0 ? Math.min(Math.round((counts.auto / total) * 100), 100) : 0;
        return { nivel: res.data.congestion, porcentaje };
    } catch (err) {
        console.error(err);
        return { nivel: "Desconocido", porcentaje: 0 };
    }
};
