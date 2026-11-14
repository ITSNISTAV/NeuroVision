import { useState } from 'react';

export default function CoreSubjectRating({ initialValues, onSubmit, disabled = false }) {
  const [oop, setOop] = useState(initialValues?.oop || 3);
  const [dbms, setDbms] = useState(initialValues?.dbms || 3);
  const [os, setOs] = useState(initialValues?.os || 3);
  const [cn, setCn] = useState(initialValues?.cn || 3);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!disabled) {
      onSubmit({ oop, dbms, os, cn });
    }
  };

  const SUBJECTS = [
    { key: 'oop', label: 'Object Oriented Programming', val: oop, set: setOop },
    { key: 'dbms', label: 'Database Management Systems', val: dbms, set: setDbms },
    { key: 'os', label: 'Operating Systems', val: os, set: setOs },
    { key: 'cn', label: 'Computer Networks', val: cn, set: setCn }
  ];

  return (
    <form
      className="glass-card"
      onSubmit={handleSubmit}
      style={{
        padding: '20px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {SUBJECTS.map((sub) => (
          <div key={sub.key} className="premium-slider-wrap">
            <div className="premium-slider-header">
              <span className="premium-slider-label">{sub.label}</span>
              <strong className="premium-slider-value">{sub.val} / 5</strong>
            </div>
            <div className="premium-slider-control-row">
              <input
                type="range"
                className="premium-slider-input"
                min={1}
                max={5}
                value={sub.val}
                onChange={(e) => sub.set(Number(e.target.value))}
                disabled={disabled}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="btn-submit"
        style={{ alignSelf: 'flex-end', padding: '10px 24px', fontSize: '13px' }}
      >
        Submit Ratings →
      </button>
    </form>
  );
}
