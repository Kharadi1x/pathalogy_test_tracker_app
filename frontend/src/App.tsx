import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import AdminUpload from './pages/AdminUpload';
import PatientHistory from './pages/PatientHistory';
import Login from './pages/Login';

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: 10 }}>
        <Link to="/admin/upload">Admin Upload</Link> | <Link to="/login">Login</Link> | <Link to="/">Home</Link>
      </nav>
      <Routes>
        <Route path="/admin/upload" element={<AdminUpload />} />
        <Route path="/login" element={<Login />} />
        <Route path="/patient/:id/history" element={<PatientHistory />} />
        <Route path="/" element={<div style={{ padding: 20 }}><h1>Welcome</h1></div>} />
      </Routes>
    </BrowserRouter>
  );
}

// Note: update frontend/src/main.tsx to render <App /> instead of the simple App component if needed.