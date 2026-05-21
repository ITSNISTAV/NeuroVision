import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Award, 
  Trash2, 
  Edit3, 
  Save, 
  RotateCcw, 
  Check, 
  FileCode, 
  Sparkles,
  FolderGit2,
  Tag,
  Cpu,
  GraduationCap
} from 'lucide-react';
import { LEVEL_LABELS } from './chatbotSteps';

export default function ReviewSummary({
  profileData,
  onUpdateField,
  onSave,
  onReset,
  isSaving = false,
  error = ''
}) {
  const [editingSection, setEditingSection] = useState(null); // 'basic' | 'academics' | 'tags' | null

  // Basic editing states
  const [github, setGithub] = useState(profileData.githubUsername || '');
  const [stack, setStack] = useState(profileData.selectedStack || profileData.preferredStack || '');
  const [cgpa, setCgpa] = useState(profileData.cgpa || 7.0);
  const [internship, setInternship] = useState(profileData.internshipMonths || 0);

  // DSA & Core Subject editing states
  const [dsaLevel, setDsaLevel] = useState(profileData.dsa?.level || 'Beginner');
  const [dsaRange, setDsaRange] = useState(profileData.dsa?.problemsSolvedRange || '0-25');
  const [oop, setOop] = useState(profileData.coreSubjects?.oop || 3);
  const [dbms, setDbms] = useState(profileData.coreSubjects?.dbms || 3);
  const [os, setOs] = useState(profileData.coreSubjects?.os || 3);
  const [cn, setCn] = useState(profileData.coreSubjects?.cn || 3);

  // Tools & Characteristics editing states
  const [toolsStr, setToolsStr] = useState((profileData.tools || []).join(', '));
  const [strengthsStr, setStrengthsStr] = useState((profileData.strengths || []).join(', '));
  const [weaknessesStr, setWeaknessesStr] = useState((profileData.weaknesses || []).join(', '));

  const handleSaveBasic = () => {
    onUpdateField('githubUsername', github);
    onUpdateField('selectedStack', stack);
    onUpdateField('preferredStack', stack);
    onUpdateField('cgpa', Number(cgpa));
    onUpdateField('internshipMonths', Number(internship));
    setEditingSection(null);
  };

  const handleSaveAcademics = () => {
    onUpdateField('dsa', { level: dsaLevel, problemsSolvedRange: dsaRange });
    onUpdateField('coreSubjects', { oop, dbms, os, cn });
    setEditingSection(null);
  };

  const handleSaveTags = () => {
    const parseTags = (str) =>
      str
         .split(',')
         .map((t) => t.trim())
         .filter(Boolean);
    onUpdateField('tools', parseTags(toolsStr));
    onUpdateField('strengths', parseTags(strengthsStr));
    onUpdateField('weaknesses', parseTags(weaknessesStr));
    setEditingSection(null);
  };

  const renderStars = (level) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s} style={{ fontSize: '10px', color: s <= level ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }}>★</span>
        ))}
      </div>
    );
  };

  return (
    <div className="review-dashboard-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px', marginBottom: '4px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', color: '#fff', margin: 0, fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} style={{ color: 'var(--accent)' }} /> Profile Onboarding Review
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Validate and tweak your settings before generating the score card.</span>
        </div>
        <span style={{ fontSize: '11.5px', color: 'var(--accent)', fontWeight: 600, background: 'rgba(168, 85, 247, 0.1)', padding: '4px 12px', borderRadius: '100px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
          Role: {profileData.role}
        </span>
      </div>
 
      <div className="review-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        
        {/* Basic Section */}
        <div className="review-section-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <div className="review-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="review-section-title" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--purple-200)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} /> Basic Information
            </span>
            {editingSection !== 'basic' ? (
              <button
                type="button"
                className="reset-small"
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '2px 8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--purple-300)', cursor: 'pointer', borderRadius: '4px' }}
                onClick={() => {
                  setGithub(profileData.githubUsername || '');
                  setStack(profileData.selectedStack || profileData.preferredStack || '');
                  setCgpa(profileData.cgpa || 7.0);
                  setInternship(profileData.internshipMonths || 0);
                  setEditingSection('basic');
                }}
              >
                <Edit3 size={11} /> Edit
              </button>
            ) : (
              <button type="button" className="btn-add" style={{ padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={handleSaveBasic}>
                <Check size={11} /> Save
              </button>
            )}
          </div>

          <div className="review-section-body" style={{ flex: 1 }}>
            <AnimatePresence mode="wait">
              {editingSection === 'basic' ? (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="review-edit-form" 
                  style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                  <div className="review-edit-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="review-edit-field">
                      <label style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>GitHub Username</label>
                      <input type="text" value={github} onChange={(e) => setGithub(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '4px 6px', color: '#fff', fontSize: '11px' }} />
                    </div>
                    <div className="review-edit-field">
                      <label style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Preferred Stack</label>
                      <input type="text" value={stack} onChange={(e) => setStack(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '4px 6px', color: '#fff', fontSize: '11px' }} />
                    </div>
                  </div>
                  <div className="review-edit-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="review-edit-field">
                      <label style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>CGPA</label>
                      <input type="number" min={1} max={10} step={0.1} value={cgpa} onChange={(e) => setCgpa(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '4px 6px', color: '#fff', fontSize: '11px' }} />
                    </div>
                    <div className="review-edit-field">
                      <label style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Internship Months</label>
                      <input type="number" min={0} value={internship} onChange={(e) => setInternship(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '4px 6px', color: '#fff', fontSize: '11px' }} />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="review-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span className="review-row-label" style={{ color: 'var(--text-secondary)' }}>GitHub Username</span>
                    <span className="review-row-value" style={{ color: '#fff' }}>
                      {profileData.githubUsername ? (
                        <a href={`https://github.com/${profileData.githubUsername}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <FolderGit2 size={11} /> {profileData.githubUsername} ↗
                        </a>
                      ) : (
                        '—'
                      )}
                    </span>
                  </div>
                  <div className="review-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span className="review-row-label" style={{ color: 'var(--text-secondary)' }}>Selected Tech Stack</span>
                    <span className="review-row-value" style={{ color: '#fff', fontWeight: 600 }}>{profileData.selectedStack || profileData.preferredStack || '—'}</span>
                  </div>
                  <div className="review-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span className="review-row-label" style={{ color: 'var(--text-secondary)' }}>CGPA</span>
                    <span className="review-row-value" style={{ color: 'var(--accent)', fontWeight: 700 }}>{profileData.cgpa}</span>
                  </div>
                  <div className="review-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span className="review-row-label" style={{ color: 'var(--text-secondary)' }}>Internship Experience</span>
                    <span className="review-row-value" style={{ color: '#fff' }}>{profileData.internshipMonths} months</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* DSA & CS Academics Section */}
        <div className="review-section-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <div className="review-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="review-section-title" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--purple-200)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <GraduationCap size={14} /> DSA & CS Academics
            </span>
            {editingSection !== 'academics' ? (
              <button
                type="button"
                className="reset-small"
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '2px 8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--purple-300)', cursor: 'pointer', borderRadius: '4px' }}
                onClick={() => {
                  setDsaLevel(profileData.dsa?.level || 'Beginner');
                  setDsaRange(profileData.dsa?.problemsSolvedRange || '0-25');
                  setOop(profileData.coreSubjects?.oop || 3);
                  setDbms(profileData.coreSubjects?.dbms || 3);
                  setOs(profileData.coreSubjects?.os || 3);
                  setCn(profileData.coreSubjects?.cn || 3);
                  setEditingSection('academics');
                }}
              >
                <Edit3 size={11} /> Edit
              </button>
            ) : (
              <button type="button" className="btn-add" style={{ padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={handleSaveAcademics}>
                <Check size={11} /> Save
              </button>
            )}
          </div>

          <div className="review-section-body" style={{ flex: 1 }}>
            <AnimatePresence mode="wait">
              {editingSection === 'academics' ? (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="review-edit-form" 
                  style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                  <div className="review-edit-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="review-edit-field">
                      <label style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>DSA Level</label>
                      <div className="select-wrapper">
                        <select value={dsaLevel} onChange={(e) => setDsaLevel(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '4px 6px', color: '#fff', fontSize: '11px' }}>
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                    </div>
                    <div className="review-edit-field">
                      <label style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Problems Solved</label>
                      <div className="select-wrapper">
                        <select value={dsaRange} onChange={(e) => setDsaRange(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '4px 6px', color: '#fff', fontSize: '11px' }}>
                          <option value="0-25">0-25</option>
                          <option value="25-75">25-75</option>
                          <option value="75-150">75-150</option>
                          <option value="150+">150+</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '6px' }}>
                    <div className="review-edit-field">
                      <label style={{ fontSize: '9px', color: 'var(--text-secondary)', display: 'block' }}>OOP</label>
                      <input type="number" min={1} max={5} value={oop} onChange={(e) => setOop(Number(e.target.value))} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '4px 6px', color: '#fff', fontSize: '11px', textAlign: 'center' }} />
                    </div>
                    <div className="review-edit-field">
                      <label style={{ fontSize: '9px', color: 'var(--text-secondary)', display: 'block' }}>DBMS</label>
                      <input type="number" min={1} max={5} value={dbms} onChange={(e) => setDbms(Number(e.target.value))} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '4px 6px', color: '#fff', fontSize: '11px', textAlign: 'center' }} />
                    </div>
                    <div className="review-edit-field">
                      <label style={{ fontSize: '9px', color: 'var(--text-secondary)', display: 'block' }}>OS</label>
                      <input type="number" min={1} max={5} value={os} onChange={(e) => setOs(Number(e.target.value))} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '4px 6px', color: '#fff', fontSize: '11px', textAlign: 'center' }} />
                    </div>
                    <div className="review-edit-field">
                      <label style={{ fontSize: '9px', color: 'var(--text-secondary)', display: 'block' }}>CN</label>
                      <input type="number" min={1} max={5} value={cn} onChange={(e) => setCn(Number(e.target.value))} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '4px 6px', color: '#fff', fontSize: '11px', textAlign: 'center' }} />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="review-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span className="review-row-label" style={{ color: 'var(--text-secondary)' }}>DSA Skill Profile</span>
                    <span className="review-row-value" style={{ color: '#fff', fontWeight: 600 }}>
                      {profileData.dsa?.level || 'Beginner'} ({profileData.dsa?.problemsSolvedRange || '0-25'} solved)
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'rgba(0,0,0,0.18)', padding: '10px 4px', borderRadius: '6px', textAlign: 'center', fontSize: '11px', marginTop: '6px', border: '1px solid rgba(255,255,255,0.02)' }}>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '9px', textTransform: 'uppercase' }}>OOP</div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
                        <span style={{ fontWeight: 'bold', color: '#fff' }}>{profileData.coreSubjects?.oop || 3}</span>
                        {renderStars(profileData.coreSubjects?.oop || 3)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '9px', textTransform: 'uppercase' }}>DBMS</div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
                        <span style={{ fontWeight: 'bold', color: '#fff' }}>{profileData.coreSubjects?.dbms || 3}</span>
                        {renderStars(profileData.coreSubjects?.dbms || 3)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '9px', textTransform: 'uppercase' }}>OS</div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
                        <span style={{ fontWeight: 'bold', color: '#fff' }}>{profileData.coreSubjects?.os || 3}</span>
                        {renderStars(profileData.coreSubjects?.os || 3)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '9px', textTransform: 'uppercase' }}>CN</div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
                        <span style={{ fontWeight: 'bold', color: '#fff' }}>{profileData.coreSubjects?.cn || 3}</span>
                        {renderStars(profileData.coreSubjects?.cn || 3)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Skills Matrix Section */}
        <div className="review-section-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <div className="review-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span className="review-section-title" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--purple-200)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={14} /> Mapped Tech Skills
            </span>
          </div>
          <div className="review-section-body" style={{ flex: 1, maxHeight: '130px', overflowY: 'auto', paddingRight: '4px' }}>
            {profileData.technicalSkills?.length === 0 ? (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No technical skills mapped.</span>
            ) : (
              (profileData.technicalSkills || []).map((s) => (
                <div key={s.skill} className="review-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '11.5px' }}>
                  <span className="review-row-label" style={{ color: 'var(--text-secondary)' }}>{s.skill}</span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>L{s.level}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>({LEVEL_LABELS[s.level]})</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tools & Characteristics Section */}
        <div className="review-section-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <div className="review-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="review-section-title" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--purple-200)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={14} /> Tools & Characteristics
            </span>
            {editingSection !== 'tags' ? (
              <button
                type="button"
                className="reset-small"
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '2px 8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--purple-300)', cursor: 'pointer', borderRadius: '4px' }}
                onClick={() => {
                  setToolsStr((profileData.tools || []).join(', '));
                  setStrengthsStr((profileData.strengths || []).join(', '));
                  setWeaknessesStr((profileData.weaknesses || []).join(', '));
                  setEditingSection('tags');
                }}
              >
                <Edit3 size={11} /> Edit
              </button>
            ) : (
              <button type="button" className="btn-add" style={{ padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={handleSaveTags}>
                <Check size={11} /> Save
              </button>
            )}
          </div>

          <div className="review-section-body" style={{ flex: 1 }}>
            <AnimatePresence mode="wait">
              {editingSection === 'tags' ? (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="review-edit-form" 
                  style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
                >
                  <div className="review-edit-field">
                    <label style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Tools (comma-separated)</label>
                    <input type="text" value={toolsStr} onChange={(e) => setToolsStr(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '4px 6px', color: '#fff', fontSize: '11px' }} />
                  </div>
                  <div className="review-edit-field">
                    <label style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Strengths (comma-separated)</label>
                    <input type="text" value={strengthsStr} onChange={(e) => setStrengthsStr(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '4px 6px', color: '#fff', fontSize: '11px' }} />
                  </div>
                  <div className="review-edit-field">
                    <label style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Weaknesses (comma-separated)</label>
                    <input type="text" value={weaknessesStr} onChange={(e) => setWeaknessesStr(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '4px 6px', color: '#fff', fontSize: '11px' }} />
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginBottom: '3px', textTransform: 'uppercase', fontWeight: 600 }}>Tools & Tech</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {(profileData.tools || []).length > 0
                        ? profileData.tools.map((t) => <span key={t} style={{ fontSize: '9px', background: 'rgba(217, 70, 239, 0.08)', border: '1px solid rgba(217, 70, 239, 0.15)', padding: '2px 6px', borderRadius: '4px', color: 'var(--purple-200)' }}>{t}</span>)
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginBottom: '3px', textTransform: 'uppercase', fontWeight: 600 }}>Strengths</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {(profileData.strengths || []).length > 0
                        ? profileData.strengths.map((s) => <span key={s} style={{ fontSize: '9px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px', color: '#6ee7b7' }}>{s}</span>)
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginBottom: '3px', textTransform: 'uppercase', fontWeight: 600 }}>Weaknesses</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {(profileData.weaknesses || []).length > 0
                        ? profileData.weaknesses.map((w) => <span key={w} style={{ fontSize: '9px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '2px 6px', borderRadius: '4px', color: '#fca5a5' }}>{w}</span>)
                        : '—'}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Projects Showcase section */}
      <div className="review-section-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
        <div className="review-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span className="review-section-title" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--purple-200)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileCode size={14} /> Projects Showcase ({(profileData.projects || []).length})
          </span>
        </div>
        <div className="review-section-body" style={{ maxHeight: '110px', overflowY: 'auto' }}>
          {(profileData.projects || []).length === 0 ? (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No projects added yet.</span>
          ) : (
            <div className="projects-display-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <AnimatePresence>
                {profileData.projects.map((proj, pIdx) => (
                  <motion.div 
                    key={proj.name} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="project-showcase-card" 
                    style={{ padding: '10px', position: 'relative', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.15)' }}
                  >
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = profileData.projects.filter((_, idx) => idx !== pIdx);
                          onUpdateField('projects', updated);
                        }}
                        className="proj-delete-btn"
                        style={{ position: 'absolute', top: '6px', right: '6px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '9px' }}
                      >
                        ✕
                      </button>
                      <div className="project-name" style={{ fontSize: '11.5px', fontWeight: 700, color: '#fff' }}>{proj.name}</div>
                      <div className="project-type" style={{ fontSize: '9px', color: 'var(--accent)', fontWeight: 600, marginTop: '1px' }}>{proj.type}</div>
                      <p className="project-problem" style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: '4px 0 6px 0', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{proj.problemSolved}</p>
                    </div>
                    <div className="project-techs" style={{ display: 'flex', gap: '3px' }}>
                      {(proj.techStack || []).slice(0, 3).map((t) => (
                        <span key={t} className="project-tech-badge" style={{ fontSize: '8px', padding: '1px 4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>{t}</span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="chatbot-project-error" style={{ fontSize: '12px', color: 'var(--error)' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Save Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
        <motion.button
          type="button"
          disabled={isSaving}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-submit"
          onClick={onSave}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', padding: '12px', background: 'var(--purple-500)', border: 'none', borderRadius: 'var(--radius)', color: '#fff', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 12px rgba(168, 85, 247, 0.2)' }}
        >
          {isSaving ? (
            <>
              <span className="btn-loader spinning" style={{ position: 'relative', right: '0' }} />
              Finalizing Profile Summary...
            </>
          ) : (
            <>
              <Check size={16} /> Save Profile & Launch Dashboard
            </>
          )}
        </motion.button>
        <button 
          type="button" 
          disabled={isSaving} 
          className="btn-reset" 
          onClick={onReset} 
          style={{ flex: 0.25, fontSize: '13px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: 'var(--radius)', cursor: 'pointer' }}
        >
          <RotateCcw size={14} /> Restart
        </button>
      </div>
    </div>
  );
}
