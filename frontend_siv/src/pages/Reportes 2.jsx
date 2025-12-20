import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Container, Row, Col, Card, Spinner, Table, Form, Button, Badge, Pagination
} from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, LabelList
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
  borderRadius: 16
};
const bgGradient = "linear-gradient(135deg, #0f172a, #1a3776, #0a3098)";
const PRIORITY_COLORS = { Alta: "#ef4444", Media: "#facc15", Baja: "#10b981" };
const STATUS_COLORS = { Abierto: "#22c55e", Cerrado: "#ef4444" };

/* ================= COMPONENTE ================= */
export default function Reportes() {
  const [incidents, setIncidents] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const TOKEN = localStorage.getItem("token");
  const username = JSON.parse(localStorage.getItem("user"))?.username || "Usuario";

  /* ================= FETCH ================= */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [incRes, userRes] = await Promise.all([
        fetch(API_URL, { headers: { Authorization: `Bearer ${TOKEN}` } }),
        fetch(USERS_API)
      ]);
      setIncidents(await incRes.json());
      setUsuarios(await userRes.json());
    } catch {
      toast.error("❌ Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [TOKEN]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [search, fromDate, toDate]);

  /* ================= HELPERS ================= */
  const getUsername = id => usuarios.find(u => u.id === id)?.username || "—";
  const formatDate = d => d ? new Date(d).toLocaleString() : "—";

  /* ================= FILTROS ================= */
  const filteredIncidents = useMemo(() =>
    incidents
      .filter(i => search ? Object.values(i).join(" ").toLowerCase().includes(search.toLowerCase()) : true)
      .filter(i => {
        const d = new Date(i.created_at);
        if (fromDate && d < new Date(fromDate)) return false;
        if (toDate && d > new Date(toDate)) return false;
        return true;
      })
  , [incidents, search, fromDate, toDate]);

  const totalPages = Math.ceil(filteredIncidents.length / ITEMS_PER_PAGE);
  const paginated = filteredIncidents.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);

  /* ================= KPIs ================= */
  const totalCreados = incidents.length;
  const totalCerrados = incidents.filter(i => i.status==="Cerrado").length;
  const usuariosActivos = usuarios.filter(u => u.online).length;

  /* ================= GRÁFICOS ================= */
  const priorityCounts = ["Alta","Media","Baja"].map(p => ({
    name:p, value:incidents.filter(i=>i.priority===p).length, color:PRIORITY_COLORS[p]
  }));
  const statusCounts = ["Abierto","Cerrado"].map(s => ({
    name:s, value:incidents.filter(i=>i.status===s).length, color:STATUS_COLORS[s]
  }));
  const topUsersData = usuarios.map(u=>({
    name:u.username,
    value: incidents.filter(i=>i.created_by_id===u.id && i.status==="Cerrado").length
  })).filter(u=>u.value>0).sort((a,b)=>b.value-a.value).slice(0,5);

  /* ================= PDF ================= */
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Reporte de Incidentes", 14, 18);
    autoTable(doc, {
      startY: 28,
      head: [["Tipo","Usuario","Prioridad","Estado","Fecha Abierto","Fecha Cerrado"]],
      body: filteredIncidents.map(i=>[
        i.type, getUsername(i.created_by_id), i.priority, i.status, formatDate(i.created_at), formatDate(i.closed_at)
      ]),
      styles: { fontSize: 8 }
    });
    doc.save("reporte_incidentes.pdf");
  };

  return (
    <Container fluid style={{ minHeight:"100vh", background:bgGradient }}>
      <div style={{ maxWidth:1300, margin:"0 auto", padding:32 }}>
        <ToastContainer autoClose={2500} />

        {/* TITULO */}
        <motion.h2 className="text-center text-warning mb-5" initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}}>
          📊 Reportes de Incidentes
        </motion.h2>

        {/* KPIs */}
        <Row className="g-4 mb-5 text-center">
          {[
            {label:"Creados", value:totalCreados, color:"text-info"},
            {label:"Cerrados", value:totalCerrados, color:"text-danger"},
            {label:"Usuario", value:`👤 ${username}`, color:"text-warning"},
            {label:"Usuarios Activos", value:usuariosActivos, color:"text-success"}
          ].map((kpi,i)=>(
            <Col md={3} key={i}>
              <Card style={glassCard}>
                <Card.Body className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight:120 }}>
                  <small>{kpi.label}</small>
                  <h1 className={kpi.color} style={{ margin:0 }}>{kpi.value}</h1>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* GRÁFICOS */}
        <Row className="g-4 mb-5">
          <Col md={4}>
            <Card style={glassCard}>
              <Card.Body>
                <h6 className="text-center">Por Prioridad</h6>
                <ResponsiveContainer height={200}>
                  <PieChart>
                    <Pie data={priorityCounts} dataKey="value" innerRadius={40} outerRadius={80} label>
                      {priorityCounts.map((e,i)=><Cell key={i} fill={e.color}/>)}
                    </Pie>
                    <Tooltip/>
                    <Legend verticalAlign="bottom"/>
                  </PieChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card style={glassCard}>
              <Card.Body>
                <h6 className="text-center">Por Estado</h6>
                <ResponsiveContainer height={200}>
                  <PieChart>
                    <Pie data={statusCounts} dataKey="value" innerRadius={40} outerRadius={80} label>
                      {statusCounts.map((e,i)=><Cell key={i} fill={e.color}/>)}
                    </Pie>
                    <Tooltip/>
                    <Legend verticalAlign="bottom"/>
                  </PieChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card style={glassCard}>
              <Card.Body>
                <h6 className="text-center">Top Usuarios</h6>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    layout="vertical"
                    data={topUsersData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                  >
                    <XAxis type="number" tick={{ fill: "#fff" }} />
                    <YAxis dataKey="name" type="category" tick={{ fill: "#fff" }} width={100}/>
                    <Tooltip formatter={(v) => [v, "Incidentes Cerrados"]} />
                    <Bar dataKey="value" fill="#38bdf8" radius={[5, 5, 5, 5]}>
                      <LabelList dataKey="value" position="right" fill="#fff" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* FILTROS COMPACTOS */}
        <Card style={{...glassCard, padding:"8px 16px"}} className="mb-4">
          <Row className="align-items-center g-2">
            <Col xs="auto"><Form.Control size="sm" type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)}/></Col>
            <Col xs="auto"><Form.Control size="sm" type="date" value={toDate} onChange={e=>setToDate(e.target.value)}/></Col>
            <Col xs><Form.Control size="sm" placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)}/></Col>
            <Col xs="auto"><Button size="sm" variant="outline-light" onClick={exportPDF}>📄 Exportar PDF</Button></Col>
          </Row>
        </Card>

        {/* TABLA */}
        {loading ? <div className="text-center my-5"><Spinner animation="border" variant="light"/></div> : (
          <Card style={glassCard}>
            <Table responsive hover className="text-white align-middle">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Usuario</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Fecha Abierto</th>
                  <th>Fecha Cerrado</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(i=>(
                  <tr key={i.id}>
                    <td>{i.type}</td>
                    <td>{getUsername(i.created_by_id)}</td>
                    <td><Badge pill style={{backgroundColor:PRIORITY_COLORS[i.priority], color:"#fff"}}>{i.priority}</Badge></td>
                    <td><Badge pill style={{backgroundColor:STATUS_COLORS[i.status], color:"#fff"}}>{i.status}</Badge></td>
                    <td>{formatDate(i.created_at)}</td>
                    <td>{formatDate(i.closed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        )}

        {/* PAGINACIÓN */}
        {totalPages>1 && (
          <Pagination className="justify-content-center mt-4">
            {[...Array(totalPages)].map((_,i)=>
              <Pagination.Item key={i} active={i+1===page} onClick={()=>setPage(i+1)}>
                {i+1}
              </Pagination.Item>
            )}
          </Pagination>
        )}
      </div>
    </Container>
  );
}
