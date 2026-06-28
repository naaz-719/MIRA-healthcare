import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, TrendingUp, Droplets, PlusCircle, ArrowRight } from 'lucide-react';
import { statsService, patientService } from '../services/api';
import './Dashboard.css';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon-wrap">
        <Icon size={22} />
      </div>
      <div className="stat-body">
        <p className="stat-value">{value ?? '—'}</p>
        <p className="stat-label">{label}</p>
        {sub && <p className="stat-sub">{sub}</p>}
      </div>
    </div>
  );
}

function RiskBadge({ remarks }) {
  if (!remarks) return <span className="badge badge-gray">Pending</span>;
  const upper = remarks.toUpperCase();
  if (upper.includes('[OVERALL RISK: HIGH]') || upper.includes('HIGH'))
    return <span className="badge badge-red">High Risk</span>;
  if (upper.includes('[OVERALL RISK: MODERATE]') || upper.includes('MODERATE'))
    return <span className="badge badge-amber">Moderate</span>;
  return <span className="badge badge-green">Low Risk</span>;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([statsService.get(), patientService.list()])
      .then(([s, p]) => {
        setStats(s);
        setPatients(p.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clinical Dashboard</h1>
          <p className="page-subtitle">Medical Intelligence Robotic Automation — live patient overview</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/patients/new')}>
          <PlusCircle size={16} />
          Register Patient
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon={Users} label="Total Patients" value={stats?.total_patients} color="teal" sub="Registered records" />
        <StatCard icon={Droplets} label="High Glucose" value={stats?.high_glucose_count} color="amber" sub="> 125 mg/dL" />
        <StatCard icon={AlertTriangle} label="High Cholesterol" value={stats?.high_cholesterol_count} color="coral" sub="≥ 240 mg/dL" />
        <StatCard icon={TrendingUp} label="Anaemia Flagged" value={stats?.anaemia_count} color="navy" sub="Hgb < 12 g/dL" />
      </div>

      {/* Recent patients */}
      <div className="recent-card">
        <div className="card-header">
          <h2>Recent Patients</h2>
          <button className="link-btn" onClick={() => navigate('/patients')}>
            View all <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="loading-row">
            {[1,2,3].map(i => <div key={i} className="skeleton" />)}
          </div>
        ) : patients.length === 0 ? (
          <div className="empty-state">
            <Users size={40} color="#CBD5E0" />
            <p>No patients yet. Register your first patient to get started.</p>
            <button className="btn-primary" onClick={() => navigate('/patients/new')}>
              <PlusCircle size={15} /> Register Patient
            </button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Glucose</th>
                <th>Haemoglobin</th>
                <th>Cholesterol</th>
                <th>Risk</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id} onClick={() => navigate(`/patients/${p.id}`)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div className="patient-cell">
                      <div className="patient-avatar">{p.full_name.charAt(0).toUpperCase()}</div>
                      <div>
                        <p className="patient-name">{p.full_name}</p>
                        <p className="patient-email">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className={`value-pill ${p.glucose > 125 ? 'high' : p.glucose > 99 ? 'mid' : 'ok'}`}>{p.glucose} mg/dL</span></td>
                  <td><span className={`value-pill ${p.haemoglobin < 12 ? 'high' : 'ok'}`}>{p.haemoglobin} g/dL</span></td>
                  <td><span className={`value-pill ${p.cholesterol >= 240 ? 'high' : p.cholesterol >= 200 ? 'mid' : 'ok'}`}>{p.cholesterol} mg/dL</span></td>
                  <td><RiskBadge remarks={p.remarks} /></td>
                  <td><ArrowRight size={15} color="#CBD5E0" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
