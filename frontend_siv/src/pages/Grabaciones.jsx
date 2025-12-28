import React, { useState, useEffect, useMemo, useRef } from "react";
import { Container, Row, Col, Card, Spinner, Form, Button, Pagination, OverlayTrigger, Tooltip, Modal, Badge } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import { fetchVideos } from "../api/api.js";  // <-- importamos tu API

const glassCard = { /* mismo estilo que antes */ };
const overlayStyle = { /* mismo estilo que antes */ };
const bgGradient = "linear-gradient(135deg, #0f172a, #1a3776, #0a3098)";

export default function Grabaciones() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedCamera, setSelectedCamera] = useState("");
  const [page, setPage] = useState(1);
  const [modalVideo, setModalVideo] = useState(null);
  const videoRefs = useRef({});
  const hoverTimeouts = useRef({});
  const ITEMS_PER_PAGE = 24;

  // ---------------------------
  // Traer videos desde API
  // ---------------------------
  const loadVideos = async () => {
    setLoading(true);
    try {
      const data = await fetchVideos();
      setVideos(data);
    } catch {
      toast.error("❌ Error al cargar grabaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVideos(); }, []);
  useEffect(() => { setPage(1); }, [search, fromDate, toDate, selectedCamera]);

  // ---------------------------
  // Filtrado y ordenamiento
  // ---------------------------
  const filteredVideos = useMemo(() =>
    videos
      .filter(v => search ? (v.cameraName + v.type + v.username).toLowerCase().includes(search.toLowerCase()) : true)
      .filter(v => fromDate ? v.date >= fromDate : true)
      .filter(v => toDate ? v.date <= toDate : true)
      .filter(v => selectedCamera ? v.cameraName === selectedCamera : true)
    , [videos, search, fromDate, toDate, selectedCamera]);

  const sortedVideos = useMemo(() =>
    filteredVideos.sort((a, b) => new Date(b.fullDateTime) - new Date(a.fullDateTime))
    , [filteredVideos]);

  const totalPages = Math.ceil(sortedVideos.length / ITEMS_PER_PAGE);
  const paginated = sortedVideos.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleDownload = async (url, filename) => {
    if (!url) return toast.error("❌ URL inválida");
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error descargando el video");
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename || "video.mp4";
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`✅ Descarga iniciada: ${filename}`);
    } catch {
      toast.error("❌ No se pudo descargar el video");
    }
  };

  const cameras = Array.from(new Set(videos.map(v => v.cameraName)));

  const renderPagination = () => {
    const pages = [];
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, page + 2);
    if (start > 1) pages.push(<Pagination.First key="first" onClick={() => setPage(1)} />);
    for (let i = start; i <= end; i++) pages.push(<Pagination.Item key={i} active={i === page} onClick={() => setPage(i)}>{i}</Pagination.Item>);
    if (end < totalPages) pages.push(<Pagination.Last key="last" onClick={() => setPage(totalPages)} />);
    return pages;
  };

  const typeColor = (type) => {
    switch (type.toLowerCase()) {
      case "manual": return "warning";
      case "automatico": return "info";
      default: return "light";
    }
  };

  const handleMouseEnter = (id) => {
    const video = videoRefs.current[id];
    if (!video) return;
    video.onloadedmetadata = () => {
      const maxStart = Math.max(0, video.duration - 3);
      const startTime = Math.random() * maxStart;
      video.currentTime = startTime;
      video.play();
    };
    hoverTimeouts.current[id] = setTimeout(() => { if (video) { video.pause(); video.currentTime = 0; } }, 3000);
  };
  const handleMouseLeave = (id) => {
    const video = videoRefs.current[id];
    if (video) { video.pause(); video.currentTime = 0; }
    if (hoverTimeouts.current[id]) { clearTimeout(hoverTimeouts.current[id]); delete hoverTimeouts.current[id]; }
  };

  return (
    <Container fluid style={{ minHeight: "100vh", background: bgGradient, paddingTop: 20 }}>
      <ToastContainer autoClose={2500} />
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 16 }}>
        <motion.h2 className="text-center text-warning mb-4" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          📹 Grabaciones
        </motion.h2>

        {/* FILTROS */}
        <Card style={{ ...glassCard, padding: "10px 16px", marginBottom: 20, background: "rgba(255,255,255,0.08)" }}>
          <Card.Body className="d-flex flex-wrap gap-3 align-items-center justify-content-center p-2">
            <Form.Control size="sm" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ width: 150, fontSize: "1rem", padding: "6px 8px", borderRadius: 10 }} />
            <Form.Control size="sm" type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ width: 150, fontSize: "1rem", padding: "6px 8px", borderRadius: 10 }} />
            <Form.Select size="sm" value={selectedCamera} onChange={e => setSelectedCamera(e.target.value)} style={{ width: 170, fontSize: "1rem", padding: "6px 8px", borderRadius: 10 }}>
              <option value="">Todas las cámaras</option>
              {cameras.map((c, i) => <option key={i} value={c}>{c}</option>)}
            </Form.Select>
            <Form.Control size="sm" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220, fontSize: "1rem", padding: "6px 8px", borderRadius: 10 }} />
            <Button size="sm" variant="outline-light" onClick={() => { setFromDate(""); setToDate(""); setSearch(""); setSelectedCamera(""); }} style={{ fontSize: "1rem", padding: "6px 12px", borderRadius: 10 }}>Limpiar</Button>
          </Card.Body>
        </Card>

        {/* GRID DE VIDEOS */}
        {loading ? <div className="text-center my-5"><Spinner animation="border" variant="light" /></div> : (
          <Row className="g-3">
            {paginated.length === 0 && <div className="col-12 text-center text-white">No hay grabaciones</div>}
            {paginated.map(v => (
              <Col key={v.id} xs={6} sm={4} md={3} lg={2}>
                <Card style={glassCard} onMouseEnter={() => handleMouseEnter(v.id)} onMouseLeave={() => handleMouseLeave(v.id)} onClick={() => v.url && setModalVideo(v)}>
                  <video ref={el => videoRefs.current[v.id] = el} src={v.url || ""} style={{ width: "100%", height: 130, objectFit: "cover", borderRadius: 20 }} muted loop />
                  <div className="overlay" style={overlayStyle}>
                    <div>
                      <div><strong>{v.cameraName}</strong></div>
                      <div>{v.username}</div>
                      <div>
                        <OverlayTrigger placement="top" overlay={<Tooltip>{v.fullDateTime}</Tooltip>}><span>{v.date} {v.startTime}</span></OverlayTrigger>
                      </div>
                      <Badge bg={typeColor(v.type)} style={{ fontSize: "0.7rem", marginTop: 4 }}>{v.type}</Badge>
                    </div>
                    <div className="d-flex justify-content-center gap-1 mt-1">
                      <Button size="sm" variant="outline-light" onClick={e => { e.stopPropagation(); handleDownload(v.url, v.filename) }}>⬇️</Button>
                      <Button size="sm" variant="outline-light" onClick={e => { e.stopPropagation(); v.url && navigator.clipboard.writeText(v.url); toast.success("📋 Copiado al portapapeles"); }}>🔗</Button>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {totalPages > 1 && <Pagination className="justify-content-center mt-4">{renderPagination()}</Pagination>}

        <Modal show={!!modalVideo} onHide={() => setModalVideo(null)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>{modalVideo?.filename || "Video"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>{modalVideo && <video src={modalVideo.url || ""} controls style={{ width: "100%" }} />}</Modal.Body>
        </Modal>
      </div>
      <style>{`.hover-card:hover .overlay { opacity: 1; }`}</style>
    </Container>
  );
}
