export type SkillSignal = {
  name: string;
  level: number;
  verified: boolean;
  sources: string[];
};

export type CandidateBase = {
  id: string;
  name: string;
  initials: string;
  role: string;
  location: string;
  experience: number;
  availability: string;
  summary: string;
  skills: SkillSignal[];
  github: {
    username: string;
    repos: number;
    stars: number;
    commits: number;
    pullRequests: number;
    activeWeeks: number;
    languages: string[];
    tests: number;
    documentation: number;
    originality: number;
  };
  resume: {
    education: string;
    projects: number;
    certifications: number;
  };
  hackathons: {
    count: number;
    wins: number;
    innovation: number;
    project: string;
  };
  interview: {
    technical: number;
    communication: number;
    problemSolving: number;
  };
  trust: {
    identity: number;
    resumeConsistency: number;
    repoAuthenticity: number;
    duplicateRisk: number;
  };
  source: "seeded" | "live";
};

export type TalentDimensions = {
  coding: number;
  projectQuality: number;
  problemSolving: number;
  consistency: number;
  leadership: number;
  innovation: number;
  community: number;
};

export type TalentScore = {
  total: number;
  confidence: number;
  evidenceCount: number;
  dimensions: TalentDimensions;
};

export type Candidate = CandidateBase & { score: TalentScore };

export type JobMatch = {
  total: number;
  modelFit: number;
  semanticRelevance: number;
  skillCoverage: number;
  skillSimilarity: number;
  projectRelevance: number;
  experienceFit: number;
  evidenceConfidence: number;
  matchedSkills: string[];
  missingSkills: string[];
  requiredSkills: string[];
  explanation: string;
};

export type ResumeSignals = {
  skills: string[];
  experience: number;
  education: string;
  projects: number;
  textLength: number;
};

export const skillCatalog: Record<string, string[]> = {
  Python: ["python"],
  JavaScript: ["javascript", "js"],
  TypeScript: ["typescript", "ts"],
  React: ["react", "reactjs", "react.js"],
  "Next.js": ["next.js", "nextjs", "next js"],
  FastAPI: ["fastapi", "fast api"],
  Django: ["django"],
  "Node.js": ["node.js", "nodejs", "node js"],
  LangGraph: ["langgraph", "lang graph"],
  GenAI: ["genai", "generative ai", "llm", "large language model"],
  RAG: ["rag", "retrieval augmented generation"],
  PyTorch: ["pytorch", "torch"],
  TensorFlow: ["tensorflow"],
  PostgreSQL: ["postgresql", "postgres", "pgvector"],
  MongoDB: ["mongodb", "mongo"],
  Redis: ["redis"],
  AWS: ["aws", "amazon web services"],
  Azure: ["azure"],
  Docker: ["docker", "container"],
  Kubernetes: ["kubernetes", "k8s"],
  MLOps: ["mlops", "ml ops"],
  SQL: ["sql"],
  Spark: ["spark", "pyspark"],
  Flutter: ["flutter", "dart"],
  Kotlin: ["kotlin"],
  "React Native": ["react native"],
  Cybersecurity: ["cybersecurity", "security", "owasp"],
  Linux: ["linux"],
  "CI/CD": ["ci/cd", "ci cd", "github actions", "jenkins"],
  GraphQL: ["graphql"],
};

const clamp = (value: number, min = 0, max = 100) => Math.round(Math.min(max, Math.max(min, value)));
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

