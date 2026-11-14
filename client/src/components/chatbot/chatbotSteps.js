export const LEVEL_LABELS = ['', 'Beginner', 'Developing', 'Competent', 'Advanced', 'Expert'];

export const STEPS = {
  WELCOME: 0,
  ROLE: 1,
  GITHUB_STACK: 2,
  ACADEMICS: 3,
  SKILLS: 4,
  TOOLS: 5,
  CORE_SUBJECTS: 6,
  DSA: 7,
  STRENGTHS_WEAKNESSES: 8,
  PROJECTS: 9,
  REVIEW: 10,
  DONE: 11
};

export const STEP_CONFIGS = [
  {
    id: STEPS.WELCOME,
    title: 'Welcome',
    messages: [
      "Welcome to NeuroVision's guided profile builder! Let's build your professional candidate profile.",
      "I will walk you through a quick, interactive session to map your skills, projects, and target role.",
      "If you have a draft session, we can resume it, or start fresh."
    ]
  },
  {
    id: STEPS.ROLE,
    title: 'Target Role',
    messages: ["Which job role are you targeting? Select from the options below:"]
  },
  {
    id: STEPS.GITHUB_STACK,
    title: 'GitHub & Stack',
    messages: [
      "Excellent. Let's record your tech preferences.",
      "What is your **GitHub Username**? Enter it below (or type 'none' to skip):"
    ]
  },
  {
    id: STEPS.ACADEMICS,
    title: 'Academics',
    messages: [
      "Got it. Now let's capture your academic baseline.",
      "Please enter your **CGPA** (between 1 and 10) and your **Internship Experience** in months."
    ]
  },
  {
    id: STEPS.SKILLS,
    title: 'Skills Matrix',
    messages: [
      "Let's map your core technical skills.",
      "Rate your proficiency for each required skill from 1 (Beginner) to 5 (Expert)."
    ]
  },
  {
    id: STEPS.TOOLS,
    title: 'Tools & Tech',
    messages: [
      "What developer tools and technologies do you use daily?",
      "Enter them as comma-separated values (e.g., Git, VS Code, Postman, Docker)."
    ]
  },
  {
    id: STEPS.CORE_SUBJECTS,
    title: 'Core Subjects',
    messages: [
      "Rate your understanding (1 to 5) of the following core CS academic subjects:",
      "OOP, DBMS, OS, and CN."
    ]
  },
  {
    id: STEPS.DSA,
    title: 'DSA Profile',
    messages: [
      "Now, tell me about your Data Structures & Algorithms proficiency level and total problems solved range."
    ]
  },
  {
    id: STEPS.STRENGTHS_WEAKNESSES,
    title: 'Strengths & Weaknesses',
    messages: [
      "Help me understand your professional soft/technical strengths and areas for growth.",
      "Enter comma-separated values (e.g., Problem Solving, Teamwork).",
      "**Strengths examples**: *Problem Solving, Teamwork, Consistency, Communication, Fast Learner*.",
      "**Weaknesses examples**: *Public Speaking, Overthinking, Time Management, Perfectionism*."
    ]
  },
  {
    id: STEPS.PROJECTS,
    title: 'Projects',
    messages: [
      "Showcase your practical engineering experience.",
      "You can add one or more projects with detail tags and features checklist, or skip to finish."
    ]
  },
  {
    id: STEPS.REVIEW,
    title: 'Review Summary',
    messages: [
      "We've collected all the details! Please review your structured profile card below.",
      "You can click to edit any fields directly. Confirm when you are ready to finalize!"
    ]
  },
  {
    id: STEPS.DONE,
    title: 'Complete',
    messages: ["Congratulations! Your professional target profile has been saved successfully."]
  }
];

export const INITIAL_PROFILE = {
  role: '',
  selectedStack: '',
  preferredStack: '',
  cgpa: 7.0,
  internshipMonths: 0,
  technicalSkills: [],
  tools: [],
  dsa: {
    level: 'Beginner',
    problemsSolvedRange: '0-25'
  },
  coreSubjects: {
    oop: 3,
    dbms: 3,
    os: 3,
    cn: 3
  },
  projects: [],
  strengths: [],
  weaknesses: [],
  githubUsername: ''
};

export function validateField(field, value) {
  switch (field) {
    case 'cgpa': {
      const v = Number(value);
      if (Number.isNaN(v) || v < 1 || v > 10) {
        return 'CGPA must be a decimal between 1.0 and 10.0';
      }
      return null;
    }
    case 'internshipMonths': {
      const v = parseInt(String(value).trim(), 10);
      if (Number.isNaN(v) || v < 0) {
        return 'Internship months must be 0 or a positive integer';
      }
      return null;
    }
    case 'role': {
      if (!value || !value.trim()) {
        return 'Please select a valid role';
      }
      return null;
    }
    default:
      return null;
  }
}

export function validateTagsInput(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'Please enter at least one tag.' };
  }

  const rawTokens = trimmed.split(',').map(t => t.trim()).filter(Boolean);
  if (rawTokens.length === 0) {
    return { isValid: false, error: 'Please enter at least one tag.' };
  }

  const cleanTokens = [];
  const duplicates = new Set();

  for (let token of rawTokens) {
    if (token.length < 2) {
      return { isValid: false, error: `"${token}" is too short (minimum 2 characters).` };
    }
    if (token.length > 30) {
      return { isValid: false, error: `"${token}" is too long (maximum 30 characters).` };
    }
    if (/(.)\1{4,}/i.test(token)) {
      return { isValid: false, error: `"${token}" contains repeated character spam.` };
    }

    const lowercase = token.toLowerCase();
    // Check key smashes (e.g. asdfghjk, qwertyui, etc.)
    if (/^[asdfghjklzxcvbnmqwertyuiop]+$/.test(lowercase) && lowercase.length >= 8) {
      // If it doesn't contain at least one vowel/y, it's likely a key smash
      if (!/[aeiouy]/.test(lowercase)) {
        return { isValid: false, error: `"${token}" looks like gibberish.` };
      }
    }

    // Capitalize each word nicely
    const normalized = token
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    if (!duplicates.has(normalized)) {
      duplicates.add(normalized);
      cleanTokens.push(normalized);
    }
  }

  return { isValid: true, tokens: cleanTokens };
}
