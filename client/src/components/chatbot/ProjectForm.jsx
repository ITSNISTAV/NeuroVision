import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderGit2,
  Trash2,
  Plus,
  Check,
  Terminal,
  FileCode,
  Layers
} from 'lucide-react';

const FEATURES_LIST = [
  { key: 'authentication', label: 'Auth System' },
  { key: 'database', label: 'Database' },
  { key: 'restApi', label: 'REST API' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'charts', label: 'Charts' },
  { key: 'roleBasedAccess', label: 'Role Access' },
  { key: 'deployment', label: 'CI/CD Cloud' },
  { key: 'readme', label: 'README' },
  { key: 'errorHandling', label: 'Error Logs' },
  { key: 'testing', label: 'Unit Tests' },
  { key: 'responsiveUI', label: 'Responsive' },
  { key: 'apiIntegration', label: '3rd Party API' },
  { key: 'fileUpload', label: 'File Upload' },
  { key: 'paymentIntegration', label: 'Payments' },
  { key: 'adminPanel', label: 'Admin Panel' }
];

const getRecommendedTech = (role) => {
  const normRole = String(role || '').toLowerCase();
  if (normRole.includes('frontend')) {
    return ['React', 'TypeScript', 'Vue', 'TailwindCSS', 'Redux', 'Next.js', 'Vite', 'HTML5', 'CSS3', 'Jest', 'Figma'];
  }
  if (normRole.includes('backend')) {
    return ['Node.js', 'Express', 'NestJS', 'Go', 'Python', 'FastAPI', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'REST API', 'GraphQL'];
  }
  if (normRole.includes('full stack') || normRole.includes('fullstack') || normRole.includes('software')) {
    return ['React', 'Node.js', 'Express', 'TypeScript', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'TailwindCSS', 'AWS', 'Next.js'];
  }
  if (normRole.includes('ai') || normRole.includes('ml') || normRole.includes('machine learning') || normRole.includes('data sci') || normRole.includes('artificial intelligence')) {
    return ['Python', 'PyTorch', 'TensorFlow', 'FastAPI', 'Scikit-Learn', 'Pandas', 'NumPy', 'Jupyter', 'PostgreSQL', 'Docker'];
  }
  if (normRole.includes('devops') || normRole.includes('cloud') || normRole.includes('sre') || normRole.includes('infrastructure')) {
    return ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD Pipelines', 'GitHub Actions', 'Jenkins', 'Linux', 'Prometheus', 'Grafana'];
  }
  if (normRole.includes('data eng')) {
    return ['Python', 'SQL', 'Spark', 'Kafka', 'Snowflake', 'Airflow', 'PostgreSQL', 'AWS', 'Docker'];
  }
  return ['React', 'Node.js', 'TypeScript', 'Python', 'PostgreSQL', 'MongoDB', 'Docker', 'REST API', 'Git', 'AWS'];
};

const getNormalizedProjectType = (role) => {
  const norm = String(role || '').toLowerCase();
  if (norm.includes('frontend')) return 'Frontend';
  if (norm.includes('backend')) return 'Backend';
  if (norm.includes('full stack') || norm.includes('fullstack')) return 'Full Stack';
  if (norm.includes('ai') || norm.includes('ml') || norm.includes('machine learning') || norm.includes('artificial')) return 'AI/ML';
  if (norm.includes('data analyst') || norm.includes('analytics') || norm.includes('data sci')) return 'Data Analytics';
  if (norm.includes('devops') || norm.includes('cloud') || norm.includes('sre') || norm.includes('infrastructure')) return 'DevOps/Cloud';
  return 'Full Stack'; // fallback
};