export function calculateTalentScore(candidate: CandidateBase): TalentScore {
  const skillAverage = average(candidate.skills.map((skill) => skill.level));
  const verifiedRatio = candidate.skills.length ? candidate.skills.filter((skill) => skill.verified).length / candidate.skills.length : 0;
  const repoScale = Math.min(candidate.github.repos / 15, 1) * 100;
  const commitScale = Math.min(candidate.github.commits / 260, 1) * 100;
  const starScale = Math.min(candidate.github.stars / 180, 1) * 100;
  const prScale = Math.min(candidate.github.pullRequests / 35, 1) * 100;
  const projectScale = Math.min((candidate.resume.projects + candidate.hackathons.count) / 8, 1) * 100;
  const activeScale = Math.min(candidate.github.activeWeeks / 42, 1) * 100;

  const dimensions: TalentDimensions = {
    coding: clamp(skillAverage * 0.42 + repoScale * 0.16 + commitScale * 0.17 + candidate.github.tests * 0.1 + candidate.github.originality * 0.15),
    projectQuality: clamp(candidate.github.documentation * 0.22 + candidate.github.tests * 0.2 + starScale * 0.12 + candidate.github.originality * 0.24 + projectScale * 0.22),
    problemSolving: clamp(skillAverage * 0.3 + candidate.interview.problemSolving * 0.45 + candidate.hackathons.innovation * 0.25),
    consistency: clamp(activeScale * 0.45 + candidate.trust.resumeConsistency * 0.35 + verifiedRatio * 100 * 0.2),
    leadership: clamp(Math.min(candidate.hackathons.wins * 35 + candidate.hackathons.count * 8, 100) * 0.55 + candidate.interview.communication * 0.25 + prScale * 0.2),
    innovation: clamp(candidate.hackathons.innovation * 0.58 + candidate.github.originality * 0.27 + projectScale * 0.15),
    community: clamp(prScale * 0.46 + starScale * 0.22 + Math.min(candidate.hackathons.count * 18, 100) * 0.18 + candidate.github.documentation * 0.14),
  };

  const total = clamp(
    dimensions.coding * 0.25 +
    dimensions.projectQuality * 0.2 +
    dimensions.problemSolving * 0.15 +
    dimensions.consistency * 0.12 +
    dimensions.leadership * 0.1 +
    dimensions.innovation * 0.1 +
    dimensions.community * 0.08,
  );
  const evidenceCount = candidate.github.repos + candidate.resume.projects + candidate.github.pullRequests + candidate.hackathons.count + candidate.skills.filter((skill) => skill.verified).length;
  const confidence = clamp(55 + Math.min(evidenceCount, 35) * 0.9 + candidate.trust.resumeConsistency * 0.1);
  return { total, confidence, evidenceCount, dimensions };
}

function skill(name: string, level: number, verified = true, sources = ["Resume claim", "GitHub repository"]): SkillSignal {
  return { name, level, verified, sources };
}

