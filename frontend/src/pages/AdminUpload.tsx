import React, { useState } from 'react';
import MaskedName from '../components/MaskedName';

export default function AdminUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [testType, setTestType] = useState('CBC');
  const [testName, setTestName] = useState('');
  const [result, setResult] = useState('');
  const [referenceRange, setReferenceRange] = useState('');
  const [dateOfTest, setDateOfTest] = useState('');
  const [patientName, setPatientName] = useState('');
  const [message, setMessage] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const form = new FormData();
    if (file) form.append('file', file);
    form.append('testType', testType);
    form.append('testName', testName);
    form.append('result', result);
    form.append('referenceRange', referenceRange);
    form.append('dateOfTest', dateOfTest);
    form.append('patientName', patientName);

    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const json = await res.json();
    if (res.ok) setMessage('Upload queued successfully');
    else setMessage(json.error || 'Upload failed');
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin - Upload Report</h2>
      <form onSubmit={submit}>
        <div>
          <label>PDF / Scan:</label>
          <input type="file" accept="application/pdf,image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <div>
          <label>Patient Name:</label>
          <input value={patientName} onChange={e => setPatientName(e.target.value)} />
          <MaskedName name={patientName} />
        </div>
        <div>
          <label>Test Type:</label>
          <select value={testType} onChange={e => setTestType(e.target.value)}>
            <option>CBC</option>
            <option>Biochemistry</option>
            <option>Coagulation</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label>Test Name:</label>
          <input value={testName} onChange={e => setTestName(e.target.value)} />
        </div>
        <div>
          <label>Result:</label>
          <input value={result} onChange={e => setResult(e.target.value)} />
        </div>
        <div>
          <label>Reference Range:</label>
          <input value={referenceRange} onChange={e => setReferenceRange(e.target.value)} />
        </div>
        <div>
          <label>Date of Test:</label>
          <input type="date" value={dateOfTest} onChange={e => setDateOfTest(e.target.value)} />
        </div>
        <button type="submit">Submit</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}