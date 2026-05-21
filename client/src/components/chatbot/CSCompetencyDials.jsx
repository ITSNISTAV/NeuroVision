import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star, Library, Database, Cpu, Network } from 'lucide-react';

const SUBJECTS = [
  { key: 'oop', label: 'Object Oriented Programming', icon: Library },
  { key: 'dbms', label: 'Database Systems', icon: Database },
  { key: 'os', label: 'Operating Systems', icon: Cpu },
  { key: 'cn', label: 'Computer Networks', icon: Network }
];

const RATING_LABELS = {
  1: 'Familiar 🧊',
  2: 'Capable ⚡',
  3: 'Competent 🚀',
  4: 'Proficient 🏆',
  5: 'Expert 👑'
};

// Custom CS Subject Progress Slider component
function CSSubjectSlider({ subjectKey, value, onChange }) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const percent = ((value - 1) / 4) * 100;

  const handlePointer = useCallback((e) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clickX = clientX - rect.left;
    const rawVal = (clickX / rect.width) * 4 + 1;
    const roundedVal = Math.max(1, Math.min(5, Math.round(rawVal)));
    onChange(subjectKey, roundedVal);
  }, [subjectKey, onChange]);

  useEffect(() => {
    if (!dragging) return;
    const move = (e) => handlePointer(e);
    const up = () => setDragging(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchend', up);
    };
  }, [dragging, handlePointer]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '4px 0', width: '100%' }}>
      <div 
        ref={trackRef}
        onPointerDown={(e) => {
          setDragging(true);
          handlePointer(e);
        }}
        style={{
          height: '26px',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        {/* Track Line */}
        <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', position: 'relative' }}>
          
          {/* Snap dots */}
          {[0, 1, 2, 3, 4].map((tick) => (
            <div 
              key={tick} 
              style={{
                position: 'absolute',
                left: `${(tick / 4) * 100}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: (tick + 1) <= value ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
                transition: 'background 0.2s'
              }}
            />
          ))}

          {/* Track Fill */}
          <motion.div 
            style={{ 
              height: '100%', 
              background: 'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)',
              borderRadius: '3px',
              position: 'absolute',
              left: 0,
              top: 0
            }}
            animate={{ width: `${percent}%` }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          />

          {/* Thumb handle */}
          <motion.div 
            style={{ 
              position: 'absolute',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#fff',
              border: '3px solid #8b5cf6',
              boxShadow: '0 0 0 3px rgba(139,92,246,0.15), 0 2px 6px rgba(0,0,0,0.4)',
              top: '50%',
              marginTop: '-8px'
            }}
            animate={{ left: `${percent}%`, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          />
        </div>
      </div>
      
      {/* Visual Snap ticks labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(255,255,255,0.25)', padding: '0 2px' }}>
        <span>Familiar</span>
        <span>Capable</span>
        <span>Competent</span>
        <span>Proficient</span>
        <span>Expert</span>
      </div>
    </div>
  );
}

export default function CSCompetencyDials({ values, onSubmit }) {
  const [ratings, setRatings] = useState({
    oop: values?.oop || 3,
    dbms: values?.dbms || 3,
    os: values?.os || 3,
    cn: values?.cn || 3
  });

  useEffect(() => {
    if (values) {
      setRatings({
        oop: values.oop || 3,
        dbms: values.dbms || 3,
        os: values.os || 3,
        cn: values.cn || 3
      });
    }
  }, [values]);

  const handleChangeRating = (key, newVal) => {
    setRatings((prev) => ({ ...prev, [key]: newVal }));
  };

  return (
    <div 
      className="glass-card" 
      style={{ 
        padding: '16px 20px', 
        display: 'flex', 
        flexDirection: 'column', 
        height: '460px',
        maxHeight: '85vh',
        width: '100%', 
        background: 'rgba(15,0,32,0.45)',
        border: '1px solid rgba(168, 85, 247, 0.15)',
        borderRadius: 'var(--radius)',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--purple-200)', marginBottom: '12px' }}>
        Core Computer Science Subjects
      </div>

      <div 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          paddingRight: '6px', 
          marginBottom: '8px',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px' 
        }}
      >
        {SUBJECTS.map((sub) => {
          const val = ratings[sub.key];
          const Icon = sub.icon;
          const statusText = RATING_LABELS[val] || 'Competent';

          return (
            <div
              key={sub.key}
              style={{
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                borderRadius: 'var(--radius)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon size={14} style={{ color: 'var(--accent)' }} />
                  {sub.label}
                </span>
                
                <span 
                  style={{ 
                    fontSize: '10px', 
                    color: 'var(--accent)', 
                    fontWeight: 600,
                    background: 'rgba(168, 85, 247, 0.08)',
                    padding: '3px 10px',
                    borderRadius: '100px',
                    border: '1px solid rgba(168,85,247,0.15)'
                  }}
                >
                  {statusText}
                </span>
              </div>

              {/* Progress Slider Bar */}
              <CSSubjectSlider
                subjectKey={sub.key}
                value={val}
                onChange={handleChangeRating}
              />
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          borderTop: '1px solid rgba(255,255,255,0.06)', 
          paddingTop: '12px',
          marginTop: '6px'
        }}
      >
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="btn-submit"
          style={{ 
            padding: '10px 24px', 
            fontSize: '12.5px',
            fontWeight: 600,
            background: 'var(--purple-500)',
            boxShadow: '0 4px 12px rgba(168, 85, 247, 0.25)',
            border: 'none',
            borderRadius: 'var(--radius)',
            color: '#fff',
            cursor: 'pointer'
          }}
          onClick={() => onSubmit(ratings)}
        >
          Confirm Core Ratings →
        </motion.button>
      </div>
    </div>
  );
}