const seedCandidates: CandidateBase[] = [
  { id:"ananya",name:"Ananya Verma",initials:"AV",role:"Full-stack AI Engineer",location:"Bengaluru",experience:3,availability:"Available now",summary:"Product-minded engineer building agent workflows, document intelligence and reliable React interfaces.",skills:[skill("Python",94),skill("React",91),skill("FastAPI",92),skill("LangGraph",94),skill("TypeScript",88),skill("PostgreSQL",84)],github:{username:"ananyaverma",repos:12,stars:324,commits:248,pullRequests:31,activeWeeks:39,languages:["Python","TypeScript","JavaScript"],tests:82,documentation:91,originality:94},resume:{education:"B.Tech Computer Science",projects:5,certifications:2},hackathons:{count:3,wins:1,innovation:96,project:"JalDrishti"},interview:{technical:92,communication:88,problemSolving:93},trust:{identity:96,resumeConsistency:94,repoAuthenticity:97,duplicateRisk:3},source:"seeded"},
  { id:"rohan",name:"Rohan Mehta",initials:"RM",role:"Machine Learning Engineer",location:"Delhi",experience:4,availability:"2 weeks",summary:"ML engineer focused on applied computer vision, model evaluation and reproducible MLOps systems.",skills:[skill("Python",93),skill("PyTorch",95),skill("MLOps",89),skill("FastAPI",84),skill("Docker",88),skill("AWS",82)],github:{username:"rohanml",repos:18,stars:212,commits:310,pullRequests:42,activeWeeks:41,languages:["Python","Jupyter Notebook","Shell"],tests:88,documentation:85,originality:90},resume:{education:"M.Tech Artificial Intelligence",projects:6,certifications:3},hackathons:{count:2,wins:0,innovation:88,project:"CropSight"},interview:{technical:94,communication:82,problemSolving:92},trust:{identity:94,resumeConsistency:92,repoAuthenticity:95,duplicateRisk:2},source:"seeded"},
  { id:"meera",name:"Meera Nair",initials:"MN",role:"Frontend Engineer",location:"Pune",experience:3,availability:"Available now",summary:"Accessibility-first frontend engineer with strong design systems and measurable performance work.",skills:[skill("React",95),skill("TypeScript",93),skill("Next.js",91),skill("JavaScript",92),skill("GraphQL",82),skill("CI/CD",79)],github:{username:"meeracodes",repos:9,stars:187,commits:225,pullRequests:27,activeWeeks:38,languages:["TypeScript","JavaScript","CSS"],tests:91,documentation:88,originality:86},resume:{education:"B.E. Information Technology",projects:5,certifications:1},hackathons:{count:4,wins:1,innovation:91,project:"AccessKit"},interview:{technical:91,communication:94,problemSolving:88},trust:{identity:97,resumeConsistency:96,repoAuthenticity:94,duplicateRisk:1},source:"seeded"},
  { id:"kabir",name:"Kabir Shah",initials:"KS",role:"Backend Engineer",location:"Mumbai",experience:4,availability:"30 days",summary:"Backend engineer designing high-throughput APIs, event-driven services and observable data systems.",skills:[skill("Python",89),skill("FastAPI",91),skill("PostgreSQL",94),skill("Redis",88),skill("Docker",90),skill("AWS",86)],github:{username:"kabirbackend",repos:15,stars:116,commits:286,pullRequests:24,activeWeeks:40,languages:["Python","Go","SQL"],tests:94,documentation:82,originality:85},resume:{education:"B.Tech Software Engineering",projects:4,certifications:3},hackathons:{count:1,wins:0,innovation:80,project:"QueueWise"},interview:{technical:92,communication:83,problemSolving:91},trust:{identity:93,resumeConsistency:95,repoAuthenticity:93,duplicateRisk:4},source:"seeded"},
  { id:"ishita",name:"Ishita Rao",initials:"IR",role:"Generative AI Engineer",location:"Hyderabad",experience:2,availability:"Available now",summary:"GenAI engineer creating grounded RAG systems, evaluation pipelines and multi-agent research tools.",skills:[skill("GenAI",95),skill("RAG",94),skill("Python",91),skill("LangGraph",90),skill("PostgreSQL",80),skill("FastAPI",86)],github:{username:"ishita-ai",repos:14,stars:402,commits:208,pullRequests:35,activeWeeks:36,languages:["Python","TypeScript"],tests:76,documentation:93,originality:97},resume:{education:"B.Tech AI & Data Science",projects:7,certifications:2},hackathons:{count:5,wins:2,innovation:98,project:"CivicSahayak"},interview:{technical:91,communication:90,problemSolving:94},trust:{identity:95,resumeConsistency:91,repoAuthenticity:96,duplicateRisk:2},source:"seeded"},
  { id:"arjun",name:"Arjun Singh",initials:"AS",role:"Cloud & DevOps Engineer",location:"Gurugram",experience:5,availability:"30 days",summary:"Cloud engineer automating secure delivery, Kubernetes operations and production observability.",skills:[skill("AWS",95),skill("Kubernetes",92),skill("Docker",94),skill("CI/CD",93),skill("Linux",91),skill("Python",78)],github:{username:"arjuncloud",repos:22,stars:98,commits:336,pullRequests:47,activeWeeks:44,languages:["HCL","Shell","Python"],tests:86,documentation:89,originality:82},resume:{education:"B.E. Computer Engineering",projects:6,certifications:5},hackathons:{count:1,wins:0,innovation:78,project:"GreenDeploy"},interview:{technical:93,communication:87,problemSolving:90},trust:{identity:96,resumeConsistency:97,repoAuthenticity:92,duplicateRisk:1},source:"seeded"},
  { id:"neha",name:"Neha Kulkarni",initials:"NK",role:"Data Engineer",location:"Chennai",experience:4,availability:"2 weeks",summary:"Data engineer building governed lakehouse pipelines, streaming workloads and analytics platforms.",skills:[skill("Python",88),skill("SQL",96),skill("Spark",93),skill("AWS",84),skill("Docker",80),skill("PostgreSQL",87)],github:{username:"nehadata",repos:11,stars:74,commits:194,pullRequests:18,activeWeeks:35,languages:["Python","SQL","Scala"],tests:87,documentation:86,originality:84},resume:{education:"M.Sc. Data Science",projects:5,certifications:4},hackathons:{count:2,wins:1,innovation:85,project:"GridPulse"},interview:{technical:90,communication:86,problemSolving:91},trust:{identity:95,resumeConsistency:94,repoAuthenticity:91,duplicateRisk:3},source:"seeded"},
  { id:"vikram",name:"Vikram Das",initials:"VD",role:"Mobile Product Engineer",location:"Kolkata",experience:3,availability:"Available now",summary:"Mobile product engineer shipping offline-first health and finance applications across Android and iOS.",skills:[skill("Flutter",94),skill("Kotlin",87),skill("React Native",84),skill("TypeScript",79),skill("Node.js",78),skill("MongoDB",81)],github:{username:"vikrammobile",repos:16,stars:145,commits:271,pullRequests:22,activeWeeks:39,languages:["Dart","Kotlin","TypeScript"],tests:83,documentation:87,originality:90},resume:{education:"BCA Software Development",projects:7,certifications:2},hackathons:{count:4,wins:1,innovation:92,project:"MediReach"},interview:{technical:88,communication:91,problemSolving:87},trust:{identity:92,resumeConsistency:90,repoAuthenticity:94,duplicateRisk:4},source:"seeded"},
  { id:"sara",name:"Sara Khan",initials:"SK",role:"Security Engineer",location:"Bengaluru",experience:4,availability:"30 days",summary:"Application security engineer combining threat modeling, secure CI and developer-focused remediation.",skills:[skill("Cybersecurity",96),skill("Linux",92),skill("Python",85),skill("CI/CD",88),skill("Docker",80),skill("AWS",78)],github:{username:"sarasec",repos:13,stars:268,commits:231,pullRequests:39,activeWeeks:40,languages:["Python","Shell","Go"],tests:90,documentation:92,originality:93},resume:{education:"B.Tech Cybersecurity",projects:5,certifications:5},hackathons:{count:3,wins:1,innovation:89,project:"PhishLens"},interview:{technical:95,communication:89,problemSolving:94},trust:{identity:98,resumeConsistency:96,repoAuthenticity:97,duplicateRisk:1},source:"seeded"},
  { id:"dev",name:"Dev Patel",initials:"DP",role:"Product Engineer",location:"Ahmedabad",experience:2,availability:"Available now",summary:"Full-stack product engineer moving quickly from customer problem to tested web application.",skills:[skill("TypeScript",90),skill("React",92),skill("Next.js",89),skill("Node.js",87),skill("PostgreSQL",82),skill("AWS",74,false,["Resume claim"])],github:{username:"devbuilds",repos:20,stars:356,commits:295,pullRequests:33,activeWeeks:42,languages:["TypeScript","JavaScript","Python"],tests:79,documentation:95,originality:96},resume:{education:"B.Tech Information Technology",projects:8,certifications:1},hackathons:{count:6,wins:2,innovation:97,project:"InvoicePilot"},interview:{technical:89,communication:95,problemSolving:92},trust:{identity:94,resumeConsistency:88,repoAuthenticity:96,duplicateRisk:2},source:"seeded"},
];

