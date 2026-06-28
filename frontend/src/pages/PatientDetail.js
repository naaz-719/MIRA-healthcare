import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit2, Trash2, ArrowLeft, Brain, Calendar, Mail, Droplets, Activity, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { patientService } from '../services/api';
import './PatientDetail.css';

function InfoRow({ icon: Icon, label, value, color }) {
  return (
    <div className="info-row">
      <div className={`info-icon ${color || ''}`}><Icon size={16} /></div>
      <div>
        <p className="info-label">{label}</p>
        <p className="info-value">{value}</p>
      </div>
    </div>
  );
}

function BloodCard({ label, value, unit, min, max, ideal }) {
  const num = parseFloat(value);
  let status = 'normal', statusLabel = 'Normal';
  if (num < min) { status = 'low'; statusLabel = 'Below Normal'; }
  else if (num > max) { status = 'high'; statusLabel = 'Above Normal'; }
  else if (ideal && num > ideal) { status = 'borderline'; statusLabel = 'Borderline'; }

  const pct = Math.min(100, Math.max(0, ((num - 0) / (max * 1.3)) * 100));

  return (
    <div className={`blood-card blood-${status}`}>
      <div className="blood-header">
        <span className="blood-label">{label}</span>
        <span className={`blood-status-badge status-${status}`}>{statusLabel}</span>
      </div>
      <div className="blood-value">
        {value} <span className="blood-unit">{unit}</span>
      </div>
      <div className="blood-bar-track">
        <div className="blood-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="blood-range">Reference: {min}–{max} {unit}</p>
    </div>
  );
}

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    patientService.get(id)
      .then(setPatient)
      .catch(() => toast.error('Patient not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await patientService.delete(id);
      toast.success('Patient deleted.');
      navigate('/patients');
    } catch {
      toast.error('Delete failed.');
      setDeleting(false);
    }
  };

  const calcAge = (dob) => {
    const birth = new Date(dob);
    return Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  if (loading) return (
    <div className="detail-page">
      <div className="loading-row">{[1,2,3].map(i => <div key={i} className="skeleton tall" />)}</div>
    </div>
  );

  if (!patient) return (
    <div className="detail-page">
      <div className="load-error">
        <AlertCircle size={40} color="#E84855" />
        <p>Patient not found.</p>
        <button className="btn-secondary" onClick={() => navigate('/patients')}>
          <ArrowLeft size={15} /> Back
        </button>
      </div>
    </div>
  );

  return (
    <div className="detail-page">
      {/* Header */}
      <div className="detail-header">
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} /> Back
        </button>
        <div className="detail-actions">
          <button className="btn-edit" onClick={() => navigate(`/patients/${id}/edit`)}>
            <Edit2 size={15} /> Edit Record
          </button>
          {confirmDelete ? (
            <div className="confirm-bar">
              <AlertCircle size={15} color="#E84855" />
              <span>Are you sure?</span>
              <button className="confirm-yes" onClick={handleDelete} disabled={deleting}>
                {deleting ? '…' : 'Delete'}
              </button>
              <button className="confirm-no" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </div>
          ) : (
            <button className="btn-danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={15} /> Delete
            </button>
          )}
        </div>
      </div>

      <div className="detail-grid">
        {/* Left column */}
        <div className="left-col">
          {/* Profile card */}
          <div className="profile-card">
            <div className="profile-avatar">
              {patient.full_name.charAt(0).toUpperCase()}
            </div>
            <h2 className="profile-name">{patient.full_name}</h2>
            <p className="profile-id">Patient ID #{patient.id}</p>

            <div className="profile-info">
              <InfoRow icon={Mail} label="Email" value={patient.email} />
              <InfoRow icon={Calendar} label="Date of Birth" value={`${formatDate(patient.date_of_birth)} (Age ${calcAge(patient.date_of_birth)})`} />
              <InfoRow icon={Activity} label="Registered" value={patient.created_at ? formatDate(patient.created_at) : '—'} />
              {patient.updated_at && (
                <InfoRow icon={Activity} label="Last Updated" value={formatDate(patient.updated_at)} />
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="right-col">
          {/* Blood test results */}
          <div className="section-card">
            <div className="card-title">
              <Droplets size={18} color="#00A896" />
              Blood Test Results
            </div>
            <div className="blood-grid">
              <BloodCard label="Glucose" value={patient.glucose} unit="mg/dL" min={70} max={100} ideal={99} />
              <BloodCard label="Haemoglobin" value={patient.haemoglobin} unit="g/dL" min={12} max={17.5} />
              <BloodCard label="Cholesterol" value={patient.cholesterol} unit="mg/dL" min={100} max={200} ideal={199} />
            </div>
          </div>

          {/* AI Remarks */}
          <div className="section-card remarks-card">
            <div className="card-title">
              <Brain size={18} color="#00A896" />
              AI Health Analysis
              <span className="ai-badge">MIRA Powered</span>
            </div>
            {patient.remarks ? (
              <div className="remarks-body">
                {patient.remarks.split('|').map((line, i) => (
                  <div key={i} className="remark-line">
                    <span className="remark-dot" />
                    <p>{line.trim()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-remarks">No analysis available yet.</p>
            )}
            <p className="remarks-disclaimer">
              ⚠ This analysis is generated by an AI model and is intended for clinical decision support only.
              Always consult a qualified healthcare professional before making any medical decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
