from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date, time

from app import crud, schemas, models
from app.api.routes.dependencies import get_db, require_roles

router = APIRouter(tags=["Incidentes"])

# ---------------------------
# Auxiliar para listas
# ---------------------------
def fix_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]

# ---------------------------
# GET todos los incidentes
# ---------------------------
@router.get("/", response_model=List[schemas.IncidenteResponse])
def get_incidentes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "supervisor", "operador"))
):
    incidencias = crud.get_incidentes(db)
    for inc in incidencias:
        inc.pista = fix_list(inc.pista)
        inc.trabajos_via = fix_list(inc.trabajos_via)
        inc.created_by_name = inc.creador.name if inc.creador else "Desconocido"
        inc.closed_by_name = inc.cerrador.name if inc.cerrador else "-"
    return incidencias

# ---------------------------
# GET por ID
# ---------------------------
@router.get("/{incidente_id}/", response_model=schemas.IncidenteResponse)
def get_incidente(
    incidente_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "supervisor", "operador"))
):
    inc = crud.get_incidente(db, incidente_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")

    # Operadores pueden ver todos los incidentes
    inc.pista = fix_list(inc.pista)
    inc.trabajos_via = fix_list(inc.trabajos_via)
    inc.created_by_name = inc.creador.name if inc.creador else "Desconocido"
    inc.closed_by_name = inc.cerrador.name if inc.cerrador else "-"
    return inc

# ---------------------------
# POST crear incidente
# ---------------------------
@router.post("/", response_model=schemas.IncidenteResponse)
def create_incidente(
    incidente: schemas.IncidenteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "supervisor", "operador"))
):
    db_incidente = crud.create_incidente(db, incidente)
    db_incidente.created_by_id = current_user.id
    db_incidente.created_at = datetime.utcnow()
    db.commit()
    db.refresh(db_incidente)
    return db_incidente

# ---------------------------
# PUT actualizar incidente
# ---------------------------
@router.put("/{incidente_id}/", response_model=schemas.IncidenteResponse)
def update_incidente(
    incidente_id: int,
    data: schemas.IncidenteUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "supervisor", "operador"))
):
    inc = crud.get_incidente(db, incidente_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")

    # Operador no puede editar incidentes cerrados
    if current_user.role.name.lower() == "operador" and inc.status == "Cerrado":
        raise HTTPException(status_code=403, detail="No puedes editar un incidente cerrado")

    updated_inc = crud.update_incidente(db, incidente_id, data)
    if not updated_inc:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")
    return updated_inc

# ---------------------------
# PATCH cerrar incidente
# ---------------------------
@router.patch("/cerrar/{incidente_id}/", response_model=schemas.IncidenteResponse)
def close_incidente(
    incidente_id: int,
    close_by_id: int,
    end_date: Optional[date] = None,
    end_time: Optional[time] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "supervisor", "operador"))
):
    inc = crud.get_incidente(db, incidente_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")

    if not end_date or not end_time:
        raise HTTPException(status_code=400, detail="Fecha y hora de cierre son obligatorias")

    inc.status = "Cerrado"
    inc.close_by_id = close_by_id
    inc.closed_at = datetime.combine(end_date, end_time)
    db.commit()
    db.refresh(inc)
    return inc

# ---------------------------
# GET conteo por prioridad
# ---------------------------
@router.get("/prioridad/", response_model=List[dict])
def get_prioridad_counts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "supervisor", "operador"))
):
    prioridades = ["Alta", "Media", "Baja"]
    counts = []
    for p in prioridades:
        total = db.query(models.Incidente).filter(models.Incidente.priority == p).count()
        counts.append({"name": p, "value": total})
    return counts
