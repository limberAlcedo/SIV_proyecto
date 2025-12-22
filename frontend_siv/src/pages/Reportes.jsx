import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Container, Row, Col, Card, Spinner, Table, Form, Button, Badge, Pagination, Modal
} from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, LabelList, LineChart, Line
} from "recharts";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ================= CONFIG ================= */
const API_URL = "http://127.0.0.1:8000/api/incidentes";
const USERS_API = "http://127.0.0.1:8000/api/users/";

/* ================= ESTILOS ================= */
const glassCard = {
  background: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "#fff",
  borderRadius: 16,
  transition: "0.3s",
  width: "100%",
  textAlign: "center",
  padding: "1rem"
};
const bgGradient = "linear-gradient(135deg, #0f172a, #1a3776, #0a3098)";
const PRIORITY_GRADIENTS = {
  Alta: "linear-gradient(90deg, #ff4d4d, #ef4444)",
  Media: "linear-gradient(90deg, #fef08a, #facc15)",
  Baja: "linear-gradient(90deg, #6ee7b7, #10b981)"
};
const STATUS_GRADIENTS = {
  Abierto: "linear-gradient(90deg, #4ade80, #22c55e)",
  Cerrado: "linear-gradient(90deg, #f87171, #ef4444)"
};
const PRIORITY_COLORS = { Alta:"#ef4444", Media:"#facc15", Baja:"#10b981" };
const CREATED_COLOR = "#38bdf8";

/* ================= HELPER FECHAS ================= */
const formatChileDate = (d, customDate=null) => {
  const date = customDate ? new Date(customDate) : new Date(d);
  return new Intl.DateTimeFormat("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/Santiago"
  }).format(date);
};

