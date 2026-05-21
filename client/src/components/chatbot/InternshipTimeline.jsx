import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Briefcase, Award, Clock } from 'lucide-react';

const MILESTONES = [
  { value: 0, label: '0 Months', title: 'Starting Out 🧊', desc: 'No prior internship experience yet' },
  { value: 3, label: '3 Months', title: 'Summer Intern ⚡', desc: 'Short internship or bootcamps' },
  { value: 6, label: '6 Months', title: 'Semester Intern 🚀', desc: 'Mid-level industry placement' },
  { value: 12, label: '12 Months', title: 'Deep Experience 🏆', desc: 'Long-term product contributions' },
  { value: 18, label: '18 Months', title: 'Team Resident 👑', desc: 'Deep team integration cycles' },
  { value: 24, label: '24+ Months', title: 'Professional Tier ⚔️', desc: 'Multiple placements completed' }
];

export default function InternshipTimeline({ value, onChange, onSubmit }) {
  const [months, setMonths] = useState(Number(value) || 0);

  useEffect(() => {
    setMonths(Number(value) || 0);
  }, [value]);

  const handleMilestoneClick = (val) => {
    setMonths(val);
    onChange(val);
  };

  // Find slider position percentage based on milestones indices
  const activeIdx = MILESTONES.findIndex(m => m.value === months);
  const trackPercentage = (activeIdx / (MILESTONES.length - 1)) * 100;

  return (
    <div className="timeline-wrapper" style={{ padding: '8px' }}>
      {/* Snap Milestone Slider Bar */}
      <div style={{ position: 'relative', padding: '16px 20px 24px 20px', marginBottom: '16px' }}>
        {/* Track Line */}
        <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', position: 'relative' }}>
          <motion.div 
            style={{ 
              height: '100%', 
              background: 'linear-gradient(90deg, var(--purple-500) 0%, var(--purple-300) 100%)', 
              borderRadius: '2px',
              position: 'absolute',
              left: 0,
              top: 0
            }}
            animate={{ width: `${trackPercentage}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          />
        </div>

        {/* Snap Dots */}
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'absolute', left: '20px', right: '20px', top: '14px', height: '8px' }}>
          {MILESTONES.map((m, idx) => {
            const isCompleted = idx <= activeIdx;
            const isActive = idx === activeIdx;
            return (
              <div 
                key={m.value}
                onClick={() => handleMilestoneClick(m.value)}
                style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  background: isActive ? '#fff' : isCompleted ? 'var(--accent)' : 'rgba(255,255,255,0.15)',
                  border: isActive ? '3px solid var(--accent)' : 'none',
                  boxShadow: isActive ? '0 0 10px var(--accent)' : 'none',
                  cursor: 'pointer',
                  transform: 'translate(-50%, -2px)',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <span style={{ 
                  position: 'absolute', 
                  top: '16px', 
                  left: '50%', 
                  transform: 'translateX(-50%)', 
                  fontSize: '9px', 
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  fontWeight: isActive ? 'bold' : 'normal'
                }}>
                  {m.value}m
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid of details */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          marginBottom: '20px',
          marginTop: '12px'
        }}
      >
        {MILESTONES.map((m) => {
          const isSelected = months === m.value;
          return (
            <motion.button
              key={m.value}
              type="button"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleMilestoneClick(m.value)}
              className={`onboarding-card-select ${isSelected ? 'active' : ''}`}
              style={{
                padding: '14px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                minHeight: '94px',
                border: isSelected ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.06)',
                background: isSelected ? 'rgba(168, 85, 247, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                boxShadow: isSelected ? '0 4px 15px rgba(168, 85, 247, 0.15)' : 'none',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                transition: 'border-color 0.2s, background 0.2s',
                outline: 'none'
              }}
            >
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  width: '100%' 
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#fff' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {isSelected ? <Briefcase size={12} style={{ color: 'var(--accent)' }} /> : null}
                  {m.title}
                </span>
                {isSelected && (
                  <motion.span 
                    initial={{ scale: 0.6 }} 
                    animate={{ scale: 1 }} 
                    style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 'bold' }}
                  >
                    ✓
                  </motion.span>
                )}
              </div>
              <span style={{ fontSize: '10px', color: isSelected ? 'var(--purple-200)' : 'var(--text-muted)', lineHeight: '1.4' }}>
                {m.desc}
              </span>
              <span 
                style={{ 
                  marginTop: 'auto', 
                  fontSize: '10px', 
                  fontWeight: 600, 
                  color: isSelected ? 'var(--accent)' : 'var(--purple-300)',
                  alignSelf: 'flex-start',
                  background: 'rgba(255,255,255,0.03)',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}
              >
                {m.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Selected Indicator and Actions bar */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: '20px', 
          borderTop: '1px solid rgba(255, 255, 255, 0.06)', 
          paddingTop: '14px' 
        }}
      >
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={14} style={{ color: 'var(--purple-300)' }} />
          Experience Selected: <strong style={{ color: 'var(--accent)', textShadow: '0 0 8px rgba(168, 85, 247, 0.2)' }}>
            {months === 0 ? 'No Internships' : `${months} Months`}
          </strong>
        </span>
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
          onClick={() => onSubmit(String(months))}
        >
          Confirm Experience →
        </motion.button>
      </div>
    </div>
  );
}
