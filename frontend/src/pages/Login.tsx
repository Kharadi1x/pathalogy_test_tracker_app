import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const json = await res.json();
    if (res.ok) {
      localStorage.setItem('token', json.token);
      setMsg('Logged in');
      nav('/');
    } else {
      setMsg(json.error || 'Login failed');
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <div><input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div><input placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
        <button type="submit">Login</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  );
}
