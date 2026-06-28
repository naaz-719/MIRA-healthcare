from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from datetime import date, datetime
from typing import Optional


class PatientCreate(BaseModel):
    full_name: str
    date_of_birth: date
    email: EmailStr
    glucose: float
    haemoglobin: float
    cholesterol: float

    @field_validator("full_name")
    @classmethod
    def name_must_not_be_empty(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("Full name cannot be empty.")
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters.")
        return v

    @field_validator("date_of_birth")
    @classmethod
    def dob_cannot_be_future(cls, v):
        if v > date.today():
            raise ValueError("Date of birth cannot be a future date.")
        return v

    @field_validator("glucose")
    @classmethod
    def glucose_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("Glucose must be a positive number.")
        if v > 1000:
            raise ValueError("Glucose value seems unrealistically high (max 1000 mg/dL).")
        return v

    @field_validator("haemoglobin")
    @classmethod
    def haemoglobin_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("Haemoglobin must be a positive number.")
        if v > 30:
            raise ValueError("Haemoglobin value seems unrealistically high (max 30 g/dL).")
        return v

    @field_validator("cholesterol")
    @classmethod
    def cholesterol_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("Cholesterol must be a positive number.")
        if v > 1000:
            raise ValueError("Cholesterol value seems unrealistically high (max 1000 mg/dL).")
        return v


class PatientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    date_of_birth: date
    email: str
    glucose: float
    haemoglobin: float
    cholesterol: float
    remarks: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
