// src/hooks/useApi.jsx
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export const useApi = () => {
  const { token } = useContext(AuthContext);

  const fetchApi = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    if (res.status === 401) throw new Error("No autorizado");
    return res.json();
  };

  return { fetchApi };
};
