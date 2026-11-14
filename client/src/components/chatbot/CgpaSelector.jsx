import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';

const INTEGERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function CgpaSelector({ value, onChange, onSubmit }) {
  const [cgpa, setCgpa] = useState(Number(value) || 7.0);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const trackRef = useRef(null);

  const springCgpa = useSpring(cgpa, { stiffness: 380, damping: 28 });
  const displayVal = useTransform(springCgpa, v => v.toFixed(1));

  useEffect(() => {
    const val = Number(value) || 7.0;
    setCgpa(val);
    springCgpa.set(val);
  }, [value]);

  const commit = useCallback((raw) => {
    const clamped = Math.max(1.0, Math.min(10.0, raw));
    const rounded = Math.round(clamped * 10) / 10;
    setCgpa(rounded);
    springCgpa.set(rounded);
    onChange?.(rounded);
  }, [onChange, springCgpa]);

  const percent = ((cgpa - 1.0) / 9.0) * 100;

  const onTrackPointer = useCallback((e) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const raw = ((clientX - rect.left) / rect.width) * 9.0 + 1.0;
    commit(raw);
  }, [commit]);

  useEffect(() => {
    if (!dragging) return;
    const move = (e) => onTrackPointer(e);
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
  }, [dragging, onTrackPointer]);

  const activeInt = Math.round(cgpa);

  // Grade label helper
  const gradeLabel = (v) => {
    if (v >= 9.0) return { text: 'Outstanding', color: '#a78bfa' };
    if (v >= 8.0) return { text: 'Excellent', color: '#818cf8' };
    if (v >= 7.0) return { text: 'Good', color: '#60a5fa' };
    if (v >= 6.0) return { text: 'Average', color: '#34d399' };
    if (v >= 5.0) return { text: 'Below Avg', color: '#fbbf24' };
    return { text: 'Low', color: '#f87171' };
  };

  const grade = gradeLabel(cgpa);

  return (
    <>
      <style>{`
        .nv-cgpa {
          font-family: inherit;
          background: rgba(15, 0, 32, 0.45);
          border: 1px solid rgba(168, 85, 247, 0.15);
          border-radius: var(--radius);
          padding: 16px 20px;
          width: 100%;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
        }

        /* Header row */
        .nv-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .nv-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--purple-200);
        }

        .nv-grade-pill {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 9px;
          border-radius: 20px;
          letter-spacing: 0.04em;
          border: 1px solid currentColor;
          opacity: 0.85;
          transition: color 0.3s, border-color 0.3s;
        }

        /* Score display */
        .nv-score-row {
          display: flex;
          align-items: baseline;
          gap: 3px;
          margin-bottom: 12px;
        }

        .nv-big {
          font-size: 42px;
          font-weight: 700;
          line-height: 1;
          color: #f0eeff;
          font-variant-numeric: tabular-nums;
        }

        .nv-denom {
          font-size: 14px;
          color: rgba(240,235,255,0.3);
          font-weight: 400;
          padding-bottom: 4px;
          letter-spacing: -0.3px;
        }

        /* Integer grid */
        .nv-ints {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 4px;
          margin-bottom: 12px;
        }

        .nv-int-btn {
          all: unset;
          height: 36px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          text-align: center;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.03);
          color: rgba(220,210,255,0.4);
          transition: all 0.14s ease;
          position: relative;
          overflow: hidden;
        }

        .nv-int-btn:hover:not(.active) {
          background: rgba(139,92,246,0.08);
          border-color: rgba(139,92,246,0.25);
          color: rgba(220,210,255,0.7);
        }

        .nv-int-btn.active {
          color: #fff;
          border-color: rgba(139,92,246,0.7);
          background: linear-gradient(135deg, rgba(109,40,217,0.35), rgba(139,92,246,0.2));
          box-shadow: 0 0 10px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.08);
        }

        /* Track */
        .nv-track-wrap {
          position: relative;
          height: 40px;
          display: flex;
          align-items: center;
          margin-bottom: 10px;
          cursor: ew-resize;
          user-select: none;
        }

        .nv-track-bg {
          position: absolute;
          left: 0; right: 0;
          height: 6px;
          border-radius: 99px;
          background: rgba(255,255,255,0.05);
          overflow: visible;
        }

        .nv-track-fill {
          position: absolute;
          left: 0;
          height: 100%;
          border-radius: 99px;
          background: linear-gradient(90deg, #8b5cf6, #a78bfa);
          box-shadow: 0 0 8px rgba(139,92,246,0.3);
          pointer-events: none;
          transition: width 0.04s linear;
        }

        .nv-thumb {
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fff;
          border: 3px solid #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139,92,246,0.2), 0 2px 8px rgba(0,0,0,0.5);
          transform: translateX(-50%);
          pointer-events: none;
          top: 50%;
          margin-top: -10px;
          transition: box-shadow 0.15s, transform 0.1s;
        }

        .nv-thumb.drag {
          box-shadow: 0 0 0 6px rgba(139,92,246,0.25), 0 2px 12px rgba(0,0,0,0.6);
          transform: translateX(-50%) scale(1.15);
        }

        /* Tooltip */
        .nv-tooltip {
          position: absolute;
          top: -6px;
          transform: translateX(-50%) translateY(-100%);
          background: #7c3aed;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 5px;
          pointer-events: none;
          white-space: nowrap;
          letter-spacing: 0.04em;
        }

        .nv-tooltip::after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 50%;
          transform: translateX(-50%);
          border: 3px solid transparent;
          border-bottom: none;
          border-top-color: #7c3aed;
        }

        /* Bottom row: nudge + confirm */
        .nv-bottom {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nv-nudge-group {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 6px 12px;
          flex-shrink: 0;
        }

        .nv-nudge-btn {
          all: unset;
          width: 26px;
          height: 26px;
          border-radius: 6px;
          background: rgba(139,92,246,0.1);
          border: 1px solid rgba(139,92,246,0.2);
          color: rgba(167,139,250,0.8);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          line-height: 1;
          transition: all 0.12s;
          font-weight: 600;
        }

        .nv-nudge-btn:hover {
          background: rgba(139,92,246,0.22);
          border-color: rgba(139,92,246,0.5);
          color: #fff;
        }

        .nv-nudge-label {
          font-size: 9.5px;
          color: rgba(200,190,255,0.35);
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        @media (max-width: 480px) {
          .nv-ints {
            grid-template-columns: repeat(5, 1fr) !important;
            gap: 6px !important;
          }
        }

        /* Confirm button */
        .nv-confirm {
          all: unset;
          flex: 1;
          text-align: center;
          padding: 10px 0;
          border-radius: var(--radius);
          background: var(--purple-500);
          color: #fff;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          box-sizing: border-box;
          box-shadow: 0 4px 12px rgba(168, 85, 247, 0.25);
          transition: opacity 0.15s, transform 0.1s, box-shadow 0.15s;
          position: relative;
          overflow: hidden;
        }

        .nv-confirm::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.08), transparent);
          pointer-events: none;
        }

        .nv-confirm:hover {
          opacity: 0.92;
          box-shadow: 0 6px 22px rgba(168, 85, 247, 0.4);
        }

        .nv-confirm:active {
          transform: scale(0.98);
        }
      `}</style>

      <div className="nv-cgpa">
        {/* Header */}
        <div className="nv-header">
          <span className="nv-title">Academic CGPA</span>
          <motion.span
            className="nv-grade-pill"
            style={{ color: grade.color, borderColor: grade.color }}
            key={grade.text}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {grade.text}
          </motion.span>
        </div>

        {/* Score */}
        <div className="nv-score-row">
          <motion.span className="nv-big">
            {displayVal}
          </motion.span>
          <span className="nv-denom">/ 10</span>
        </div>

        {/* Integer buttons */}
        <div className="nv-ints">
          {INTEGERS.map((n) => (
            <motion.button
              key={n}
              type="button"
              className={`nv-int-btn ${activeInt === n ? 'active' : ''}`}
              whileTap={{ scale: 0.85 }}
              onClick={() => commit(n)}
            >
              {n}
            </motion.button>
          ))}
        </div>

        {/* Drag track */}
        <div
          className="nv-track-wrap"
          ref={trackRef}
          onMouseDown={(e) => { setDragging(true); onTrackPointer(e); }}
          onTouchStart={(e) => { setDragging(true); onTrackPointer(e); }}
          onClick={onTrackPointer}
        >
          <div className="nv-track-bg">
            <div className="nv-track-fill" style={{ width: `${percent}%` }} />
          </div>

          <div style={{ position: 'absolute', left: `${percent}%`, top: '50%', pointerEvents: 'none' }}>
            <AnimatePresence>
              {dragging && (
                <motion.div
                  className="nv-tooltip"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.1 }}
                >
                  {cgpa.toFixed(1)}
                </motion.div>
              )}
            </AnimatePresence>
            <div className={`nv-thumb ${dragging ? 'drag' : ''}`} />
          </div>
        </div>

        {/* Bottom: nudge + confirm */}
        <div className="nv-bottom">
          <div className="nv-nudge-group">
            <button
              type="button"
              className="nv-nudge-btn"
              onClick={() => commit(cgpa - 0.1)}
              aria-label="Decrease by 0.1"
            >−</button>
            <span className="nv-nudge-label">±0.1</span>
            <button
              type="button"
              className="nv-nudge-btn"
              onClick={() => commit(cgpa + 0.1)}
              aria-label="Increase by 0.1"
            >+</button>
          </div>

          <motion.button
            type="button"
            className="nv-confirm"
            onClick={() => onSubmit?.(String(cgpa))}
            whileTap={{ scale: 0.96 }}
          >
            Confirm {cgpa.toFixed(1)} →
          </motion.button>
        </div>
      </div>
    </>
  );
}