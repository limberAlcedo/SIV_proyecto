// src/pages/Usuarios.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Modal, Dropdown } from "react-bootstrap";
import { User2, Trash2, Key, Plus, Edit2, Eye, EyeOff } from "lucide-react";

const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:8000"
  : `http://${window.location.hostname}:8000`;

const initialFormData = { username: "", name: "", role: "operador", password: "" };
const ROLE_COLOR = { admin: "#EF4444", supervisor: "#FBBF24", operador: "#3B82F6" };

export default function Usuarios() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [notification, setNotification] = useState({ msg: "", type: "success" });
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCardView, setIsCardView] = useState(window.innerWidth < 900);
  const firstInputRef = useRef(null);

  // Ajustar vista según ancho
  useEffect(() => {
    const handleResize = () => setIsCardView(window.innerWidth < 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const token = localStorage.getItem("token") || "";
  const headers = { 
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };

  useEffect(() => { fetchUsers(); }, []);

  const showNotif = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification({ msg: "", type: "success" }), 2500);
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/`, { headers });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) showNotif("Token inválido o expirado ❌", "error");
        else if (res.status === 403) showNotif("No tienes permisos ❌", "error");
        else showNotif("Error al cargar usuarios ❌", "error");
        return;
      }
      setUsers(data);
    } catch (err) {
      showNotif("Error al cargar usuarios ❌", "error");
    }
  };

  const validateForm = () => {
    if (formData.username.length < 3) { showNotif("Nombre de usuario incorrecto ❌", "error"); return false; }
    if (formData.name.length < 3) { showNotif("Nombre muy corto ❌", "error"); return false; }
    if (!editingUser && formData.password.length < 6) { showNotif("Contraseña debe tener al menos 6 caracteres ❌", "error"); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      const method = editingUser ? "PUT" : "POST";
      const url = editingUser ? `${API_URL}/api/users/${editingUser.id}` : `${API_URL}/api/users/`;
      const payload = editingUser && formData.password === "" 
        ? { username: formData.username, name: formData.name, role: formData.role }
        : formData;

      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { showNotif("Error al guardar usuario ❌", "error"); return; }

      if (editingUser) setUsers(users.map(u => (u.id === editingUser.id ? data : u)));
      else setUsers(prev => [...prev, data]);

      showNotif(editingUser ? "Usuario actualizado ✅" : "Usuario agregado ✅");
      closeForm();
    } catch (err) {
      showNotif("Error al guardar usuario ❌", "error");
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({ username: user.username, name: user.name || "", role: user.role, password: "" });
    setShowForm(true);
  };

  const handleAddUser = () => {
    setFormData(initialFormData);
    setEditingUser(null);
    setShowForm(true);
  };

  const confirmDelete = (user) => { setUserToDelete(user); setShowDeleteConfirm(true); };
  const handleDelete = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/${userToDelete.id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Error al eliminar usuario");
      setUsers(users.filter(u => u.id !== userToDelete.id));
      showNotif("Usuario eliminado ✅");
    } catch (err) {
      showNotif("Error al eliminar usuario ❌", "error");
    }
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  const closeForm = () => { 
    setShowForm(false); 
    setEditingUser(null); 
    setFormData(initialFormData); 
    setShowPassword(false);
  };

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") closeForm(); };
    if (showForm) firstInputRef.current?.focus();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showForm]);

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ---------------- VISTAS ----------------
  const AddUserButton = ({ onClick }) => (
    <div style={styles.bottomAddBtn}>
      <Button variant="success" onClick={onClick} style={{ display:"flex", alignItems:"center", gap:6, fontWeight:600 }}>
        <Plus size={16} /> Agregar Usuario
      </Button>
    </div>
  );

  const UserRow = ({ user }) => (
    <motion.div layout initial={{opacity:0, x:-50}} animate={{opacity:1, x:0}} exit={{opacity:0, x:50}} style={styles.tableRow}>
      <span style={{ flex: 2, minWidth:120, display:"flex", alignItems:"center", gap:8 }}><User2 size={16} /> {user.username}</span>
      <span style={{ flex: 2, minWidth:100 }}>{user.name}</span>
      <span style={{ flex: 1, minWidth:80, color: ROLE_COLOR[user.role], fontWeight:600 }}>{user.role}</span>
      <span style={{ flex: 1, minWidth:80, display:"flex", alignItems:"center", gap:4 }}><Key size={12} /> ********</span>
      <span style={{ flex: 1, minWidth:100 }}>
        <Dropdown>
          <Dropdown.Toggle size="sm" variant="outline-light">Acciones</Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => handleEdit(user)}><Edit2 size={14} /> Editar</Dropdown.Item>
            <Dropdown.Item onClick={() => confirmDelete(user)}><Trash2 size={14} /> Eliminar</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </span>
    </motion.div>
  );

  const UserCard = ({ user }) => (
    <motion.div layout initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} style={styles.cardRow}>
      <div style={styles.cardItem}><b>Usuario:</b> {user.username}</div>
      <div style={styles.cardItem}><b>Nombre:</b> {user.name}</div>
      <div style={{...styles.cardItem, color: ROLE_COLOR[user.role], fontWeight:600}}><b>Rol:</b> {user.role}</div>
      <div style={styles.cardItem}><b>Clave:</b> ********</div>
      <div style={styles.cardItem}>
        <Dropdown>
          <Dropdown.Toggle size="sm" variant="outline-light">Acciones</Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => handleEdit(user)}><Edit2 size={14} /> Editar</Dropdown.Item>
            <Dropdown.Item onClick={() => confirmDelete(user)}><Trash2 size={14} /> Eliminar</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </motion.div>
  );

  return (
    <motion.div style={styles.page}>
      <header style={styles.header}>
        <motion.div initial={{ y:-20, opacity:0 }} animate={{ y:0, opacity:1 }} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}>
          <User2 size={28} color="#0ea5e9" />
          <h1 style={styles.title}>Panel de Usuarios</h1>
        </motion.div>
      </header>

      {/* BUSCADOR */}
      <div style={styles.panelWrapper}>
        <div style={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Buscar usuario o nombre..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* VISTA RESPONSIVE */}
        {isCardView ? (
          <div style={styles.cardGrid}>
            <AnimatePresence>
              {filteredUsers.map(user => <UserCard key={user.id} user={user} />)}
            </AnimatePresence>
            <AddUserButton onClick={handleAddUser} />
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <div style={styles.tableHeader}>
              <span style={{ flex: 2 }}>Usuario</span>
              <span style={{ flex: 2 }}>Nombre</span>
              <span style={{ flex: 1 }}>Rol</span>
              <span style={{ flex: 1 }}>Clave</span>
              <span style={{ flex: 1 }}>Acciones</span>
            </div>
            {filteredUsers.length === 0 && <p style={styles.noUsers}>No hay usuarios</p>}
            <AnimatePresence>
              {filteredUsers.map(user => <UserRow key={user.id} user={user} />)}
            </AnimatePresence>
            <AddUserButton onClick={handleAddUser} />
          </div>
        )}
      </div>

      {/* FORMULARIO */}
      <AnimatePresence>
        {showForm && (
          <motion.div style={styles.formOverlay} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <motion.div style={styles.formContainer} initial={{ y:-30, opacity:0, scale:0.95 }} animate={{ y:0, opacity:1, scale:1 }} exit={{ y:-30, opacity:0, scale:0.95 }}>
              <h3 style={{ color:"#fff", textAlign:"center", marginBottom:16 }}>{editingUser ? "Editar Usuario" : "Agregar Usuario"}</h3>
              <input ref={firstInputRef} placeholder="Username" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} style={styles.inputForm} />
              <input placeholder="Nombre completo" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={styles.inputForm} />
              <div style={{ position: "relative" }}>
                <input placeholder="Clave (solo si desea cambiarla)" type={showPassword ? "text" : "password"} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} style={styles.inputForm} />
                <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", cursor:"pointer", color:"#fff" }} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              </div>
              <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} style={styles.inputForm}>
                <option value="operador">Operador</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Admin</option>
              </select>
              <div style={styles.formActions}>
                <Button variant="danger" size="sm" onClick={closeForm} style={{ fontWeight:600 }}>Cancelar</Button>
                <Button variant="primary" size="sm" onClick={handleSave} style={{ fontWeight:600, marginLeft:10 }}>{editingUser ? "Guardar" : "Agregar"}</Button>
              </div>
              <button style={styles.closeBtn} onClick={closeForm}>✕</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL ELIMINAR */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
        <Modal.Header closeButton><Modal.Title>Confirmar eliminación</Modal.Title></Modal.Header>
        <Modal.Body>¿Eliminar al usuario <b>{userToDelete?.username}</b>?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Eliminar</Button>
        </Modal.Footer>
      </Modal>

      {/* NOTIFICACIÓN */}
      <AnimatePresence>
        {notification.msg && (
          <motion.div style={{ ...styles.notification, background: notification.type === "error" ? "#EF4444" : "#14b8a6" }} 
                      initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}>
          {notification.msg}
        </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------- STYLES ----------------
const styles = {
  page: { width: "100%", minHeight: "100vh", padding: 20, fontFamily: "'Poppins', sans-serif", background: "linear-gradient(135deg, #0f172a, #1a3776, #0a3098)", color: "#fff" },
  header: { textAlign: "center", marginBottom: 30 },
  title: { fontSize: "2rem", fontWeight: 700, color:"#e0e7ff", textShadow: "1px 1px 4px rgba(0,0,0,0.3)" },
  panelWrapper: { width: "100%", maxWidth: "900px", margin: "0 auto", borderRadius: 16, overflow: "hidden", background: "linear-gradient(145deg, #1e3a73, #3b82f6)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" },
  searchWrapper: { padding:"14px 18px", background: "linear-gradient(135deg, #3b82f6, #1e3a73)" },
  searchInput: { width:"100%", padding:"12px 16px", borderRadius:12, border:"1px solid #334155", outline:"none", fontSize:"1rem", background:"#3a5ba0", color:"#fff", transition:"all 0.2s", boxShadow:"inset 0 2px 6px rgba(0,0,0,0.3)" },
  tableWrapper: { display:"flex", flexDirection:"column", background: "#2e4a8f", borderRadius:"0 0 16px 16px", overflow:"hidden" },
  tableHeader: { display:"flex", padding:"14px 18px", fontWeight:700, fontSize:"0.95rem", background:"#3b5ba0", borderBottom:"1px solid rgba(255,255,255,0.2)", gap:"8px", color:"#e0e7ff", textTransform:"uppercase", letterSpacing:"0.5px" },
  tableRow: { display:"flex", alignItems:"center", padding:"14px 18px", fontSize:"0.95rem", transition:"all 0.3s", cursor:"pointer", gap:"8px", borderBottom:"1px solid rgba(255,255,255,0.1)", borderRadius:8, background:"#2e4a8f", margin: "4px 10px" },
  cardGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(250px, 1fr))", gap:16, padding:16 },
  cardRow: { background:"#2e4a8f", padding:16, borderRadius:12, marginBottom:16, boxShadow:"0 8px 20px rgba(0,0,0,0.2)", display:"flex", flexDirection:"column", gap:10, color:"#fff", transition:"all 0.2s" },
  cardItem: { display:"flex", justifyContent:"space-between", fontSize:"0.95rem" },
  bottomAddBtn: { display:"flex", justifyContent:"center", padding:16, background:"#2e4a8f", borderRadius:"0 0 16px 16px" },
  noUsers: { textAlign: "center", padding: 24, color: "#cbd5e1", fontWeight: 500 },
  formOverlay: { position:"fixed", top:0, left:0, width:"100vw", height:"100vh", background:"rgba(0,0,0,0.4)", backdropFilter:"blur(6px)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:9999 },
  formContainer: { position:"relative", width:"85%", maxWidth:400, background:"linear-gradient(145deg, #0f172a, #1e3a73)", borderRadius:16, padding:24, display:"flex", flexDirection:"column", gap:14, boxShadow:"0 16px 44px rgba(0,0,0,0.5)" },
  inputForm: { padding:"12px 16px", borderRadius:12, border:"1px solid #334155", outline:"none", fontSize:"1rem", width:"100%", transition:"all 0.2s", background:"rgba(255,255,255,0.05)", color:"#fff", boxShadow:"inset 0 2px 6px rgba(0,0,0,0.3)" },
  formActions: { display:"flex", justifyContent:"center", gap:12, marginTop:12 },
  closeBtn: { position:"absolute", top:14, right:16, border:"none", background:"none", fontSize:"1.5rem", cursor:"pointer", color:"#fff" },
  notification: { position:"fixed", top:20, right:20, color:"#fff", padding:"12px 18px", borderRadius:14, boxShadow:"0 8px 24px rgba(0,0,0,0.35)", zIndex:10000 },
};
