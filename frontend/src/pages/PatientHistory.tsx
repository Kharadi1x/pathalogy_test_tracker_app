import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useParams } from 'react-router-dom';

export default function PatientHistory() {
  const { id } = useParams();
  const [tests, setTests] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/patients/${id}/tests`);
      if (res.ok) {
        const json = await res.json();
        setTests(json);
      }
    }
    load();
  }, [id]);

  if (!tests.length) return <div style={{ padding: 20 }}>No data points yet</div>;

  if (tests.length === 1) {
    const t = tests[0];
    return (
      <div style={{ padding: 20 }}>
        <h2>{t.testName}</h2>
        <p>Value: {t.result} (Date: {new Date(t.dateOfTest).toLocaleDateString()})</p>
      </div>
    );
  }

  const data = tests.map(t => ({ date: new Date(t.dateOfTest).toLocaleDateString(), value: parseFloat(t.result) || 0 }));

  return (
    <div style={{ padding: 20 }}>
      <h2>Patient History</h2>
      <LineChart width={800} height={300} data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <CartesianGrid stroke="#eee" />
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </div>
  );
}