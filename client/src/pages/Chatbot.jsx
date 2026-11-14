import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Lock, Circle, RotateCcw, X } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import {
  STEPS,
  INITIAL_PROFILE,
  LEVEL_LABELS,
  validateField,
  validateTagsInput
} from '../components/chatbot/chatbotSteps';

// Modular Sub-components
import ChatInput from '../components/chatbot/ChatInput';
import ProjectForm from '../components/chatbot/ProjectForm';
import ReviewSummary from '../components/chatbot/ReviewSummary';
import CgpaSelector from '../components/chatbot/CgpaSelector';
import InternshipTimeline from '../components/chatbot/InternshipTimeline';
import SkillsMatrix from '../components/chatbot/SkillsMatrix';
import CSCompetencyDials from '../components/chatbot/CSCompetencyDials';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Autosave draft helper (pure outer function)
function saveDraft(updatedProfile, currentStep, currentSubStep = 0, skillIdx = 0) {
  const draftData = {
    profile: updatedProfile,
    step: currentStep,
    subStep: currentSubStep,
    skillIndex: skillIdx,
    timestamp: Date.now()
  };
  localStorage.setItem('nv_onboarding_draft', JSON.stringify(draftData));
}

const SIDEBAR_STEPS = [
  { id: STEPS.WELCOME, label: 'Welcome' },
  { id: STEPS.ROLE, label: 'Target Role' },
  { id: STEPS.GITHUB_STACK, label: 'GitHub & Stack' },
  { id: STEPS.ACADEMICS, label: 'Academics' },
  { id: STEPS.SKILLS, label: 'Skills' },
  { id: STEPS.TOOLS, label: 'Tools' },
  { id: STEPS.CORE_SUBJECTS, label: 'CS Subjects' },
  { id: STEPS.DSA, label: 'DSA Profile' },
  { id: STEPS.STRENGTHS_WEAKNESSES, label: 'Characteristics' },
  { id: STEPS.PROJECTS, label: 'Projects' },
  { id: STEPS.REVIEW, label: 'Review' },
  { id: STEPS.DONE, label: 'Complete' }
];

