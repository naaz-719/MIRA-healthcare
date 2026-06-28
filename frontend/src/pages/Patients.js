import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Search, Edit2, Trash2, Eye, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { patientService } from '../services/api';
import './Patients.css';

function RiskBadge({ remarks }) {
  if (!remarks) return <span className="badge badge-gray">Pending</span>;
  const upper = remarks.toUpperCase();
  if (upper.includes('HIGH')) return <span className="badge badge-red">High</span>;
  if (upper.includes('MODERATE')) return <span className="badge badge-amber">Moderate</span>;
  return <span className="badge badge-green">Low</span>;
}

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const navigate = useNavigate();

  const fetchPatients = useCallback(async () => {
    try {
      const data = await patientService.list();
      setPatients(data);
      setFiltered(data);
    } catch {
      toast.error('Failed to load patients.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      patients.filter(p =>
        p.full_name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
      )
    );
  }, [search, patients]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await patientService.delete(id);
      toast.success('Patient record deleted.');
      setPatients(prev => prev.filter(p => p.id !== id));
      setConfirmId(null);
    } catch {
      toast.error('Delete failed. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const calcAge = (dob) => {
    const birth = new Date(dob);
    const diff = Date.now() - birth.getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  };

  return (
    <div className="patients-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Patient Records</h1>
          <p className="page-subtitle">{patients.length} patients registered in the system</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/patients/new')}>
          <PlusCircle size={16} /> Register Patient
        </button>
      </div>

      {/* Search bar */}
      <div className="search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Table */}
      <div className="table-card">
        {loading ? (
          <div className="loading-row">
            {[1,2,3,4].map(i => <div key={i} className="skeleton" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Search size={40} color="#CBD5E0" />
            <p>{search ? 'No patients match your search.' : 'No patients registered yet.'}</p>
            {!search && (
              <button className="btn-primary" onClick={() => navigate('/patients/new')}>
                <PlusCircle size={15} /> Register First Patient
              </button>
            )}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Age</th>
                <th>Glucose</th>
                <th>Haemoglobin</th>
                <th>Cholesterol</th>
                <th>Risk Level</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="patient-cell">
                      <div className="patient-avatar">{p.full_name.charAt(0).toUpperCase()}</div>
                      <div>
                        <p className="patient-name">{p.full_name}</p>
                        <p className="patient-email">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="age-cell">{calcAge(p.date_of_birth)} yrs</td>
                  <td><span className={`value-pill ${p.glucose > 125 ? 'high' : p.glucose > 99 ? 'mid' : 'ok'}`}>{p.glucose}</span></td>
                  <td><span className={`value-pill ${p.haemoglobin < 12 ? 'high' : 'ok'}`}>{p.haemoglobin}</span></td>
                  <td><span className={`value-pill ${p.cholesterol >= 240 ? 'high' : p.cholesterol >= 200 ? 'mid' : 'ok'}`}>{p.cholesterol}</span></td>
                  <td><RiskBadge remarks={p.remarks} /></td>
                  <td>
                    <div className="action-btns">
                      <button className="icon-btn view" title="View" onClick={() => navigate(`/patients/${p.id}`)}>
                        <Eye size={15} />
                      </button>
                      <button className="icon-btn edit" title="Edit" onClick={() => navigate(`/patients/${p.id}/edit`)}>
                        <Edit2 size={15} />
                      </button>
                      {confirmId === p.id ? (
                        <div className="confirm-inline">
                          <AlertTriangle size={13} color="#E84855" />
                          <span>Delete?</span>
                          <button
                            className="confirm-yes"
                            onClick={() => handleDelete(p.id)}
                            disabled={deleting === p.id}
                          >
                            {deleting === p.id ? '…' : 'Yes'}
                          </button>
                          <button className="confirm-no" onClick={() => setConfirmId(null)}>No</button>
                        </div>
                      ) : (
                        <button className="icon-btn delete" title="Delete" onClick={() => setConfirmId(p.id)}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
