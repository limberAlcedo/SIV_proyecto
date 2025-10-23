const API_URL = "http://127.0.0.1:8000"; // tu FastAPI

export const loginUser = async (user) => {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });

  if (!res.ok) {
    throw new Error(`Error: ${res.status}`);
  }

  return res.json();
};