export default function Chatbot({ editProfileData = null, onProfileSaved = null, onCancelEdit = null }) {
  const { user } = useAuth();
  const userId = user?._id;
  const bottomRef = useRef(null);
  const chatStreamRef = useRef(null);
  const reviewContainerRef = useRef(null);

  // Core Chatbot States
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [step, setStep] = useState(STEPS.WELCOME);
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [inputValue, setInputValue] = useState('');
  const [rolesList, setRolesList] = useState([]);
  const [roleSkills, setRoleSkills] = useState([]);
  const [selectedRoleDef, setSelectedRoleDef] = useState(null);

  // Sub-flow indexing/tracking
  const [subStep, setSubStep] = useState(0); // 0: GitHub username, 1: Preferred stack inside GITHUB_STACK
  const [skillIndex, setSkillIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  
  // Resume draft state
  const [hasDraft, setHasDraft] = useState(false);
  const bootRef = useRef(false);

  // QoL Refinements States
  const [duplicateRole, setDuplicateRole] = useState(null);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Interactive Options & Sliders state upgrades
  const [skillsRatings, setSkillsRatings] = useState({});
  const [selectedTools, setSelectedTools] = useState([]);
  const [customToolInput, setCustomToolInput] = useState('');
  const [selectedStrengths, setSelectedStrengths] = useState([]);
  const [customStrengthInput, setCustomStrengthInput] = useState('');
  const [selectedWeaknesses, setSelectedWeaknesses] = useState([]);
  const [customWeaknessInput, setCustomWeaknessInput] = useState('');
  const [dsaLevel, setDsaLevel] = useState('Beginner');
  const [dsaRange, setDsaRange] = useState('0-25');

  // Trigger editing when editProfileData prop changes
  useEffect(() => {
    if (editProfileData && editProfileData.role) {
      setProfile(editProfileData);
      setIsEditingExisting(true);
      setStep(STEPS.REVIEW);
      setMessages([
        {
          id: `edit-init-${Date.now()}`,
          from: 'bot',
          text: `✏️ **Editing Profile**: Loaded details for **${editProfileData.role}**.\n\nYou can review all currently saved metrics in the summary dashboard below. To adjust a specific field, select it on the dashboard or use the sidebar steps.`
        }
      ]);
      
      setSelectedTools(editProfileData.tools || []);
      setSelectedStrengths(editProfileData.strengths || []);
      setSelectedWeaknesses(editProfileData.weaknesses || []);
      setDsaLevel(editProfileData.dsa?.level || 'Beginner');
      setDsaRange(editProfileData.dsa?.problemsSolvedRange || '0-25');
      
      const ratings = {};
      (editProfileData.technicalSkills || []).forEach(ts => {
        ratings[ts.skill] = ts.level;
      });
      setSkillsRatings(ratings);

      api.get(`/roles/${encodeURIComponent(editProfileData.role)}`).then((res) => {
        setSelectedRoleDef(res.data);
        const stack = editProfileData.selectedStack || editProfileData.preferredStack;
        let newRoleSkills = [];
        if (res.data && stack) {
          const matchedStack = res.data.stacks.find(
            (s) => s.stackName.toLowerCase() === stack.toLowerCase()
          );
          if (matchedStack) {
            newRoleSkills = matchedStack.skills.map((s) => s.name);
          }
        }
        if (newRoleSkills.length === 0) {
          newRoleSkills = (res.data.skills || []).map((s) => s.name);
        }
        setRoleSkills(newRoleSkills);
      }).catch(() => {
        setRoleSkills((editProfileData.technicalSkills || []).map(s => s.skill));
      });
    }
  }, [editProfileData]);

  const pushMessage = useCallback((from, text) => {
    setMessages((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, from, text }]);
  }, []);

  const botSay = useCallback(
    async (text) => {
      setTyping(true);
      await sleep(550);
      setTyping(false);
      pushMessage('bot', text);
    },
    [pushMessage]
  );

  // Auto-scroll to bottom of chat log and align page viewport
  useEffect(() => {
    if (chatStreamRef.current) {
      const container = chatStreamRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }

    if (!typing) {
      const timer = setTimeout(() => {
        const chatbotEl = document.querySelector('.chatbot-section');
        if (chatbotEl) {
          chatbotEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [messages, typing]);

  // Scroll to top of review content and align chatbot-section at start of viewport on review step
  useEffect(() => {
    if (step === STEPS.REVIEW) {
      if (reviewContainerRef.current) {
        reviewContainerRef.current.scrollTop = 0;
      }
      const chatbotEl = document.querySelector('.chatbot-section');
      if (chatbotEl) {
        chatbotEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [step]);

  // Prefill input value when editing or resuming existing fields
  useEffect(() => {
    if (hasDraft || step === STEPS.WELCOME || step === STEPS.ROLE || step === 'DUPLICATE_PROMPT') {
      setInputValue('');
      return;
    }
    if (step === STEPS.GITHUB_STACK) {
      setInputValue(subStep === 0 ? (profile.githubUsername || '') : (profile.preferredStack || ''));
    } else if (step === STEPS.ACADEMICS) {
      setInputValue(subStep === 0 ? (profile.cgpa ? String(profile.cgpa) : '7.0') : (profile.internshipMonths ? String(profile.internshipMonths) : '0'));
    } else if (step === STEPS.TOOLS) {
      setInputValue(profile.tools?.join(', ') || '');
    } else if (step === STEPS.STRENGTHS_WEAKNESSES) {
      setInputValue(subStep === 0 ? profile.strengths?.join(', ') || '' : profile.weaknesses?.join(', ') || '');
    } else {
      setInputValue('');
    }
  }, [step, subStep, hasDraft]);

  // Load target roles on mount
  useEffect(() => {
    api
      .get('/roles')
      .then((res) => setRolesList(Array.isArray(res.data) ? res.data : []))
      .catch(() => setRolesList([]));
  }, []);

  // Check for local storage drafts and welcome user
  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;

    const draft = localStorage.getItem('nv_onboarding_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed && parsed.profile && parsed.profile.role) {
          setTimeout(() => {
            setHasDraft(true);
            setMessages([
              {
                id: 'init-1',
                from: 'bot',
                text: "Welcome back! I found a draft onboarding session from your last visit."
              },
              {
                id: 'init-2',
                from: 'bot',
                text: `Would you like to resume building your **${parsed.profile.role}** profile, or start a new session?`
              }
            ]);
          }, 0);
          return;
        }
      } catch {
        localStorage.removeItem('nv_onboarding_draft');
      }
    }

    // Default boot
    (async () => {
      await botSay("Welcome to NeuroVision's guided profile builder!");
      await sleep(300);
      setStep(STEPS.ROLE);
      await botSay("Which job role are you targeting?");
    })();
  }, [botSay]);

  // Resume / Start fresh handlers
  const handleResume = () => {
    const draft = localStorage.getItem('nv_onboarding_draft');
    if (draft) {
      try {
        const { profile: dProfile, step: dStep, subStep: dSub, skillIndex: dSkill } = JSON.parse(draft);
        setProfile(dProfile);
        setStep(dStep);
        setSubStep(dSub);
        setSkillIndex(dSkill);
        setHasDraft(false);

        pushMessage('user', 'Resume Draft');

        // Preload multi-select elements
        setSelectedTools(dProfile.tools || []);
        setSelectedStrengths(dProfile.strengths || []);
        setSelectedWeaknesses(dProfile.weaknesses || []);
        setDsaLevel(dProfile.dsa?.level || 'Beginner');
        setDsaRange(dProfile.dsa?.problemsSolvedRange || '0-25');
        
        // Re-load skills if role selected
        if (dProfile.role) {
          api.get(`/roles/${encodeURIComponent(dProfile.role)}`).then((res) => {
            setSelectedRoleDef(res.data);
            const stack = dProfile.selectedStack || dProfile.preferredStack;
            let newRoleSkills = [];
            if (res.data && stack) {
              const matchedStack = res.data.stacks.find(
                (s) => s.stackName.toLowerCase() === stack.toLowerCase()
              );
              if (matchedStack) {
                newRoleSkills = matchedStack.skills.map((s) => s.name);
              }
            }
            if (newRoleSkills.length === 0) {
              newRoleSkills = (res.data.skills || []).map((s) => s.name);
            }
            setRoleSkills(newRoleSkills);
            const initial = {};
            newRoleSkills.forEach((sName) => {
              const found = dProfile.technicalSkills?.find((ts) => ts.skill === sName);
              initial[sName] = found ? found.level : 3;
            });
            setSkillsRatings(initial);
          });
        }

        // Trigger bot greeting depending on step
        botSay(`Resumed! Let's continue from your saved progress.`);
      } catch (_err) {
        handleStartFresh();
      }
    }
  };

  const handleStartFresh = () => {
    localStorage.removeItem('nv_onboarding_draft');
    setProfile(INITIAL_PROFILE);
    setStep(STEPS.ROLE);
    setHasDraft(false);
    
    // Reset selections
    setSkillsRatings({});
    setSelectedTools([]);
    setSelectedStrengths([]);
    setSelectedWeaknesses([]);
    setDsaLevel('Beginner');
    setDsaRange('0-25');

    pushMessage('user', 'Start New Profile');
    botSay("Alright, starting fresh! Which job role are you targeting?");
  };

  // Core flow reply coordinator
  const handleUserSubmit = async (text) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    // Handle duplicate role prompt replies separately
    if (step === 'DUPLICATE_PROMPT') {
      await handleDuplicateAction(cleanText);
      return;
    }

    pushMessage('user', cleanText);
    setInputValue('');

    // Flow states
    if (step === STEPS.GITHUB_STACK) {
      if (subStep === 0) {
        const githubVal = cleanText.toLowerCase() === 'none' || cleanText.toLowerCase() === 'skip' ? '' : cleanText;
        const nextProfile = { ...profile, githubUsername: githubVal };
        setProfile(nextProfile);
        setSubStep(1);
        setInputValue('');
        saveDraft(nextProfile, STEPS.GITHUB_STACK, 1);
        await botSay("Got it! Next, what is your **Preferred Tech Stack**? Select from the options below:");
      } else {
        const stack = cleanText.toLowerCase() === 'none' || cleanText.toLowerCase() === 'skip' ? '' : cleanText;
        const nextProfile = { ...profile, preferredStack: stack, selectedStack: stack };

        let newRoleSkills = [];
        if (selectedRoleDef && stack) {
          const matchedStack = selectedRoleDef.stacks.find(
            (s) => s.stackName.toLowerCase() === stack.toLowerCase()
          );
          if (matchedStack) {
            newRoleSkills = matchedStack.skills.map((s) => s.name);
          }
        }
        if (newRoleSkills.length === 0 && selectedRoleDef) {
          newRoleSkills = (selectedRoleDef.skills || []).map((s) => s.name);
        }
        setRoleSkills(newRoleSkills);

        const initial = {};
        newRoleSkills.forEach((sName) => {
          initial[sName] = 3;
        });
        setSkillsRatings(initial);

        setProfile(nextProfile);
        setStep(STEPS.ACADEMICS);
        setSubStep(0);
        setInputValue('7.0');
        saveDraft(nextProfile, STEPS.ACADEMICS, 0);
        await botSay("Great. Let's record your academic profile. What is your **CGPA**? (Use the slider below)");
      }
    }

    else if (step === STEPS.ACADEMICS) {
      if (subStep === 0) {
        const err = validateField('cgpa', cleanText);
        if (err) {
          await botSay(`⚠️ ${err}. Let's try again. What is your CGPA?`);
          return;
        }
        const nextProfile = { ...profile, cgpa: Number(cleanText) };
        setProfile(nextProfile);
        setSubStep(1);
        setInputValue('0');
        saveDraft(nextProfile, STEPS.ACADEMICS, 1);
        await botSay("How many months of **Internship Experience** do you have? (Use the slider below)");
      } else {
        const err = validateField('internshipMonths', cleanText);
        if (err) {
          await botSay(`⚠️ ${err}. How many months of internship experience do you have?`);
          return;
        }
        const nextProfile = { ...profile, internshipMonths: Number(cleanText) };
        setProfile(nextProfile);
        
        // Next: technical skills rating
        setStep(STEPS.SKILLS);
        setSkillIndex(0);
        saveDraft(nextProfile, STEPS.SKILLS, 0, 0);

        // Pre-initialize skillsRatings
        const initial = {};
        roleSkills.forEach((sName) => {
          initial[sName] = 3;
        });
        setSkillsRatings(initial);
        
        await botSay("Academics saved. Let's rate your core technical skills!");
        if (roleSkills.length > 0) {
          await botSay("Use the interactive sliders below to rate each skill, then click Submit.");
        } else {
          // If no role skills, jump straight to tools
          setStep(STEPS.TOOLS);
          saveDraft(nextProfile, STEPS.TOOLS);
          await botSay("No skill list found for this role. Enter any **Tools & Technologies** you use:");
        }
      }
    }

    else if (step === STEPS.TOOLS) {
      if (cleanText.toLowerCase() === 'none' || cleanText.toLowerCase() === 'skip') {
        const nextProfile = { ...profile, tools: [] };
        setProfile(nextProfile);
        setStep(STEPS.CORE_SUBJECTS);
        saveDraft(nextProfile, STEPS.CORE_SUBJECTS);
        await botSay("Perfect! Next, rate your understanding of Core CS subjects below:");
      } else {
        const validation = validateTagsInput(cleanText);
        if (!validation.isValid) {
          await botSay(`⚠️ ${validation.error} Let's try again. What developer tools & technologies do you use?`);
          return;
        }
        const tools = validation.tokens;
        const nextProfile = { ...profile, tools };
        setProfile(nextProfile);
        setStep(STEPS.CORE_SUBJECTS);
        saveDraft(nextProfile, STEPS.CORE_SUBJECTS);
        await botSay("Perfect! Next, rate your understanding of Core CS subjects below:");
      }
    }

    else if (step === STEPS.STRENGTHS_WEAKNESSES) {
      if (subStep === 0) {
        if (cleanText.toLowerCase() === 'none' || cleanText.toLowerCase() === 'skip') {
          const nextProfile = { ...profile, strengths: [] };
          setProfile(nextProfile);
          setSubStep(1);
          saveDraft(nextProfile, STEPS.STRENGTHS_WEAKNESSES, 1);
          await botSay("Enter your professional **Weaknesses** (comma separated, or select below):");
        } else {
          const validation = validateTagsInput(cleanText);
          if (!validation.isValid) {
            await botSay(`⚠️ ${validation.error} What are your professional strengths?`);
            return;
          }
          const strengths = validation.tokens;
          const nextProfile = { ...profile, strengths };
          setProfile(nextProfile);
          setSubStep(1);
          saveDraft(nextProfile, STEPS.STRENGTHS_WEAKNESSES, 1);
          await botSay("Enter your professional **Weaknesses** (comma separated, or select below):");
        }
      } else {
        if (cleanText.toLowerCase() === 'none' || cleanText.toLowerCase() === 'skip') {
          const nextProfile = { ...profile, weaknesses: [] };
          setProfile(nextProfile);
          setStep(STEPS.PROJECTS);
          setSubStep(0);
          saveDraft(nextProfile, STEPS.PROJECTS);
          await botSay("Excellent. Let's showcase your engineering **Projects**! Fill the form below, or click continue to skip.");
        } else {
          const validation = validateTagsInput(cleanText);
          if (!validation.isValid) {
            await botSay(`⚠️ ${validation.error} What are your professional weaknesses?`);
            return;
          }
          const weaknesses = validation.tokens;
          const nextProfile = { ...profile, weaknesses };
          setProfile(nextProfile);
          setStep(STEPS.PROJECTS);
          setSubStep(0);
          saveDraft(nextProfile, STEPS.PROJECTS);
          await botSay("Excellent. Let's showcase your engineering **Projects**! Fill the form below, or click continue to skip.");
        }
      }
    }
  };

  // Role quick reply click handler
  const handleRoleSelect = async (roleObj) => {
    const roleName = roleObj.role;
    pushMessage('user', roleName);

    setTyping(true);
    try {
      // Early duplicate role check
      let userProfile = null;
      try {
        const { data } = await api.get(`/profile/${userId}`);
        userProfile = data;
      } catch {}

      const existingRole = (userProfile?.roles || []).find(
        (r) => r.role.toLowerCase() === roleName.toLowerCase()
      );

      if (existingRole) {
        setTyping(false);
        setDuplicateRole(existingRole);
        setStep('DUPLICATE_PROMPT');
        await botSay(`⚠️ You already have a candidate profile for **${roleName}**.`);
        await botSay("Would you like to overwrite it, edit your existing details, select a different role, or cancel onboarding?");
        return;
      }

      const { data } = await api.get(`/roles/${encodeURIComponent(roleName)}`);
      setSelectedRoleDef(data);
      const skills = (data.skills || []).map((s) => s.name);
      setRoleSkills(skills);
      setTyping(false);

      const nextProfile = { ...profile, role: roleName };
      setProfile(nextProfile);

      // Pre-initialize skillsRatings
      const initial = {};
      skills.forEach((sName) => {
        initial[sName] = 3;
      });
      setSkillsRatings(initial);

      await botSay(`Excellent. I will map your candidate profile against required skills for **${roleName}**.`);
      setStep(STEPS.GITHUB_STACK);
      setSubStep(0);
      saveDraft(nextProfile, STEPS.GITHUB_STACK, 0);
      await botSay("What is your **GitHub Username**? Enter it below (or type 'none' to skip):");
    } catch (_err) {
      setTyping(false);
      await botSay("Could not download skills criteria for that role. Please select another target role.");
    }
  };

  // Handle duplicate option selections
  const handleDuplicateAction = async (action) => {
    if (!duplicateRole) return;
    const roleName = duplicateRole.role;
    pushMessage('user', action);

    if (action.includes('Cancel')) {
      window.location.href = '/dashboard';
      return;
    }

    if (action.includes('Choose Another')) {
      setDuplicateRole(null);
      setStep(STEPS.ROLE);
      await botSay("Sure, let's select a different target role. Which job role are you targeting?");
      return;
    }

    setTyping(true);
    try {
      const { data } = await api.get(`/roles/${encodeURIComponent(roleName)}`);
      setSelectedRoleDef(data);
      const skills = (data.skills || []).map((s) => s.name);
      setRoleSkills(skills);

      if (action.includes('Overwrite')) {
        // Delete subdocument in database first
        await api.delete(`/profile/${userId}/${encodeURIComponent(roleName)}`);
        setIsEditingExisting(false);

        const nextProfile = { ...INITIAL_PROFILE, role: roleName };
        setProfile(nextProfile);
        setStep(STEPS.GITHUB_STACK);
        setSubStep(0);
        saveDraft(nextProfile, STEPS.GITHUB_STACK, 0);

        setTyping(false);
        await botSay(`Successfully deleted old profile and loaded fresh mapping criteria for **${roleName}**.`);
        await botSay("What is your **GitHub Username**? Enter it below (or type 'none' to skip):");
      } else if (action.includes('Edit')) {
        setIsEditingExisting(true);
        const loadedProfile = {
          ...INITIAL_PROFILE,
          ...duplicateRole,
          technicalSkills: duplicateRole.technicalSkills || [],
          tools: duplicateRole.tools || [],
          projects: duplicateRole.projects || [],
          strengths: duplicateRole.strengths || [],
          weaknesses: duplicateRole.weaknesses || [],
          dsa: { ...INITIAL_PROFILE.dsa, ...duplicateRole.dsa },
          coreSubjects: { ...INITIAL_PROFILE.coreSubjects, ...duplicateRole.coreSubjects }
        };
        setProfile(loadedProfile);
        setStep(STEPS.GITHUB_STACK);
        setSubStep(0);
        saveDraft(loadedProfile, STEPS.GITHUB_STACK, 0);

        // Preload states
        setSelectedTools(loadedProfile.tools || []);
        setSelectedStrengths(loadedProfile.strengths || []);
        setSelectedWeaknesses(loadedProfile.weaknesses || []);
        setDsaLevel(loadedProfile.dsa?.level || 'Beginner');
        setDsaRange(loadedProfile.dsa?.problemsSolvedRange || '0-25');
        
        const stack = loadedProfile.selectedStack || loadedProfile.preferredStack;
        let newRoleSkills = [];
        if (data && stack) {
          const matchedStack = data.stacks.find(
            (s) => s.stackName.toLowerCase() === stack.toLowerCase()
          );
          if (matchedStack) {
            newRoleSkills = matchedStack.skills.map((s) => s.name);
          }
        }
        if (newRoleSkills.length === 0) {
          newRoleSkills = (data.skills || []).map((s) => s.name);
        }
        setRoleSkills(newRoleSkills);

        const initial = {};
        newRoleSkills.forEach((sName) => {
          const found = loadedProfile.technicalSkills?.find((ts) => ts.skill === sName);
          initial[sName] = found ? found.level : 3;
        });
        setSkillsRatings(initial);

        setTyping(false);
        await botSay(`Loaded your existing details for **${roleName}**. Let's walk through and update them.`);
        await botSay("What is your **GitHub Username**? Enter it below (or type 'none' to skip):");
      }
      setDuplicateRole(null);
    } catch (_err) {
      setTyping(false);
      await botSay("An error occurred trying to fetch skills criteria. Please select another target role.");
    }
  };

  // Core Subject handler
  const handleCoreSubjectSubmit = async (scores) => {
    pushMessage('user', `OOP: ${scores.oop}/5 | DBMS: ${scores.dbms}/5 | OS: ${scores.os}/5 | CN: ${scores.cn}/5`);
    const nextProfile = { ...profile, coreSubjects: scores };
    setProfile(nextProfile);
    setStep(STEPS.DSA);
    saveDraft(nextProfile, STEPS.DSA);
    await botSay("Great! Now, let's configure your **DSA Profile** metrics.");
  };

  // DSA quick selects
  const handleDsaSubmit = async (dsaObj) => {
    pushMessage('user', `Level: ${dsaObj.level} | Range: ${dsaObj.problemsSolvedRange}`);
    const nextProfile = { ...profile, dsa: dsaObj };
    setProfile(nextProfile);
    setStep(STEPS.STRENGTHS_WEAKNESSES);
    setSubStep(0);
    saveDraft(nextProfile, STEPS.STRENGTHS_WEAKNESSES, 0);
    await botSay("DSA details saved. What are your professional **Strengths**? Select below:");
  };

  // Project additions / deletions
  const handleAddProject = (newProj) => {
    pushMessage('user', `Added project: ${newProj.name}`);
    const updatedProjects = [...profile.projects, newProj];
    const nextProfile = { ...profile, projects: updatedProjects };
    setProfile(nextProfile);
    saveDraft(nextProfile, STEPS.PROJECTS);
    botSay(`Successfully added **${newProj.name}**! You can add another, or proceed.`);
  };

  const handleDeleteProject = (idx) => {
    const updatedProjects = profile.projects.filter((_, i) => i !== idx);
    const nextProfile = { ...profile, projects: updatedProjects };
    setProfile(nextProfile);
    saveDraft(nextProfile, STEPS.PROJECTS);
  };

  const handleProjectsComplete = () => {
    pushMessage('user', 'Continue to Review');
    setStep(STEPS.REVIEW);
    saveDraft(profile, STEPS.REVIEW);
    botSay("Everything is ready! Please review your candidate summary card below and click save when ready.");
  };

  // Editable summary callback
  const handleUpdateField = (key, val) => {
    const nextProfile = { ...profile, [key]: val };
    setProfile(nextProfile);
    saveDraft(nextProfile, step);
  };

  // Final database save
  const handleFinalSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    setSaveError('');

    try {
      if (isEditingExisting) {
        await api.put(`/profile/${userId}/${encodeURIComponent(profile.role)}`, profile);
      } else {
        // Check duplicate role in user profile first
        const { data: currentProfile } = await api.get(`/profile/${userId}`);
        const alreadyHasRole = (currentProfile.roles || []).some(
          (r) => r.role.toLowerCase() === profile.role.toLowerCase()
        );

        if (alreadyHasRole) {
          setSaveError(`You already have a candidate profile for "${profile.role}". Please delete it from the Skills page before saving a new one.`);
          setIsSaving(false);
          return;
        }

        await api.post(`/profile/${userId}`, profile);
      }
      
      // On success, clear local draft and advance to done
      localStorage.removeItem('nv_onboarding_draft');
      setStep(STEPS.DONE);
      setIsSaving(false);
      botSay("Success! Your professional profile has been saved. You can now view your analytical scores on the dashboard.");
      
      if (onProfileSaved) {
        onProfileSaved();
      }
    } catch (e) {
      setIsSaving(false);
      setSaveError(e.response?.data?.message || 'Error occurred while saving to database. Please retry.');
    }
  };

  // Reset/Startover handler from review screen
  const handleResetFlow = () => {
    localStorage.removeItem('nv_onboarding_draft');
    setProfile(INITIAL_PROFILE);
    setMessages([]);
    setStep(STEPS.ROLE);
    setSubStep(0);
    setSkillIndex(0);
    setSaveError('');
    setDuplicateRole(null);
    setIsEditingExisting(false);
    bootRef.current = false;

    // Reset our temporary state variables
    setSkillsRatings({});
    setSelectedTools([]);
    setSelectedStrengths([]);
    setSelectedWeaknesses([]);
    setDsaLevel('Beginner');
    setDsaRange('0-25');

    // Default welcome boot again
    (async () => {
      await botSay("Welcome to NeuroVision's guided profile builder!");
      await sleep(300);
      setStep(STEPS.ROLE);
      await botSay("Which job role are you targeting?");
    })();

    // Trigger window resize to force chatbot stream reset
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  };

  // Sidebar progress step highlight mapping
  const activeSidebarIdx = SIDEBAR_STEPS.findIndex((s) => s.id === step);

  return (
    <div className="chatbot-layout">
      {/* Sidebar Progress Steps */}
      <aside className="chat-sidebar glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="chat-bot-avatar-wrap">
          <span className="chat-bot-avatar">✦</span>
          <span className="chat-bot-label">NeuroVision Onboarding</span>
        </div>
        <ol className="chat-steps" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {SIDEBAR_STEPS.map((s, idx) => {
            const isCompleted = idx < activeSidebarIdx;
            const isActive = idx === activeSidebarIdx;
            return (
              <li 
                key={s.id} 
                className={`${isCompleted ? 'active' : ''} ${isActive ? 'current' : ''}`}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  padding: '8px 12px', 
                  borderRadius: '8px', 
                  fontSize: '13px',
                  background: isActive ? 'rgba(168, 85, 247, 0.08)' : 'transparent',
                  border: isActive ? '1px solid rgba(168, 85, 247, 0.2)' : '1px solid transparent',
                  color: isActive ? '#fff' : isCompleted ? 'var(--purple-200)' : 'var(--text-secondary)',
                  opacity: isActive || isCompleted ? 1 : 0.6,
                  transition: 'all 0.2s ease'
                }}
              >
                <span className="step-idx-icon" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '20px', 
                  height: '20px', 
                  borderRadius: '50%',
                  fontSize: '11px',
                  background: isCompleted ? 'rgba(168, 85, 247, 0.15)' : isActive ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                  border: isCompleted ? '1px solid var(--accent)' : 'none',
                  color: isCompleted || isActive ? '#fff' : 'var(--text-secondary)'
                }}>
                  {isCompleted ? (
                    <Check size={11} strokeWidth={3} />
                  ) : isActive ? (
                    <Circle size={10} fill="#fff" />
                  ) : (
                    <Lock size={10} />
                  )}
                </span>
                {s.label}
              </li>
            );
          })}
        </ol>
      </aside>

      {/* Main Chat Flow Stream */}
      <main className="chat-main glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Chatbot Navigation/Control Header */}
        <div className="chat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--purple-200)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />
            {isEditingExisting ? `Editing Profile: ${profile.role}` : `Step: ${activeSidebarIdx >= 0 ? SIDEBAR_STEPS[activeSidebarIdx].label : 'Onboarding'}`}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {isEditingExisting && (
              <button
                type="button"
                className="btn-reset"
                onClick={onCancelEdit}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', border: '1px solid rgba(255, 255, 255, 0.1)', cursor: 'pointer' }}
              >
                <X size={12} /> Cancel Edit
              </button>
            )}
            {step !== STEPS.WELCOME && step !== STEPS.DONE && !isEditingExisting && (
              <button
                type="button"
                className="btn-reset"
                onClick={() => setShowResetConfirm(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer' }}
              >
                <RotateCcw size={12} /> Reset
              </button>
            )}
          </div>
        </div>

        {step === STEPS.REVIEW ? (
          <div ref={reviewContainerRef} style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
            <ReviewSummary
              profileData={profile}
              onUpdateField={handleUpdateField}
              onSave={handleFinalSave}
              onReset={handleResetFlow}
              isSaving={isSaving}
              error={saveError}
            />
          </div>
        ) : (
          <>

            <div ref={chatStreamRef} className="chat-stream" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div 
                    key={m.id} 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={`chat-row ${m.from}`}
                    style={{ marginBottom: '14px' }}
                  >
                    {m.from === 'bot' && <span className="bubble-ava">✦</span>}
                    <div className={`bubble ${m.from}`}>
                      {m.from === 'bot' ? (
                        <p
                          dangerouslySetInnerHTML={{
                            __html: m.text
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\n/g, '<br/>')
                          }}
                        />
                      ) : (
                        <p>{m.text}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {typing && (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="chat-row bot"
                  style={{ marginBottom: '14px' }}
                >
                  <span className="bubble-ava">✦</span>
                  <div className="bubble bot typing-bubble">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Unified Chat Action & Form Control Input Panel */}
            <div className="chat-input-area" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px', borderTop: '1px solid var(--glass-border)' }}>
              {/* Draft Resume Buttons */}
              {hasDraft && (
                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <button type="button" className="btn-submit" style={{ flex: 1 }} onClick={handleResume}>
                    Resume Saved Draft ✓
                  </button>
                  <button type="button" className="btn-reset" style={{ flex: 1 }} onClick={handleStartFresh}>
                    Start New Profile ↺
                  </button>
                </div>
              )}

              {/* Duplicate Role selections */}
              {!hasDraft && step === 'DUPLICATE_PROMPT' && !typing && (
                <div className="role-btn-grid" style={{ width: '100%' }}>
                  {['Overwrite Existing', 'Edit Existing', 'Choose Another Role', 'Cancel Onboarding'].map((act) => (
                    <button
                      key={act}
                      type="button"
                      className="pill-role"
                      onClick={() => handleDuplicateAction(act)}
                      style={{
                        border: act.includes('Overwrite') ? '1px solid rgba(239, 68, 68, 0.4)' : undefined,
                        color: act.includes('Overwrite') ? 'var(--error)' : undefined
                      }}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              )}

              {/* Role pills selections */}
              {!hasDraft && step === STEPS.ROLE && !typing && (
                <div className="onboarding-cards-grid">
                  {rolesList.length > 0 ? (
                    rolesList.map((r) => (
                      <button
                        key={r.role}
                        type="button"
                        className={`onboarding-card-select ${profile.role === r.role ? 'active' : ''}`}
                        onClick={() => handleRoleSelect(r)}
                      >
                        <span className="onboarding-card-title">{r.role}</span>
                        <span className="onboarding-card-subtitle">Click to target this role</span>
                      </button>
                    ))
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading target roles...</div>
                  )}
                </div>
              )}

              {/* GitHub Username manual input (Substep 0) */}
              {!hasDraft && step === STEPS.GITHUB_STACK && subStep === 0 && !typing && (
                <ChatInput
                  value={inputValue}
                  onChange={setInputValue}
                  onSubmit={handleUserSubmit}
                  placeholder="Enter GitHub username (e.g. octocat)"
                  disabled={typing}
                  quickReplies={['none']}
                  onQuickReplySelect={handleUserSubmit}
                />
              )}

              {/* Preferred Stack selector (Substep 1) */}
              {!hasDraft && step === STEPS.GITHUB_STACK && subStep === 1 && !typing && (
                <div className="chip-select-container">
                  <div className="chip-select-grid">
                    {(selectedRoleDef?.stacks && selectedRoleDef.stacks.length > 0
                      ? selectedRoleDef.stacks.map((s) => s.stackName)
                      : ['MERN Stack', 'MEAN Stack', 'Python/Django', 'Java/Spring Boot', 'PHP/Laravel', 'Ruby on Rails', 'ASP.NET Core', 'JAMstack', 'Mobile (React Native/Flutter)']
                    ).map((stack) => (
                      <button
                        key={stack}
                        type="button"
                        className="option-chip"
                        onClick={() => handleUserSubmit(stack)}
                      >
                        {stack}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button
                      type="button"
                      className="btn-reset"
                      style={{ padding: '8px 20px', fontSize: '12px' }}
                      onClick={() => handleUserSubmit('none')}
                    >
                      Skip Stack
                    </button>
                  </div>
                </div>
              )}

              {/* CGPA Slider (Academics Substep 0) */}
              {!hasDraft && step === STEPS.ACADEMICS && subStep === 0 && !typing && (
                <CgpaSelector
                  value={profile.cgpa || 7.0}
                  onChange={(val) => {
                    setProfile((prev) => ({ ...prev, cgpa: Number(val) }));
                  }}
                  onSubmit={handleUserSubmit}
                />
              )}

              {/* Internship Months Slider (Academics Substep 1) */}
              {!hasDraft && step === STEPS.ACADEMICS && subStep === 1 && !typing && (
                <InternshipTimeline
                  value={profile.internshipMonths || 0}
                  onChange={(val) => {
                    setProfile((prev) => ({ ...prev, internshipMonths: Number(val) }));
                  }}
                  onSubmit={handleUserSubmit}
                />
              )}

              {/* Skills rating sliders (Bulk rating matrix) */}
              {!hasDraft && step === STEPS.SKILLS && !typing && roleSkills.length > 0 && (
                <SkillsMatrix
                  roleSkills={roleSkills}
                  skillsRatings={skillsRatings}
                  onChangeRating={(skillName, newLvl) => {
                    setSkillsRatings((prev) => ({ ...prev, [skillName]: newLvl }));
                  }}
                  onSkipSkill={(skillName) => {
                    setRoleSkills((prev) => prev.filter((s) => s !== skillName));
                    setSkillsRatings((prev) => {
                      const copy = { ...prev };
                      delete copy[skillName];
                      return copy;
                    });
                  }}
                  onSubmit={async () => {
                    const ratedSkills = roleSkills.map((skillName) => ({
                      skill: skillName,
                      level: skillsRatings[skillName] || 3
                    }));
                    pushMessage('user', `Rated ${ratedSkills.length} skills`);
                    const nextProfile = { ...profile, technicalSkills: ratedSkills };
                    setProfile(nextProfile);
                    setStep(STEPS.TOOLS);
                    saveDraft(nextProfile, STEPS.TOOLS);
                    await botSay("Technical skills recorded! Select any Tools & Technologies you use daily:");
                  }}
                  onSkipAll={async () => {
                    pushMessage('user', 'Skipped Skill Matrix');
                    const nextProfile = { ...profile, technicalSkills: [] };
                    setProfile(nextProfile);
                    setStep(STEPS.TOOLS);
                    saveDraft(nextProfile, STEPS.TOOLS);
                    await botSay("Technical skills skipped! Select any tools you use daily:");
                  }}
                />
              )}

              {/* Tools multi-select options */}
              {!hasDraft && step === STEPS.TOOLS && !typing && (
                <div className="chip-select-container">
                  <label style={{ fontSize: '11px', color: 'var(--purple-300)', textTransform: 'uppercase' }}>Select your Daily Tools</label>
                  <div className="chip-select-grid">
                    {['Git', 'GitHub', 'VS Code', 'Postman', 'Docker', 'Kubernetes', 'AWS', 'Jira', 'Figma', 'NPM'].map((tool) => {
                      const isSelected = selectedTools.includes(tool);
                      return (
                        <button
                          key={tool}
                          type="button"
                          className={`option-chip ${isSelected ? 'active' : ''}`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTools(prev => prev.filter(t => t !== tool));
                            } else {
                              setSelectedTools(prev => [...prev, tool]);
                            }
                          }}
                        >
                          {tool} {isSelected && '✓'}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                    <button
                      type="button"
                      className="btn-reset"
                      onClick={async () => {
                        pushMessage('user', 'Skipped Tools');
                        const nextProfile = { ...profile, tools: [] };
                        setProfile(nextProfile);
                        setStep(STEPS.CORE_SUBJECTS);
                        saveDraft(nextProfile, STEPS.CORE_SUBJECTS);
                        await botSay("Perfect! Next, rate your understanding of Core CS subjects below:");
                      }}
                    >
                      Skip Tools
                    </button>
                    <button
                      type="button"
                      className="btn-submit"
                      onClick={async () => {
                        pushMessage('user', selectedTools.join(', ') || 'None');
                        const nextProfile = { ...profile, tools: selectedTools };
                        setProfile(nextProfile);
                        setStep(STEPS.CORE_SUBJECTS);
                        saveDraft(nextProfile, STEPS.CORE_SUBJECTS);
                        await botSay("Perfect! Next, rate your understanding of Core CS subjects below:");
                      }}
                    >
                      Confirm Tools →
                    </button>
                  </div>
                </div>
              )}

              {/* Core CS Subject sliders */}
              {!hasDraft && step === STEPS.CORE_SUBJECTS && !typing && (
                <CSCompetencyDials
                  values={profile.coreSubjects}
                  onSubmit={handleCoreSubjectSubmit}
                />
              )}

              {/* DSA profile card matrices */}
              {!hasDraft && step === STEPS.DSA && !typing && (
                <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', background: 'rgba(15,0,32,0.45)' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--purple-300)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
                      DSA Understanding Level
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          className={`option-chip ${dsaLevel === lvl ? 'active' : ''}`}
                          onClick={() => setDsaLevel(lvl)}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--purple-300)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
                      Problems Solved Range
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      {['0-25', '25-75', '75-150', '150+'].map((range) => (
                        <button
                          key={range}
                          type="button"
                          className={`option-chip ${dsaRange === range ? 'active' : ''}`}
                          onClick={() => setDsaRange(range)}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-submit"
                    style={{ alignSelf: 'flex-end', padding: '10px 24px', marginTop: '8px', fontSize: '13px' }}
                    onClick={() => handleDsaSubmit({ level: dsaLevel, problemsSolvedRange: dsaRange })}
                  >
                    Confirm DSA Profile →
                  </button>
                </div>
              )}

              {/* Strengths option chips */}
              {!hasDraft && step === STEPS.STRENGTHS_WEAKNESSES && subStep === 0 && !typing && (
                <div className="chip-select-container">
                  <label style={{ fontSize: '11px', color: 'var(--purple-300)', textTransform: 'uppercase' }}>Select your Core Strengths</label>
                  <div className="chip-select-grid">
                    {['Problem Solving', 'Leadership', 'Teamwork', 'Fast Learner', 'Communication', 'Consistency', 'Critical Thinking', 'Adaptability'].map((strength) => {
                      const isSelected = selectedStrengths.includes(strength);
                      return (
                        <button
                          key={strength}
                          type="button"
                          className={`option-chip ${isSelected ? 'active' : ''}`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedStrengths(prev => prev.filter(s => s !== strength));
                            } else {
                              setSelectedStrengths(prev => [...prev, strength]);
                            }
                          }}
                        >
                          {strength} {isSelected && '✓'}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                    <button
                      type="button"
                      className="btn-reset"
                      onClick={async () => {
                        pushMessage('user', 'Skipped Strengths');
                        const nextProfile = { ...profile, strengths: [] };
                        setProfile(nextProfile);
                        setSubStep(1);
                        saveDraft(nextProfile, STEPS.STRENGTHS_WEAKNESSES, 1);
                        await botSay("Strengths skipped! Select your professional Weaknesses below:");
                      }}
                    >
                      Skip Strengths
                    </button>
                    <button
                      type="button"
                      className="btn-submit"
                      onClick={async () => {
                        pushMessage('user', selectedStrengths.join(', ') || 'None');
                        const nextProfile = { ...profile, strengths: selectedStrengths };
                        setProfile(nextProfile);
                        setSubStep(1);
                        saveDraft(nextProfile, STEPS.STRENGTHS_WEAKNESSES, 1);
                        await botSay("Strengths recorded! Select your professional **Weaknesses**:");
                      }}
                    >
                      Confirm Strengths →
                    </button>
                  </div>
                </div>
              )}

              {/* Weaknesses option chips */}
              {!hasDraft && step === STEPS.STRENGTHS_WEAKNESSES && subStep === 1 && !typing && (
                <div className="chip-select-container">
                  <label style={{ fontSize: '11px', color: 'var(--purple-300)', textTransform: 'uppercase' }}>Select areas for growth (Weaknesses)</label>
                  <div className="chip-select-grid">
                    {['Overthinking', 'Public Speaking', 'Time Management', 'Perfectionism', 'Delegation', 'Workaholism', 'Self-Criticism'].map((weakness) => {
                      const isSelected = selectedWeaknesses.includes(weakness);
                      return (
                        <button
                          key={weakness}
                          type="button"
                          className={`option-chip ${isSelected ? 'active' : ''}`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedWeaknesses(prev => prev.filter(w => w !== weakness));
                            } else {
                              setSelectedWeaknesses(prev => [...prev, weakness]);
                            }
                          }}
                        >
                          {weakness} {isSelected && '✓'}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                    <button
                      type="button"
                      className="btn-reset"
                      onClick={async () => {
                        pushMessage('user', 'Skipped Weaknesses');
                        const nextProfile = { ...profile, weaknesses: [] };
                        setProfile(nextProfile);
                        setStep(STEPS.PROJECTS);
                        setSubStep(0);
                        saveDraft(nextProfile, STEPS.PROJECTS);
                        await botSay("Excellent. Let's showcase your engineering **Projects**! Fill the form below, or click continue to skip.");
                      }}
                    >
                      Skip Weaknesses
                    </button>
                    <button
                      type="button"
                      className="btn-submit"
                      onClick={async () => {
                        pushMessage('user', selectedWeaknesses.join(', ') || 'None');
                        const nextProfile = { ...profile, weaknesses: selectedWeaknesses };
                        setProfile(nextProfile);
                        setStep(STEPS.PROJECTS);
                        setSubStep(0);
                        saveDraft(nextProfile, STEPS.PROJECTS);
                        await botSay("Excellent. Let's showcase your engineering **Projects**! Fill the form below, or click continue to skip.");
                      }}
                    >
                      Confirm Weaknesses →
                    </button>
                  </div>
                </div>
              )}

              {/* Project Form showcase */}
              {!hasDraft && step === STEPS.PROJECTS && !typing && (
                <ProjectForm
                  projects={profile.projects}
                  targetRole={profile.role}
                  onAdd={handleAddProject}
                  onDelete={handleDeleteProject}
                  onComplete={handleProjectsComplete}
                />
              )}

              {/* Completed / Redirect links */}
              {step === STEPS.DONE && (
                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <Link to="/dashboard" className="btn-submit text-center-link" style={{ flex: 1 }}>
                    Go to Dashboard
                  </Link>
                  <button type="button" className="btn-reset" style={{ flex: 1 }} onClick={handleResetFlow}>
                    Add Another Role ＋
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Reset Confirmation Overlay Modal */}
      {showResetConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div
            className="glass-card"
            style={{
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <h3 style={{ margin: 0, color: 'var(--error)' }}>Restart Onboarding?</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              This will clear your current progress, delete any local drafts, and start the onboarding flow from the beginning.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-reset"
                onClick={() => setShowResetConfirm(false)}
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                No, Keep Going
              </button>
              <button
                type="button"
                className="btn-submit"
                onClick={() => {
                  setShowResetConfirm(false);
                  handleResetFlow();
                }}
                style={{ padding: '8px 16px', fontSize: '12px', background: 'var(--error)' }}
              >
                Yes, Restart ↺
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
