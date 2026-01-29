import React, { useState, useEffect } from 'react';

export default function MaskedName({ name }: { name: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let t: any;
    if (visible) {
      t = setTimeout(() => setVisible(false), 10000); // 10s reveal
    }
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <div style={{ display: 'inline-block', marginLeft: 8 }}>
      <span>{visible ? name : (name ? '*'.repeat(name.length) : '****')}</span>
      <button style={{ marginLeft: 8 }} onClick={() => setVisible(true)}>Reveal 10s</button>
    </div>
  );
}