export default function ProjectForm({
  projects = [],
  targetRole = '',
  onAdd,
  onDelete,
  onComplete,
  disabled = false
}) {
  const [name, setName] = useState('');
  const [problemSolved, setProblemSolved] = useState('');
  const [selectedTechs, setSelectedTechs] = useState([]);
  const [customTech, setCustomTech] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState({});
  const [error, setError] = useState('');

  const recommendedTech = getRecommendedTech(targetRole);

  const handleTechToggle = (tech) => {
    if (selectedTechs.includes(tech)) {
      setSelectedTechs(prev => prev.filter(t => t !== tech));
    } else {
      setSelectedTechs(prev => [...prev, tech]);
    }
  };

  const handleFeatureToggle = (key) => {
    setSelectedFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCustomTechAdd = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
    const val = customTech.trim();
    if (val) {
      // Capitalize first letters nicely
      const normalized = val
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      if (!selectedTechs.includes(normalized)) {
        setSelectedTechs(prev => [...prev, normalized]);
      }
      setCustomTech('');
    }
  };

  const handleAddClick = () => {
    setError('');
    const cleanName = name.trim();
    const cleanProblem = problemSolved.trim();

    if (!cleanName) {
      setError('Please enter a project name.');
      return;
    }
    if (!cleanProblem) {
      setError('Please describe the problem solved or project goal.');
      return;
    }
    if (selectedTechs.length === 0) {
      setError('Please select or add at least one tech stack tool.');
      return;
    }

    if (projects.some((p) => p.name.toLowerCase() === cleanName.toLowerCase())) {
      setError(`A project named "${cleanName}" has already been added.`);
      return;
    }

    const newProject = {
      name: cleanName,
      type: getNormalizedProjectType(targetRole),
      problemSolved: cleanProblem,
      techStack: selectedTechs,
      githubLink: '',
      liveLink: '',
      features: { ...selectedFeatures }
    };

    onAdd(newProject);

    // Reset form states
    setName('');
    setProblemSolved('');
    setSelectedTechs([]);
    setSelectedFeatures({});
    setCustomTech('');
  };

  return (
    <div
      className="chatbot-project-form"
      style={{
        background: 'rgba(10, 0, 20, 0.45)',
        border: '1px solid rgba(168, 85, 247, 0.15)',
        borderRadius: 'var(--radius)',
        padding: '14px',
        height: '460px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}
    >
      {/* Scrollable Form Body Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '6px',
          marginBottom: '8px'
        }}
      >
        {/* Existing added projects list */}
        {projects.length > 0 && (
          <div className="chatbot-projects-list" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: 'var(--purple-300)', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Layers size={13} /> Added Projects ({projects.length})
            </label>
            <div className="projects-display-grid" style={{ margin: '8px 0 0 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <AnimatePresence initial={false}>
                {projects.map((proj, idx) => (
                  <motion.div
                    key={proj.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="project-showcase-card"
                    style={{
                      padding: '10px 12px',
                      minHeight: 'auto',
                      background: 'rgba(168, 85, 247, 0.05)',
                      border: '1px solid rgba(168, 85, 247, 0.15)',
                      borderRadius: '8px',
                      position: 'relative'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onDelete(idx)}
                      disabled={disabled}
                      className="proj-delete-btn"
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        fontSize: '10px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        color: '#f87171',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        padding: '2px 5px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Trash2 size={10} />
                    </button>
                    <div className="project-name" style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{proj.name}</div>
                    <div className="project-type" style={{ fontSize: '9px', marginBottom: '2px', color: 'var(--accent)', fontWeight: 600 }}>{proj.type}</div>
                    <p className="project-problem" style={{ fontSize: '10.5px', color: 'var(--text-secondary)', margin: '4px 0 6px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {proj.problemSolved}
                    </p>
                    <div className="project-techs" style={{ display: 'flex', gap: '4px' }}>
                      {(proj.techStack || []).slice(0, 4).map((t) => (
                        <span key={t} className="project-tech-badge" style={{ fontSize: '8px', padding: '1px 5px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>{t}</span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Project Name Manual Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', color: 'var(--purple-300)', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FolderGit2 size={12} /> Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AI-Powered Recommendation Engine"
              disabled={disabled}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                padding: '8px 10px',
                color: '#fff',
                fontSize: '12px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
          </div>

          {/* Description / Problem Solved */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', color: 'var(--purple-300)', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FileCode size={12} /> Description (Problem Solved)
            </label>
            <textarea
              value={problemSolved}
              onChange={(e) => setProblemSolved(e.target.value)}
              placeholder="e.g. Solved slow analytics reports by compiling an optimized Redis cache system and DB index optimization, speeding up query execution by 78%."
              disabled={disabled}
              rows={3}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                padding: '8px 10px',
                color: '#fff',
                fontSize: '12px',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s'
              }}
            />
          </div>

          {/* Recommended Tech Stack (Dynamic based on targetRole) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', color: 'var(--purple-300)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Terminal size={12} /> Tech Stack Selection
            </label>
            <div className="chip-select-grid" style={{ padding: '8px', background: 'rgba(0,0,0,0.15)', borderRadius: '6px' }}>
              {recommendedTech.map((tech) => {
                const isSelected = selectedTechs.includes(tech);
                return (
                  <button
                    key={tech}
                    type="button"
                    className={`option-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => handleTechToggle(tech)}
                    disabled={disabled}
                    style={{
                      fontSize: '9.5px',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {tech}
                  </button>
                );
              })}
            </div>
            {/* Custom tech input */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={customTech}
                onChange={(e) => setCustomTech(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomTechAdd(e)}
                placeholder="Add other tech tool..."
                disabled={disabled}
                style={{
                  flex: 1,
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  color: '#fff',
                  fontSize: '11px',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={handleCustomTechAdd}
                disabled={disabled || !customTech.trim()}
                className="btn-add"
                style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px', cursor: 'pointer', height: '28px', display: 'flex', alignItems: 'center' }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Features implemented */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', color: 'var(--purple-300)', textTransform: 'uppercase', fontWeight: 600 }}>
              Features Implemented
            </label>
            <div className="chip-select-grid" style={{ maxHeight: '90px', overflowY: 'auto', padding: '8px', background: 'rgba(0,0,0,0.15)', borderRadius: '6px' }}>
              {FEATURES_LIST.map((feat) => {
                const isChecked = selectedFeatures[feat.key];
                return (
                  <button
                    key={feat.key}
                    type="button"
                    className={`option-chip ${isChecked ? 'active' : ''}`}
                    onClick={() => handleFeatureToggle(feat.key)}
                    disabled={disabled}
                    style={{
                      fontSize: '9.5px',
                      padding: '4px 10px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {feat.label} {isChecked && <Check size={10} />}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {error && (
        <div className="chatbot-project-error" style={{ fontSize: '11px', marginTop: '4px', color: 'var(--error)' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Action Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '10px',
          paddingBottom: '4px'
        }}
      >
        <button
          type="button"
          onClick={onComplete}
          disabled={disabled}
          className="btn-reset"
          style={{ padding: '8px 16px', fontSize: '12px', borderRadius: 'var(--radius)', cursor: 'pointer' }}
        >
          {projects.length > 0 ? 'Continue to Review →' : 'Skip Projects →'}
        </button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddClick}
          disabled={disabled}
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
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Plus size={13} /> Add Project
        </motion.button>
      </div>
    </div>
  );
}
