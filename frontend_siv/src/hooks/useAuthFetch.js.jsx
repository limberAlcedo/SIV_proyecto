// src/hooks/useAuthFetch.js
import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

export default function useAuthFetch(apiEndpoints = []) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const TOKEN = localStorage.getItem("token");
  const username = JSON.parse(localStorage.getItem("user"))?.username || "Usuario";

  const fetchData = useCallback(async () => {
    setLoading(true);

    if (!TOKEN) {
      toast.error("⚠️ Sesión expirada. Vuelve a iniciar sesión");
      setLoading(false);
      return;
    }

    try {
      const fetches = apiEndpoints.map(url =>
        fetch(url, { headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" } })
      );
      const responses = await Promise.all(fetches);

      // Manejo errores 401
      for (let res of responses) {
        if (res.status === 401) throw new Error("No autorizado - Token inválido");
      }

      // Manejo de errores generales
      for (let i = 0; i < responses.length; i++) {
        if (!responses[i].ok) throw new Error(`Error al cargar datos de ${apiEndpoints[i]}`);
      }

      // Convertir a JSON y guardar en objeto
      const jsonData = await Promise.all(responses.map(res => res.json()));
      const result = {};
      apiEndpoints.forEach((url, idx) => {
        const key = url.split("/").pop() || `data${idx}`;
        result[key] = jsonData[idx];
      });

      setData(result);
    } catch (err) {
      console.error(err);
      toast.error(`❌ ${err.message || "Error al cargar datos"}`);
    } finally {
      setLoading(false);
    }
  }, [TOKEN, apiEndpoints]);

  useEffect(() => { fetchData(); }, [fetchData]);
  

  return { data, loading, fetchData, TOKEN, username };
}