export const candidates: Candidate[] = seedCandidates.map((candidate) => ({ ...candidate, score: calculateTalentScore(candidate) }));

export function parseResumeText(text: string): ResumeSignals {
  const normalized = text.toLowerCase();
  const skills = Object.entries(skillCatalog)
    .filter(([, aliases]) => aliases.some((alias) => new RegExp(`(^|[^a-z0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i").test(normalized)))
    .map(([name]) => name);
  const experienceMatches = [...normalized.matchAll(/(\d{1,2})\+?\s*(?:years?|yrs?)/g)].map((match) => Number(match[1]));
  const education = /m\.?tech|master|m\.s\.?/.test(normalized) ? "Master's degree detected" : /b\.?tech|bachelor|b\.e\.?|bca/.test(normalized) ? "Bachelor's degree detected" : "Education requires review";
  const projectMatches = normalized.match(/\b(project|built|developed|implemented|created)\b/g)?.length ?? 0;
  return { skills, experience: experienceMatches.length ? Math.max(...experienceMatches) : 0, education, projects: Math.min(Math.max(Math.round(projectMatches / 2), 1), 10), textLength: text.length };
}

export function extractRequiredSkills(description: string): string[] {
  const normalized = description.toLowerCase();
  return Object.entries(skillCatalog)
    .filter(([, aliases]) => aliases.some((alias) => new RegExp(`(^|[^a-z0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i").test(normalized)))
    .map(([name]) => name);
}

export function calculateJobMatch(candidate: Candidate, description: string): JobMatch {
  const requiredSkills = extractRequiredSkills(description);
  const candidateSkills = new Map(candidate.skills.map((item) => [item.name.toLowerCase(), item]));
  const matchedSkills = requiredSkills.filter((name) => candidateSkills.has(name.toLowerCase()));
  const missingSkills = requiredSkills.filter((name) => !candidateSkills.has(name.toLowerCase()));
  const matchedLevels = matchedSkills.map((name) => candidateSkills.get(name.toLowerCase())?.level ?? 0);
  const skillCoverageRatio = requiredSkills.length ? matchedSkills.length / requiredSkills.length : 0.72;
  const skillCoverage = clamp(skillCoverageRatio * 100);
  const skillDepth = matchedLevels.length ? average(matchedLevels) : average(candidate.skills.slice(0, 4).map((item) => item.level));
  const projectText = `${candidate.summary} ${candidate.hackathons.project} ${candidate.github.languages.join(" ")} ${candidate.skills.map((item) => item.name).join(" ")}`.toLowerCase();
  const meaningfulTokens = description.toLowerCase().split(/[^a-z0-9+#.]+/).filter((token) => token.length > 3);
  const overlap = new Set(meaningfulTokens.filter((token) => projectText.includes(token))).size;
  const tokenCoverage = meaningfulTokens.length ? (overlap / new Set(meaningfulTokens).size) * 100 : 60;
  const semanticRelevance = clamp(tokenCoverage * 0.45 + skillDepth * 0.3 + candidate.score.dimensions.projectQuality * 0.25);
  // Mirrors the MODELS branch: semantic relevance contributes 60%, explicit skill coverage 40%.
  const modelFit = clamp(semanticRelevance * 0.6 + skillCoverage * 0.4);
  const skillSimilarity = clamp(modelFit * 0.72 + skillDepth * 0.28);

  const yearsMatch = description.toLowerCase().match(/(\d{1,2})\+?\s*(?:years?|yrs?)/);
  const requiredYears = yearsMatch ? Number(yearsMatch[1]) : Math.max(1, candidate.experience - 1);
  const experienceFit = clamp((candidate.experience / requiredYears) * 88 + (candidate.experience >= requiredYears ? 10 : 0));
  const projectRelevance = clamp(58 + Math.min(overlap * 4, 28) + candidate.score.dimensions.projectQuality * 0.14);
  const evidenceConfidence = clamp(candidate.score.confidence * 0.72 + candidate.trust.resumeConsistency * 0.28);
  const total = clamp(skillSimilarity * 0.45 + projectRelevance * 0.25 + experienceFit * 0.2 + evidenceConfidence * 0.1);
  const explanation = total >= 90 ? "Exceptional fit with strong verified evidence across the role's core requirements." : total >= 80 ? "Strong fit; validate the few missing requirements during the interview." : total >= 70 ? "Promising fit with clear upskilling areas." : "Partial fit; consider adjacent roles or a focused technical screen.";
  return { total, modelFit, semanticRelevance, skillCoverage, skillSimilarity, projectRelevance, experienceFit, evidenceConfidence, matchedSkills, missingSkills, requiredSkills, explanation };
}

export function mergeLiveCandidate(base: Candidate, resume: ResumeSignals | null, github: CandidateBase["github"], name?: string): Candidate {
  const detectedSkills = resume?.skills ?? [];
  const existing = new Map(base.skills.map((item) => [item.name, item]));
  for (const language of github.languages) {
    const catalogName = Object.keys(skillCatalog).find((name) => name.toLowerCase() === language.toLowerCase());
    if (!catalogName) continue;
    const previous = existing.get(catalogName);
    if (previous) {
      existing.set(catalogName, {
        ...previous,
        level: Math.max(previous.level, 76),
        verified: true,
        sources: [...new Set([...previous.sources, "GitHub language evidence"])],
      });
    } else {
      existing.set(catalogName, skill(catalogName, 76, true, ["GitHub language evidence"]));
    }
  }
  for (const detected of detectedSkills) {
    const previous = existing.get(detected);
    if (previous) existing.set(detected, { ...previous, sources: [...new Set([...previous.sources, "Resume extraction"])] });
    else existing.set(detected, skill(detected, 72, false, ["Resume extraction"]));
  }
  const updated: CandidateBase = {
    ...base,
    id: `live-${github.username}`,
    name: name || base.name,
    initials: (name || base.name).split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
    experience: resume?.experience || base.experience,
    skills: [...existing.values()],
    github,
    resume: { ...base.resume, education: resume?.education || base.resume.education, projects: resume?.projects || base.resume.projects },
    trust: {
      ...base.trust,
      resumeConsistency: resume ? clamp(55 + (detectedSkills.filter((item) => github.languages.some((language) => language.toLowerCase() === item.toLowerCase())).length / Math.max(detectedSkills.length, 1)) * 40) : base.trust.resumeConsistency,
      repoAuthenticity: github.originality,
    },
    source: "live",
  };
  return { ...updated, score: calculateTalentScore(updated) };
}

export function getAuthenticityScore(candidate: Candidate): number {
  return clamp(candidate.trust.identity * 0.28 + candidate.trust.resumeConsistency * 0.3 + candidate.trust.repoAuthenticity * 0.32 + (100 - candidate.trust.duplicateRisk) * 0.1);
}

export function searchCandidates(query: string, pool: Candidate[]): Candidate[] {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return [...pool].sort((a, b) => b.score.total - a.score.total);
  const requestedSkills = extractRequiredSkills(normalized);
  const locations = [...new Set(pool.map((candidate) => candidate.location))].filter((location) => normalized.includes(location.toLowerCase()));
  const wantsHackathon = /hackathon|winner|innovation/.test(normalized);
  const wantsOpenSource = /open.?source|github|repository|repositories/.test(normalized);
  const scoreMatch = normalized.match(/(?:score|talent)\s*(?:above|over|>|at least)?\s*(\d{2})/);
  const minimumScore = scoreMatch ? Number(scoreMatch[1]) : 0;
  return pool.filter((candidate) => {
    const skillsOkay = requestedSkills.every((required) => candidate.skills.some((item) => item.name === required));
    const locationOkay = !locations.length || locations.includes(candidate.location);
    const hackathonOkay = !wantsHackathon || candidate.hackathons.count > 0;
    const openSourceOkay = !wantsOpenSource || candidate.github.pullRequests >= 15;
    const textMatch = `${candidate.name} ${candidate.role} ${candidate.location} ${candidate.summary} ${candidate.skills.map((item) => item.name).join(" ")}`.toLowerCase().includes(normalized);
    return candidate.score.total >= minimumScore && skillsOkay && locationOkay && hackathonOkay && openSourceOkay && (requestedSkills.length || locations.length || wantsHackathon || wantsOpenSource || minimumScore ? true : textMatch);
  }).sort((a, b) => b.score.total - a.score.total);
}
