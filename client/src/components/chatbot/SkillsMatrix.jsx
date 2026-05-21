import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Sliders, Check } from 'lucide-react';
import { LEVEL_LABELS } from './chatbotSteps';

// Custom slider component for each skill rating
function SkillSlider({ skillName, value, onChange }) {
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
    onChange(skillName, roundedVal);
  }, [skillName, onChange]);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px 0' }}>
      <div
        ref={trackRef}
        onPointerDown={(e) => {
          setDragging(true);
          handlePointer(e);
        }}
        style={{
          height: '24px',
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
        <span>Novice</span>
        <span>Intermediate</span>
        <span>Advanced</span>
        <span>Expert</span>
        <span>Master</span>
      </div>
    </div>
  );
}

export default function SkillsMatrix({
  roleSkills = [],
  skillsRatings = {},
  onChangeRating,
  onSkipSkill,
  onSubmit,
  onSkipAll
}) {
  return (
    <div
      className="skills-rate-board"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '460px',
        maxHeight: '85vh',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <div className="skills-rate-header" style={{ marginBottom: '12px', fontSize: '15px', fontWeight: 600, color: 'var(--purple-200)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sliders size={16} /> Skills Proficiency Matrix
      </div>

      {/* Scrollable Card Container */}
      <div
        className="skill-proficiency-matrix"
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '6px',
          marginBottom: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <AnimatePresence initial={false}>
          {roleSkills.map((skillName) => {
            const currentRating = skillsRatings[skillName] || 3;

            return (
              <motion.div
                key={skillName}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -50, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(168, 85, 247, 0.15)',
                  borderRadius: 'var(--radius)',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div
                  className="skill-matrix-header"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span className="skill-matrix-title" style={{ fontSize: '13px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={13} style={{ color: 'var(--accent)' }} />
                    {skillName}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      className="skills-rate-item-level"
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
                      {currentRating} - {LEVEL_LABELS[currentRating]}
                    </span>
                    <button
                      type="button"
                      className="skill-matrix-skip-btn"
                      style={{
                        fontSize: '10px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                      onClick={() => onSkipSkill(skillName)}
                    >
                      ✕ Remove
                    </button>
                  </div>
                </div>

                {/* Custom Slider instead of Buttons */}
                <SkillSlider
                  skillName={skillName}
                  value={currentRating}
                  onChange={onChangeRating}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Action Footer Bar */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '12px',
          paddingBottom: '4px'
        }}
      >
        <button
          type="button"
          className="btn-reset"
          style={{ padding: '8px 16px', fontSize: '12px', borderRadius: 'var(--radius)', cursor: 'pointer' }}
          onClick={onSkipAll}
        >
          Skip All
        </button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-submit"
          style={{
            padding: '8px 20px',
            fontSize: '12px',
            fontWeight: 600,
            background: 'var(--purple-500)',
            boxShadow: '0 4px 12px rgba(168, 85, 247, 0.25)',
            border: 'none',
            borderRadius: 'var(--radius)',
            color: '#fff',
            cursor: 'pointer'
          }}
          onClick={onSubmit}
        >
          Confirm Rating Matrix →
        </motion.button>
      </div>
    </div>
  );
}