/* ================= COMPONENTE ================= */
export default function Reportes() {
  const [incidents, setIncidents] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [trendRange, setTrendRange] = useState("today");

  const TOKEN = localStorage.getItem("token");

  /* ================= MODAL EDIT ================= */
  const [showEditModal, setShowEditModal] = useState(false);
  const [incidentToEdit, setIncidentToEdit] = useState(null);

  const handleEditIncident = (incident) => {
    setIncidentToEdit(incident);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setIncidentToEdit(null);
    setShowEditModal(false);
  };

  /* ================= FETCH ================= */
  const fetchData = useCallback(async () => {
    setLoading(true);
    if (!TOKEN) {
      toast.error("⚠️ Sesión expirada. Vuelve a iniciar sesión");
      setLoading(false);
      return;
    }
    try {
      const [incRes, userRes] = await Promise.all([
        fetch(API_URL, { headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type":"application/json" } }),
        fetch(USERS_API, { headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type":"application/json" } })
      ]);
      if (incRes.status === 401 || userRes.status === 401) throw new Error("No autorizado - Token inválido");
      if (!incRes.ok) throw new Error("Error al cargar incidentes");
      if (!userRes.ok) throw new Error("Error al cargar usuarios");

      setIncidents(await incRes.json());
      setUsuarios(await userRes.json());
    } catch (err) {
      console.error(err);
      toast.error(`❌ ${err.message || "Error al cargar datos"}`);
    } finally { setLoading(false); }
  }, [TOKEN]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [search, fromDate, toDate]);

  /* ================= HELPERS ================= */
  const userMap = useMemo(() => {
    const map = new Map();
    usuarios.forEach(u => map.set(u.id, u.username));
    return map;
  }, [usuarios]);

  const getUsername = id => userMap.get(id) || "—";

  const currentMonth = useMemo(() => {
    const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    return monthNames[new Date().getMonth()];
  }, []);

  /* ================= KPI CREADOS MES ================= */
  const totalCreadosMes = useMemo(() => {
    const today = new Date();
    const mesActual = today.getMonth();
    const anioActual = today.getFullYear();
    return incidents.filter(i => {
      const fecha = new Date(i.created_at);
      return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
    }).length;
  }, [incidents]);

  /* ================= FILTROS ================= */
  const filteredIncidents = useMemo(() =>
    incidents
      .filter(i => search ? i.type.toLowerCase().includes(search.toLowerCase()) || getUsername(i.created_by_id).toLowerCase().includes(search.toLowerCase()) : true)
      .filter(i => {
        const d = new Date(i.created_at);
        if (fromDate && d < new Date(fromDate)) return false;
        if (toDate && d > new Date(toDate)) return false;
        return true;
      })
  , [incidents, search, fromDate, toDate, getUsername]);

  const totalPages = Math.ceil(filteredIncidents.length / ITEMS_PER_PAGE);
  const paginated = filteredIncidents.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);

  /* ================= KPIs/GRÁFICOS ================= */
  const priorityCounts = useMemo(() => ["Alta","Media","Baja"].map(p => ({
    name: p,
    value: incidents.filter(i => i.priority === p).length
  })), [incidents]);

  const statusCounts = useMemo(() => ["Abierto","Cerrado"].map(s => ({
    name:s, value:incidents.filter(i=>i.status===s).length
  })), [incidents]);

  const topUsersData = useMemo(() => usuarios.map(u=>({
    name:u.username,
    value: incidents.filter(i=>i.created_by_id===u.id && i.status==="Cerrado").length
  })).filter(u=>u.value>0).sort((a,b)=>b.value-a.value).slice(0,5), [usuarios, incidents]);

  const trendData = useMemo(() => {
    const today = new Date();
    let startDate;
    if (trendRange === "today") startDate = new Date(today.toDateString());
    else if (trendRange === "week") startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
    else startDate = new Date(today.getFullYear(), today.getMonth(), 1);

    const map = new Map();
    incidents.forEach(i => {
      if (!i.closed_at) return;
      const created = new Date(i.created_at);
      const closed = new Date(i.closed_at);
      if (created < startDate) return;

      const dateKey = created.toLocaleDateString();
      const diffHours = (closed - created) / (1000 * 60 * 60);

      if (!map.has(dateKey)) map.set(dateKey, { total:0, sumHours:0 });
      const obj = map.get(dateKey);
      obj.total +=1;
      obj.sumHours += diffHours;
    });

    const data = Array.from(map.entries())
      .sort(([a],[b])=> new Date(a)-new Date(b))
      .map(([date, obj])=>({ date, total: obj.total, avgHours: obj.sumHours/obj.total }));

    return data.length ? data : [{ date: today.toLocaleDateString(), total:0, avgHours:0 }];
  }, [incidents, trendRange]);



  /* ================= PDF ================= */
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Reporte de Incidentes", 14, 18);
    autoTable(doc, {
      startY: 28,
      head: [["Tipo","Usuario","Prioridad","Estado","Fecha Abierto","Fecha Cerrado"]],
      body: filteredIncidents.map(i=>[
        i.type, getUsername(i.created_by_id), i.priority, i.status, formatChileDate(i.created_at), formatChileDate(i.closed_at, i.custom_closed_at)
      ]),
      styles: { fontSize: 8 }
    });
    doc.save("reporte_incidentes.pdf");
  };

  /* ==================== RENDER ==================== */
  return (
    <Container fluid style={{ minHeight:"100vh", background:bgGradient, padding:"2rem 0" }}>
      <div style={{ maxWidth:1400, margin:"0 auto", padding:"0 1rem" }}>
        <ToastContainer autoClose={2500} />
        <motion.h2 className="text-center text-warning mb-4" initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}}>
          📊 Reportes de Incidentes
        </motion.h2>

        {/* ==================== FILTROS ==================== */}
        <Card style={{...glassCard, padding:"8px 16px"}} className="mb-4">
          <Row className="align-items-center g-2">
            <Col xs={12} sm="auto"><Form.Control size="sm" type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)}/></Col>
            <Col xs={12} sm="auto"><Form.Control size="sm" type="date" value={toDate} onChange={e=>setToDate(e.target.value)}/></Col>
            <Col xs={12} sm><Form.Control size="sm" placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)}/></Col>
            <Col xs={12} sm="auto"><Button size="sm" variant="outline-light" onClick={exportPDF}>📄 Exportar PDF</Button></Col>
          </Row>
        </Card>

        {/* ==================== TABLA ==================== */}
        {loading ? <div className="text-center my-5"><Spinner animation="border" variant="light"/></div> : (
          <Card style={{...glassCard, overflowX:"auto"}}>
            <Table responsive hover className="align-middle mb-0 text-white" style={{ minWidth:"700px" }}>
              <thead className="table-dark text-uppercase">
                <tr>
                  <th>Tipo</th>
                  <th>Usuario</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Fecha Abierto</th>
                  <th>Fecha Cerrado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE).map((i,index)=>(
                  <motion.tr key={i.id} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay: index*0.05 }}>
                    <td>{i.type}</td>
                    <td>{getUsername(i.created_by_id)}</td>
                    <td><Badge pill style={{ background: PRIORITY_GRADIENTS[i.priority], color:"#fff", fontWeight:600, padding:"0.4em 0.8em" }}>{i.priority}</Badge></td>
                    <td><Badge pill style={{ background: STATUS_GRADIENTS[i.status], color:"#fff", fontWeight:600, padding:"0.4em 0.8em" }}>{i.status}</Badge></td>
                    <td>{formatChileDate(i.created_at)}</td>
                    <td>{formatChileDate(i.closed_at, i.custom_closed_at)}</td>
                    <td>
                      <Button size="sm" variant="warning" className="ms-2" onClick={() => handleEditIncident(i)}>Editar</Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </Table>
          </Card>
        )}

        {/* ==================== PAGINACIÓN ==================== */}
        {totalPages>1 && (
          <Pagination className="justify-content-center mt-3">
            <Pagination.First onClick={()=>setPage(1)} disabled={page===1}/>
            <Pagination.Prev onClick={()=>setPage(p=>Math.max(p-1,1))} disabled={page===1}/>
            {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
              <Pagination.Item key={p} active={p===page} onClick={()=>setPage(p)}>{p}</Pagination.Item>
            ))}
            <Pagination.Next onClick={()=>setPage(p=>Math.min(p+1,totalPages))} disabled={page===totalPages}/>
            <Pagination.Last onClick={()=>setPage(totalPages)} disabled={page===totalPages}/>
          </Pagination>
        )}

        {/* ==================== MODAL MINI FORM ==================== */}
        <Modal show={showEditModal} onHide={handleCloseModal} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Editar Incidente</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {incidentToEdit ? (
              <Form onSubmit={(e)=>{
                e.preventDefault();
                const updated = {
                  type: e.target.type.value,
                  priority: e.target.priority.value,
                  status: e.target.status.value
                };
                fetch(`${API_URL}/${incidentToEdit.id}`, {
                  method: "PUT",
                  headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${TOKEN}`
                  },
                  body: JSON.stringify(updated)
                })
                .then(res => res.json())
                .then(()=> {
                  toast.success("✅ Incidente actualizado");
                  fetchData();
                  handleCloseModal();
                })
                .catch(()=> toast.error("❌ Error al actualizar"));
              }}>
                <Form.Group className="mb-2">
                  <Form.Label>Tipo</Form.Label>
                  <Form.Control name="type" defaultValue={incidentToEdit.type} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Prioridad</Form.Label>
                  <Form.Select name="priority" defaultValue={incidentToEdit.priority}>
                    <option>Alta</option>
                    <option>Media</option>
                    <option>Baja</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Estado</Form.Label>
                  <Form.Select name="status" defaultValue={incidentToEdit.status}>
                    <option>Abierto</option>
                    <option>Cerrado</option>
                  </Form.Select>
                </Form.Group>
                <div className="d-flex justify-content-end mt-3">
                  <Button variant="secondary" className="me-2" onClick={handleCloseModal}>Cancelar</Button>
                  <Button type="submit" variant="primary">Guardar</Button>
                </div>
              </Form>
            ) : <div className="text-center py-5">Cargando...</div>}
          </Modal.Body>
        </Modal>

      </div>
    </Container>
  );
}
