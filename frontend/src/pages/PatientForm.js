import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Loader, AlertCircle, Brain } from 'lucide-react';
import toast from 'react-hot-toast';
import { patientService } from '../services/api';
import './PatientForm.css';

const INITIAL = {
  full_name: '', date_of_birth: '', email: '',
  glucose: '', haemoglobin: '', cholesterol: ''
};

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="field-error"><AlertCircle size={12} />{msg}</p>;
}

export default function PatientForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    patientService.get(id)
      .then(p => {
        setForm({
          full_name: p.full_name,
          date_of_birth: p.date_of_birth,
          email: p.email,
          glucose: p.glucose,
          haemoglobin: p.haemoglobin,
          cholesterol: p.cholesterol,
        });
      })
      .catch(() => setLoadError('Could not load patient record.'));
  }, [id, isEdit]);

  const validate = () => {
    const e = {};
    if (!form.full_name.trim() || form.full_name.trim().length < 2)
      e.full_name = 'Full name must be at least 2 characters.';

    if (!form.date_of_birth)
      e.date_of_birth = 'Date of birth is required.';
    else if (new Date(form.date_of_birth) > new Date())
      e.date_of_birth = 'Date of birth cannot be a future date.';

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(form.email))
      e.email = 'Please enter a valid email address.';

    const glucose = parseFloat(form.glucose);
    if (isNaN(glucose) || glucose <= 0) e.glucose = 'Glucose must be a positive number.';
    else if (glucose > 1000) e.glucose = 'Glucose value is unrealistically high.';

    const haem = parseFloat(form.haemoglobin);
    if (isNaN(haem) || haem <= 0) e.haemoglobin = 'Haemoglobin must be a positive number.';
    else if (haem > 30) e.haemoglobin = 'Haemoglobin value is unrealistically high.';

    const chol = parseFloat(form.cholesterol);
    if (isNaN(chol) || chol <= 0) e.cholesterol = 'Cholesterol must be a positive number.';
    else if (chol > 1000) e.cholesterol = 'Cholesterol value is unrealistically high.';

    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    const payload = {
      ...form,
      glucose: parseFloat(form.glucose),
      haemoglobin: parseFloat(form.haemoglobin),
      cholesterol: parseFloat(form.cholesterol),
    };

    try {
      if (isEdit) {
        await patientService.update(id, payload);
        toast.success('Patient record updated successfully.');
      } else {
        await patientService.create(payload);
        toast.success('Patient registered! AI analysis complete.');
      }
      navigate('/patients');
    } catch (err) {
      const msg = err.response?.data?.detail || 'An error occurred. Please try again.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loadError) return (
    <div className="form-page">
      <div className="load-error">
        <AlertCircle size={40} color="#E84855" />
        <p>{loadError}</p>
        <button className="btn-secondary" onClick={() => navigate('/patients')}>
          <ArrowLeft size={15} /> Back to Patients
        </button>
      </div>
    </div>
  );

  return (
    <div className="form-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'Update Patient Record' : 'Register New Patient'}</h1>
          <p className="page-subtitle">
            {isEdit ? 'Modify the patient details below. AI analysis will re-run on save.' : 'Enter patient details. AI health analysis will run automatically.'}
          </p>
        </div>
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} /> Back
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          {/* Personal Information */}
          <div className="form-section">
            <div className="section-title">
              <span className="section-dot" />
              Personal Information
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Sarah Johnson"
                  className={`form-input ${errors.full_name ? 'error' : ''}`}
                />
                <FieldError msg={errors.full_name} />
              </div>

              <div className="form-group">
                <label className="form-label">Date of Birth <span className="required">*</span></label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={form.date_of_birth}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className={`form-input ${errors.date_of_birth ? 'error' : ''}`}
                />
                <FieldError msg={errors.date_of_birth} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address <span className="required">*</span></label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="patient@example.com"
                className={`form-input ${errors.email ? 'error' : ''}`}
              />
              <FieldError msg={errors.email} />
            </div>
          </div>

          {/* Blood Test Results */}
          <div className="form-section">
            <div className="section-title">
              <span className="section-dot teal" />
              Blood Test Results
            </div>
            <p className="section-desc">Enter the patient's latest laboratory blood test values.</p>

            <div className="form-row three-col">
              <div className="form-group">
                <label className="form-label">
                  Glucose <span className="required">*</span>
                  <span className="unit-hint">mg/dL</span>
                </label>
                <input
                  type="number"
                  name="glucose"
                  value={form.glucose}
                  onChange={handleChange}
                  placeholder="e.g. 95"
                  min="1" max="1000" step="0.1"
                  className={`form-input ${errors.glucose ? 'error' : ''}`}
                />
                <p className="field-hint">Normal: 70–100 (fasting)</p>
                <FieldError msg={errors.glucose} />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Haemoglobin <span className="required">*</span>
                  <span className="unit-hint">g/dL</span>
                </label>
                <input
                  type="number"
                  name="haemoglobin"
                  value={form.haemoglobin}
                  onChange={handleChange}
                  placeholder="e.g. 14.5"
                  min="1" max="30" step="0.1"
                  className={`form-input ${errors.haemoglobin ? 'error' : ''}`}
                />
                <p className="field-hint">Normal: 12–17.5</p>
                <FieldError msg={errors.haemoglobin} />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Cholesterol <span className="required">*</span>
                  <span className="unit-hint">mg/dL</span>
                </label>
                <input
                  type="number"
                  name="cholesterol"
                  value={form.cholesterol}
                  onChange={handleChange}
                  placeholder="e.g. 185"
                  min="1" max="1000" step="0.1"
                  className={`form-input ${errors.cholesterol ? 'error' : ''}`}
                />
                <p className="field-hint">Optimal: &lt; 200</p>
                <FieldError msg={errors.cholesterol} />
              </div>
            </div>
          </div>
        </div>

        {/* AI notice */}
        <div className="ai-notice">
          <Brain size={18} color="#00A896" />
          <p>
            <strong>AI Health Analysis</strong> — Once you save, MIRA will automatically call the health prediction engine and populate the <em>Remarks</em> field with a clinical assessment based on the blood values provided.
          </p>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={15} /> Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? (
              <><Loader size={15} className="spin" /> Analysing…</>
            ) : (
              <><Save size={15} /> {isEdit ? 'Update Record' : 'Register & Analyse'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
