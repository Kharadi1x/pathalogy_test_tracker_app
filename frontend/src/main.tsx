import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return (
    <div>
      <h1>Pathalogy Test Tracker</h1>
      <p>Welcome — scaffolded frontend.</p>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
