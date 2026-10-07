import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DateInput } from '../src/components/DateInput';
import '../src/styles/AdminDashboard.css';
import '../src/styles/UserDashboard.css';

function DateInputChecks() {
  const [value, setValue] = useState('2026-09-29');
  return (
    <main style={{ padding: 24, maxWidth: 400 }}>
      <h1 style={{ fontSize: 20 }}>Date input checks</h1>
      <div className="form-group">
        <DateInput label="Service Date" value={value} onChange={setValue} min="2026-01-01" max="2026-12-31" required />
      </div>
      <output aria-label="API date">{value || 'empty'}</output>
      <button onClick={() => setValue('2026-09-29')}>Reset date</button>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><DateInputChecks /></React.StrictMode>);
