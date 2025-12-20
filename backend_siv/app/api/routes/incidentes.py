# app/api/routes/incidentes.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas
from app.database import get_db
from app.api.routes.dependencies import require_roles

router = APIRouter(prefix="/api/incidentes", tags=["Incidentes"])

# ---------------------------
# Auxiliar
# ---------------------------
def fix_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]

# ---------------------------
# GET todos (con roles)
# ---------------------------
@router.get("/", response_model=List[schemas.IncidenteResponse])
def get_incidentes(
    db: Session = Depends(get_db),
    current_user = Depends(require_roles("admin", "supervisor", "operador"))
):
    incidentes = crud.get_incidentes(db)
    
    # Operador ve solo abiertos
    if current_user.role.name == "operador":
        incidentes = [inc for inc in incidentes if inc.status == "Activo"]
    
    for inc in incidentes:
        inc.pista = fix_list(inc.pista)
        inc.trabajos_via = fix_list(inc.trabajos_via)
    return incidentes

# ---------------------------
# GET por ID
# ---------------------------
@router.get("/{incidente_id}/", response_model=schemas.IncidenteResponse)
def get_incidente(
    incidente_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles("admin", "supervisor", "operador"))
):
    inc = crud.get_incidente(db, incidente_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")
    
    # Operador no ve cerrados
    if current_user.role.name == "operador" and inc.status != "Activo":
        raise HTTPException(status_code=403, detail="No tienes permiso para ver este incidente")
    
    inc.pista = fix_list(inc.pista)
    inc.trabajos_via = fix_list(inc.trabajos_via)
    return inc

# ---------------------------
# POST crear (todos menos quien no tiene permiso)
# ---------------------------
@router.post("/", response_model=schemas.IncidenteResponse)
def create_incidente(
    incidente: schemas.IncidenteCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles("admin", "supervisor", "operador"))
):
    db_incidente = crud.create_incidente(db, incidente)
    # Registrar quien crea
    db_incidente.created_by_id = current_user.id
    db_incidente.created_by = current_user.username
    db.commit()
    db.refresh(db_incidente)
    return db_incidente

# ---------------------------
# PUT actualizar (solo admin/supervisor)
# ---------------------------
@router.put("/{incidente_id}/", response_model=schemas.IncidenteResponse)
def update_incidente(
    incidente_id: int,
    data: schemas.IncidenteUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles("admin", "supervisor"))
):
    inc = crud.update_incidente(db, incidente_id, data)
    if not inc:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")
    return inc

# ---------------------------
# PATCH cerrar (solo admin/supervisor)
# ---------------------------
@router.patch("/cerrar/{incidente_id}/", response_model=schemas.IncidenteResponse)
def close_incidente(
    incidente_id: int,
    cerrado_por_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles("admin", "supervisor"))
):
    inc = crud.close_incidente(db, incidente_id, cerrado_por_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")
    return inc
