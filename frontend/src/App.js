import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientForm from './pages/PatientForm';
import PatientDetail from './pages/PatientDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          },
          success: { iconTheme: { primary: '#00A896', secondary: '#fff' } },
          error: { iconTheme: { primary: '#E84855', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/new" element={<PatientForm />} />
          <Route path="patients/:id/edit" element={<PatientForm />} />
          <Route path="patients/:id" element={<PatientDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
