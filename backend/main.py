from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import requests
import os
from datetime import date, datetime

from database import SessionLocal, engine
import models
import schemas

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="MIRA - Medical Intelligence Robotic Automation", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_ai_health_prediction(glucose: float, haemoglobin: float, cholesterol: float) -> str:
    """
    Calls Google Gemini API to predict health conditions.
    Falls back to rule-based scoring if API key is missing or call fails.
    """
    try:
        api_key = os.getenv("GEMINI_API_KEY", "")
        if api_key:
            prompt = (
                f"You are a clinical decision support assistant. Analyze these blood test results "
                f"and provide a brief 2-3 sentence health risk assessment:\n"
                f"- Glucose: {glucose} mg/dL (normal fasting: 70-100)\n"
                f"- Haemoglobin: {haemoglobin} g/dL (normal: 12-17.5)\n"
                f"- Cholesterol: {cholesterol} mg/dL (optimal: <200)\n"
                f"Be factual, professional, and concise. Mention possible conditions or risks only."
            )
            response = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}",
                json={"contents": [{"parts": [{"text": prompt}]}]},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception:
        pass

    # Fallback: Rule-based clinical scoring system
    remarks = []
    risk_level = "Low"
    risk_count = 0

    # Glucose analysis
    if glucose < 70:
        remarks.append("Hypoglycaemia detected — glucose critically low")
        risk_count += 2
    elif 70 <= glucose <= 99:
        remarks.append("Fasting glucose within normal range")
    elif 100 <= glucose <= 125:
        remarks.append("Pre-diabetic glucose level — lifestyle intervention advised")
        risk_count += 1
    else:
        remarks.append("Hyperglycaemia — possible Type 2 Diabetes; further testing recommended")
        risk_count += 2

    # Haemoglobin analysis
    if haemoglobin < 8:
        remarks.append("Severe anaemia — urgent haematology referral indicated")
        risk_count += 3
    elif 8 <= haemoglobin < 12:
        remarks.append("Mild-to-moderate anaemia — iron/B12 panel advised")
        risk_count += 1
    elif 12 <= haemoglobin <= 17.5:
        remarks.append("Haemoglobin within normal range")
    else:
        remarks.append("Elevated haemoglobin — possible polycythaemia or dehydration")
        risk_count += 1

    # Cholesterol analysis
    if cholesterol < 200:
        remarks.append("Total cholesterol optimal")
    elif 200 <= cholesterol <= 239:
        remarks.append("Borderline-high cholesterol — dietary modification recommended")
        risk_count += 1
    else:
        remarks.append("High cholesterol — cardiovascular risk elevated; statin therapy to be considered")
        risk_count += 2

    # Overall risk
    if risk_count == 0:
        risk_level = "Low"
    elif risk_count <= 2:
        risk_level = "Moderate"
    else:
        risk_level = "High"

    summary = f"[Overall Risk: {risk_level}] " + " | ".join(remarks)
    return summary


# ── CRUD Routes ──────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    return {"message": "MIRA API is running", "version": "1.0.0"}


@app.get("/patients", response_model=List[schemas.PatientOut], tags=["Patients"])
def list_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Patient).offset(skip).limit(limit).all()


@app.post("/patients", response_model=schemas.PatientOut, status_code=201, tags=["Patients"])
def create_patient(patient: schemas.PatientCreate, db: Session = Depends(get_db)):
    # Check for duplicate email
    existing = db.query(models.Patient).filter(models.Patient.email == patient.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A patient with this email already exists.")

    # Get AI prediction
    remarks = get_ai_health_prediction(patient.glucose, patient.haemoglobin, patient.cholesterol)

    db_patient = models.Patient(
        full_name=patient.full_name,
        date_of_birth=patient.date_of_birth,
        email=patient.email,
        glucose=patient.glucose,
        haemoglobin=patient.haemoglobin,
        cholesterol=patient.cholesterol,
        remarks=remarks,
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient


@app.get("/patients/{patient_id}", response_model=schemas.PatientOut, tags=["Patients"])
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")
    return patient


@app.put("/patients/{patient_id}", response_model=schemas.PatientOut, tags=["Patients"])
def update_patient(patient_id: int, updates: schemas.PatientCreate, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    # Check email uniqueness (excluding this patient)
    existing = db.query(models.Patient).filter(
        models.Patient.email == updates.email,
        models.Patient.id != patient_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Another patient already uses this email.")

    # Regenerate AI remarks on update
    remarks = get_ai_health_prediction(updates.glucose, updates.haemoglobin, updates.cholesterol)

    patient.full_name = updates.full_name
    patient.date_of_birth = updates.date_of_birth
    patient.email = updates.email
    patient.glucose = updates.glucose
    patient.haemoglobin = updates.haemoglobin
    patient.cholesterol = updates.cholesterol
    patient.remarks = remarks
    patient.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(patient)
    return patient


@app.delete("/patients/{patient_id}", tags=["Patients"])
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")
    db.delete(patient)
    db.commit()
    return {"message": f"Patient '{patient.full_name}' deleted successfully."}


@app.get("/stats", tags=["Dashboard"])
def get_stats(db: Session = Depends(get_db)):
    total = db.query(models.Patient).count()
    patients = db.query(models.Patient).all()
    high_glucose = sum(1 for p in patients if p.glucose > 125)
    high_cholesterol = sum(1 for p in patients if p.cholesterol >= 240)
    anaemia = sum(1 for p in patients if p.haemoglobin < 12)
    return {
        "total_patients": total,
        "high_glucose_count": high_glucose,
        "high_cholesterol_count": high_cholesterol,
        "anaemia_count": anaemia,
    }
