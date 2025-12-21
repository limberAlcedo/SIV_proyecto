import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Container, Row, Col, Card, Spinner, Table, Form, Button, Badge, Pagination
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

/* ================= COMPONENTE ================= */
export default function Reportes() {
  const [incidents, setIncidents] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10; // tabla ahora muestra 10

  const [trendRange, setTrendRange] = useState("today");

  const TOKEN = localStorage.getItem("token");

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
  const formatDate = d => d ? new Date(d).toLocaleString() : "—";

  const currentMonth = useMemo(() => {
    const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    return monthNames[new Date().getMonth()];
  }, []);

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
  const totalCreados = incidents.length;

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
        i.type, getUsername(i.created_by_id), i.priority, i.status, formatDate(i.created_at), formatDate(i.closed_at)
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

        {/* ==================== GRÁFICOS COMPACTOS ==================== */}
        <Row className="g-3 mb-3">
          {/* KPI Creados (Número) */}
          <Col xs={12} md={3}>
            <Card style={glassCard}>
              <Card.Body className="d-flex flex-column justify-content-center align-items-center">
                <h6>Creados</h6>
<span style={{ fontSize: "3rem", fontWeight: "700", color: CREATED_COLOR }}>{totalCreados}</span>
<span style={{ fontSize: "3rem", fontWeight: "700", color: "#fff", marginTop: "0.7rem" }}>{currentMonth}</span>

              </Card.Body>
            </Card>
          </Col>

          {/* Prioridad */}
          <Col xs={12} md={3}>
            <Card style={glassCard}>
              <Card.Body>
                <h6 className="text-center mb-1">Por Prioridad</h6>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={priorityCounts} dataKey="value" innerRadius={30} outerRadius={60} label={({percent,name})=>`${name}: ${(percent*100).toFixed(0)}%`}>
                      {priorityCounts.map((e,i)=> <Cell key={i} fill={PRIORITY_COLORS[e.name]}/>)}
                    </Pie>
                    <Tooltip formatter={v=>[v,"Incidentes"]}/>
                  </PieChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>

          {/* Estado */}
          <Col xs={12} md={3}>
            <Card style={glassCard}>
              <Card.Body>
                <h6 className="text-center mb-1">Por Estado</h6>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusCounts} dataKey="value" innerRadius={30} outerRadius={60} label>
                      {statusCounts.map((e,i)=> <Cell key={i} fill={{Abierto:"#22c55e", Cerrado:"#ef4444"}[e.name]}/>)}
                    </Pie>
                    <Tooltip formatter={v=>[v,"Incidentes"]}/>
                  </PieChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>

          {/* Top Usuarios */}
          <Col xs={12} md={3}>
            <Card style={glassCard}>
              <Card.Body>
                <h6 className="text-center mb-1">Top Usuarios</h6>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    layout="vertical"
                    data={topUsersData}
                    margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fill: "#fff", fontSize: 12 }}
                      width={80}
                    />
                    <Bar dataKey="value" fill="#38bdf8" radius={[5,5,5,5]}>
                      <LabelList
                        dataKey="value"
                        position="inside"
                        fill="#fff"
                        fontSize={12}
                        formatter={v => v}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>




        {/* ==================== Gráfico Tendencia ==================== */}
        <Card style={glassCard} className="mb-4">
          <Card.Body>
            <Row className="mb-2 align-items-center">
              <Col><h6 className="text-center">Tiempo de Respuesta vs Incidentes Cerrados</h6></Col>
              <Col xs="auto">
                <Form.Select size="sm" value={trendRange} onChange={e=>setTrendRange(e.target.value)}>
                  <option value="today">Hoy</option>
                  <option value="week">Últimos 7 días</option>
                  <option value="month">Mes actual</option>
                </Form.Select>
              </Col>
            </Row>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData} margin={{ top: 20, right: 40, left: 10, bottom: 5 }}>
                <XAxis dataKey="date" tick={{ fill: "#fff" }} />
                <YAxis yAxisId="left" tick={{ fill: "#fff" }} label={{ value: "Horas", angle: -90, position: "insideLeft", fill:"#facc15" }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "#fff" }} label={{ value: "Cerrados", angle: 90, position: "insideRight", fill:"#38bdf8" }} />
                <Tooltip formatter={(v, n) => n === "avgHours" ? [`${v.toFixed(2)} h`, "Tiempo promedio"] : [v, "Cerrados"]} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="avgHours" name="Tiempo promedio" stroke="#facc15" strokeWidth={3} dot={{ r: 5 }} />
                <Line yAxisId="right" type="monotone" dataKey="total" name="Incidentes cerrados" stroke="#38bdf8" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card.Body>
        </Card>

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
                </tr>
              </thead>
              <tbody>
                {paginated.map((i,index)=>(
                  <motion.tr
                    key={i.id}
                    initial={{ opacity:0, y:15 }}
                    animate={{ opacity:1, y:0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td>{i.type}</td>
                    <td>{getUsername(i.created_by_id)}</td>
                    <td><Badge pill style={{ background: PRIORITY_GRADIENTS[i.priority], color:"#fff", fontWeight:600, padding:"0.4em 0.8em" }}>{i.priority}</Badge></td>
                    <td><Badge pill style={{ background: STATUS_GRADIENTS[i.status], color:"#fff", fontWeight:600, padding:"0.4em 0.8em" }}>{i.status}</Badge></td>
                    <td>{formatDate(i.created_at)}</td>
                    <td>{formatDate(i.closed_at)}</td>
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
      </div>
    </Container>
  );
}
