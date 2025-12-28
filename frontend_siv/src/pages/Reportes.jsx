import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Container, Row, Col, Card, Spinner, Table, Form, Button, Badge, Pagination, Modal
} from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, LabelList
} from "recharts";

// ================= IMPORTAR FUNCIONES DEL API =================
import { fetchIncidentes, fetchUsuarios, cerrarIncidenteAPI } from "../api/api";

// ================= IMPORTAR CSS =================
import "../styles/Reportes.css";

/* ================= HELPER FECHAS ================= */
const formatChileDate = (d, customDate = null) => {
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

  /* ================= MODAL EDIT ================= */
  const [showEditModal, setShowEditModal] = useState(false);
  const [incidentToEdit, setIncidentToEdit] = useState(null);

  const handleEditIncident = (incident) => {
    setIncidentToEdit(incident);
    setShowEditModal(true);
  };
  const handleCloseModal = () => { setIncidentToEdit(null); setShowEditModal(false); };

  /* ================= FETCH ================= */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [incData, userData] = await Promise.all([
        fetchIncidentes(),
        fetchUsuarios()
      ]);
      setIncidents(incData);
      setUsuarios(userData);
    } catch (err) {
      console.error(err);
      toast.error(`❌ ${err.response?.data?.detail || err.message || "Error al cargar datos"}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [search, fromDate, toDate]);

  /* ================= HELPERS ================= */
  const userMap = useMemo(() => {
    const map = new Map();
    usuarios.forEach(u => map.set(u.id, u.username));
    return map;
  }, [usuarios]);
  const getUsername = id => userMap.get(id) || "—";

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
  const paginated = filteredIncidents.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  /* ================= KPI / GRÁFICOS ================= */
  const priorityCounts = useMemo(() => ["Alta", "Media", "Baja"].map(p => ({
    name: p, value: incidents.filter(i => i.priority === p).length
  })), [incidents]);

  const statusCounts = useMemo(() => ["Abierto", "Cerrado"].map(s => ({
    name: s, value: incidents.filter(i => i.status === s).length
  })), [incidents]);

  // ✅ TOP 3 USUARIOS CERRADOS
  const topUsersData = useMemo(() =>
    usuarios
      .map(u => ({
        name: u.username,
        value: incidents.filter(i => i.created_by_id === u.id && i.status === "Cerrado").length
      }))
      .filter(u => u.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3),  // <-- Top 3
    [usuarios, incidents]
  );

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

      if (!map.has(dateKey)) map.set(dateKey, { total: 0, sumHours: 0 });
      const obj = map.get(dateKey);
      obj.total += 1;
      obj.sumHours += diffHours;
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, obj]) => ({ date, total: obj.total, avgHours: obj.sumHours / obj.total }))
      .length ? Array.from(map.entries())
        .sort(([a], [b]) => new Date(a) - new Date(b))
        .map(([date, obj]) => ({ date, total: obj.total, avgHours: obj.sumHours / obj.total }))
      : [{ date: today.toLocaleDateString(), total: 0, avgHours: 0 }];
  }, [incidents, trendRange]);

  /* ================= PDF ================= */
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Reporte de Incidentes", 14, 18);
    autoTable(doc, {
      startY: 28,
      head: [["Tipo", "Usuario", "Prioridad", "Estado", "Fecha Abierto", "Fecha Cerrado"]],
      body: filteredIncidents.map(i => [
        i.type, getUsername(i.created_by_id), i.priority, i.status, formatChileDate(i.created_at), formatChileDate(i.closed_at, i.custom_closed_at)
      ]),
      styles: { fontSize: 8 }
    });
    doc.save("reporte_incidentes.pdf");
  };

  /* ==================== RENDER ==================== */
  return (
    <Container fluid className="reportes-container">
      <div className="reportes-wrapper">
        <ToastContainer autoClose={2500} />
        <motion.h2 className="reportes-title" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>📊 Reportes de Incidentes</motion.h2>

        {/* KPIs / GRÁFICOS */}
        <Row className="g-3 mb-4">
          <Col md={4}>
            <Card className="glass-card glass-card-padding">
              <h6 className="text-white mb-2">Prioridad</h6>
              <ResponsiveContainer width="100%" height={225}>
                <PieChart>
                  <Pie data={priorityCounts} dataKey="value" nameKey="name" outerRadius={70} label>
                    {priorityCounts.map((entry, index) => (
                      <Cell key={index} fill={entry.name === "Alta" ? "#ef4444" : entry.name === "Media" ? "#facc15" : "#10b981"} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="glass-card glass-card-padding">
              <h6 className="text-white mb-2">Estado</h6>
              <ResponsiveContainer width="100%" height={225}>
                <PieChart>
                  <Pie data={statusCounts} dataKey="value" nameKey="name" outerRadius={70} label>
                    {statusCounts.map((entry, index) => (
                      <Cell key={index} fill={entry.name === "Abierto" ? "#22c55e" : "#ef4444"} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* ✅ Top 3 Usuarios */}
          <Col md={4}>
            <Card className="glass-card glass-card-padding">
              <h6 className="text-white mb-2" style={{ textAlign: "center", fontWeight: 600 }}>Top 3 Usuarios (Cerrados)</h6>
              <ResponsiveContainer width="100%" height={225}>
                <BarChart data={topUsersData} margin={{ top: 30, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#fff" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#fff" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: 8 }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="value" fill="#38bdf8" radius={[6, 6, 0, 0]} barSize={50}>
                    <LabelList dataKey="value" position="top" fill="#fff" fontWeight={600} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        {/* FILTROS */}
        <Card className="glass-card mb-4 glass-card-padding">
          <Row className="align-items-center g-2">
            <Col xs={12} sm="auto"><Form.Control size="sm" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} /></Col>
            <Col xs={12} sm="auto"><Form.Control size="sm" type="date" value={toDate} onChange={e => setToDate(e.target.value)} /></Col>
            <Col xs={12} sm><Form.Control size="sm" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} /></Col>
            <Col xs={12} sm="auto"><Button size="sm" variant="outline-light" onClick={exportPDF}>📄 Exportar PDF</Button></Col>
          </Row>
        </Card>

        {/* Tabla y resto del componente */}
        {loading ? <div className="text-center my-5"><Spinner animation="border" variant="light" /></div> : (
          <Card className="glass-card glass-card-table">
            <Table responsive hover className="align-middle mb-0 text-white table-minwidth">
              <thead className="table-dark text-uppercase">
                <tr>
                  <th>Tipo</th><th>Usuario</th><th>Prioridad</th><th>Estado</th><th>Fecha Abierto</th><th>Fecha Cerrado</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((i, index) => (
                  <motion.tr key={i.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                    <td>{i.type}</td>
                    <td>{getUsername(i.created_by_id)}</td>
                    <td><Badge pill className={`badge-priority-${i.priority.toLowerCase()}`}>{i.priority}</Badge></td>
                    <td><Badge pill className={`badge-status-${i.status.toLowerCase()}`}>{i.status}</Badge></td>
                    <td>{formatChileDate(i.created_at)}</td>
                    <td>{formatChileDate(i.closed_at, i.custom_closed_at)}</td>
                    <td><Button size="sm" variant="warning" className="ms-2" onClick={() => handleEditIncident(i)}>Editar</Button></td>
                  </motion.tr>
                ))}
              </tbody>
            </Table>
          </Card>
        )}

        {/* PAGINACIÓN */}
        {totalPages > 1 && (
          <Pagination className="justify-content-center mt-3">
            <Pagination.First onClick={() => setPage(1)} disabled={page === 1} />
            <Pagination.Prev onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1} />
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Pagination.Item key={p} active={p === page} onClick={() => setPage(p)}>{p}</Pagination.Item>
            ))}
            <Pagination.Next onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages} />
            <Pagination.Last onClick={() => setPage(totalPages)} disabled={page === totalPages} />
          </Pagination>
        )}

        {/* MODAL */}
        <Modal show={showEditModal} onHide={handleCloseModal} size="lg" centered>
          <Modal.Header closeButton><Modal.Title>Editar Incidente</Modal.Title></Modal.Header>
          <Modal.Body>
            {incidentToEdit ? (
              <Form onSubmit={async (e) => {
                e.preventDefault();
                const updated = {
                  type: e.target.type.value,
                  priority: e.target.priority.value,
                  status: e.target.status.value
                };
                try {
                  await cerrarIncidenteAPI(incidentToEdit.id, updated);
                  toast.success("✅ Incidente actualizado");
                  fetchData();
                  handleCloseModal();
                } catch {
                  toast.error("❌ Error al actualizar");
                }
              }}>
                <Form.Group className="mb-2"><Form.Label>Tipo</Form.Label><Form.Control name="type" defaultValue={incidentToEdit.type} /></Form.Group>
                <Form.Group className="mb-2"><Form.Label>Prioridad</Form.Label>
                  <Form.Select name="priority" defaultValue={incidentToEdit.priority}>
                    <option>Alta</option><option>Media</option><option>Baja</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-2"><Form.Label>Estado</Form.Label>
                  <Form.Select name="status" defaultValue={incidentToEdit.status}>
                    <option>Abierto</option><option>Cerrado</option>
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
