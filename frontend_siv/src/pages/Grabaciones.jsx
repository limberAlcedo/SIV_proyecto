import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Container, Row, Col, Card, Spinner, Form, Button, Pagination, OverlayTrigger, Tooltip
} from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";

const BACKEND_URL = "http://127.0.0.1:8000";

const glassCard = {
  background: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "#fff",
  borderRadius: 16
};
const bgGradient = "linear-gradient(135deg, #0f172a, #1a3776, #0a3098)";

export default function GrabacionesMini() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedCamera, setSelectedCamera] = useState(""); // solo cámara
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/videos/`);
      const data = await res.json();
      setVideos(data.map(v => ({
        id: v.id,
        cameraName: `Cámara ${v.camera_id}`,
        user: v.username || `Usuario ${v.camera_id}`,
        date: v.upload_time?.slice(0, 10),
        startTime: v.upload_time?.slice(11,16),
        url: `${BACKEND_URL}/videos/${v.filename}`,
        type: v.event_type || "manual"
      })));
    } catch {
      toast.error("❌ Error al cargar grabaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);
  useEffect(() => { setPage(1); }, [search, fromDate, toDate, selectedCamera]);

  const filteredVideos = useMemo(() => 
    videos
      .filter(v => search ? (v.cameraName + v.type + v.user).toLowerCase().includes(search.toLowerCase()) : true)
      .filter(v => fromDate ? v.date >= fromDate : true)
      .filter(v => toDate ? v.date <= toDate : true)
      .filter(v => selectedCamera ? v.cameraName === selectedCamera : true)
  , [videos, search, fromDate, toDate, selectedCamera]);

  const totalPages = Math.ceil(filteredVideos.length / ITEMS_PER_PAGE);
  const paginated = filteredVideos.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);

  const handleDownload = (url, filename) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  const cameras = Array.from(new Set(videos.map(v => v.cameraName)));

  const renderPagination = () => {
    const pages = [];
    let start = Math.max(1, page-2);
    let end = Math.min(totalPages, page+2);

    if(start > 1) pages.push(<Pagination.First key="first" onClick={()=>setPage(1)} />);
    for(let i=start; i<=end; i++) {
      pages.push(<Pagination.Item key={i} active={i===page} onClick={()=>setPage(i)}>{i}</Pagination.Item>);
    }
    if(end < totalPages) pages.push(<Pagination.Last key="last" onClick={()=>setPage(totalPages)} />);
    return pages;
  };

  return (
    <Container fluid style={{ minHeight:"100vh", background:bgGradient }}>
      <div style={{ maxWidth:1400, margin:"0 auto", padding:16 }}>
        <ToastContainer autoClose={2500} />

        <motion.h2 className="text-center text-warning mb-4" initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}}>
          📹 Grabaciones
        </motion.h2>

        {/* FILTROS: fecha, cámara y búsqueda */}
        <Card style={{ ...glassCard, padding:"6px 12px" }} className="mb-3">
          <Card.Body className="d-flex flex-wrap gap-2 align-items-center justify-content-center p-1">
            <Form.Control 
              size="sm" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} 
              style={{ width: "130px", fontSize:"0.75rem", padding:"2px 4px" }}
            />
            <Form.Control 
              size="sm" type="date" value={toDate} onChange={e => setToDate(e.target.value)} 
              style={{ width: "130px", fontSize:"0.75rem", padding:"2px 4px" }}
            />
            <Form.Select size="sm" value={selectedCamera} onChange={e=>setSelectedCamera(e.target.value)} style={{ width:"150px", fontSize:"0.75rem" }}>
              <option value="">Todas las cámaras</option>
              {cameras.map((c,i)=><option key={i} value={c}>{c}</option>)}
            </Form.Select>
            <Form.Control 
              size="sm" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} 
              style={{ width: "200px", fontSize:"0.85rem", padding:"4px 6px" }}
            />
            <Button size="sm" variant="outline-light" onClick={() => { setFromDate(""); setToDate(""); setSearch(""); setSelectedCamera(""); }} style={{ fontSize:"0.75rem" }}>
              Limpiar
            </Button>
          </Card.Body>
        </Card>

        {/* GRID DE VIDEOS MINI */}
        {loading ? <div className="text-center my-5"><Spinner animation="border" variant="light"/></div> : (
          <Row className="g-2">
            {paginated.length === 0 && <div className="col-12 text-center">No hay grabaciones</div>}
            {paginated.map(v => (
              <Col key={v.id} xs={6} sm={4} md={3} lg={2}>
                <Card className="h-100" style={{...glassCard, cursor:"pointer", transition:"0.3s", overflow:"hidden"}} 
                  onMouseEnter={e=>e.currentTarget.style.transform="scale(1.03)"} 
                  onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                  <video
                    src={v.url}
                    style={{ width: "100%", height: 90, objectFit: "cover", borderTopLeftRadius:16, borderTopRightRadius:16 }}
                    controls
                  />
                  <Card.Body className="p-1 text-center" style={{ fontSize: "0.7rem" }}>
                    <div><strong>{v.cameraName}</strong></div>
                    <div>{v.user}</div>
                    <div>{v.date} {v.startTime}</div>
                    <div>{v.type}</div>
                    <OverlayTrigger placement="top" overlay={<Tooltip>Descargar video</Tooltip>}>
                      <Button size="sm" variant="outline-light" className="mt-1" onClick={()=>handleDownload(v.url, `video_${v.id}.mp4`)}>⬇️</Button>
                    </OverlayTrigger>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* PAGINACIÓN */}
        {totalPages>1 && <Pagination className="justify-content-center mt-3">
          {renderPagination()}
        </Pagination>}
      </div>
    </Container>
  );
}
