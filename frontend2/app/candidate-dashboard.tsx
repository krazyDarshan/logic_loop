"use client";

import { useMemo, useState, useEffect, type CSSProperties } from "react";
import type { AccountProfile } from "./account-types";
import { extractFileText, fetchGithubEvidence } from "./evidence-client";
import {
  calculateJobMatch,
  calculateTalentScore,
  getAuthenticityScore,
  mergeLiveCandidate,
  mergeBackendCandidate,
  parseResumeText,
  type Candidate,
  type CandidateBase,
  type JobMatch,
  type JobOpening,
  type SkillSignal,
} from "./talent-engine";

type CandidateView = "overview" | "matches" | "gaps" | "verification" | "exports";



const navItems: { id: CandidateView; label: string; eyebrow: string }[] = [
  { id:"overview",label:"My Talent Profile",eyebrow:"PROFILE" },
  { id:"matches",label:"Ranked for You",eyebrow:"JOBS" },
  { id:"gaps",label:"Skill Gaps",eyebrow:"GROW" },
  { id:"verification",label:"Verification Status",eyebrow:"TRUST" },
  { id:"exports",label:"Resume & Portfolio",eyebrow:"EXPORT" },
];

const dimensions: [keyof Candidate["score"]["dimensions"], string, number][] = [
  ["coding","Coding ability",25],
  ["projectQuality","Project quality",20],
  ["problemSolving","Problem solving",15],
  ["consistency","Consistency",12],
  ["leadership","Leadership",10],
  ["innovation","Innovation",10],
  ["community","Community",8],
];

function claimedSkill(name: string, level = 62): SkillSignal {
  return { name, level, verified:false, sources:["Candidate onboarding claim"] };
}

function skillsForRole(role: string): SkillSignal[] {
  const value = role.toLowerCase();
  if (/machine learning|data scientist|ml engineer/.test(value)) return ["Python","PyTorch","MLOps","FastAPI","Docker","AWS"].map((name)=>claimedSkill(name));
  if (/generative|genai|artificial intelligence|ai engineer/.test(value)) return ["Python","GenAI","RAG","LangGraph","FastAPI","PostgreSQL"].map((name)=>claimedSkill(name));
  if (/front.?end|ui engineer/.test(value)) return ["React","TypeScript","Next.js","JavaScript","GraphQL","CI/CD"].map((name)=>claimedSkill(name));
  if (/back.?end|api|platform/.test(value)) return ["Python","FastAPI","PostgreSQL","Redis","Docker","AWS"].map((name)=>claimedSkill(name));
  if (/devops|cloud|site reliability|sre/.test(value)) return ["AWS","Kubernetes","Docker","CI/CD","Linux","Python"].map((name)=>claimedSkill(name));
  if (/data engineer/.test(value)) return ["Python","SQL","Spark","AWS","Docker","PostgreSQL"].map((name)=>claimedSkill(name));
  return ["TypeScript","React","Next.js","Node.js","PostgreSQL","Docker"].map((name)=>claimedSkill(name));
}

function buildCandidate(profile: AccountProfile): Candidate {
  const base: CandidateBase = {
    id:`account-${profile.userId}`,
    name:profile.displayName,
    initials:profile.displayName.split(/\s+/).map((part)=>part[0]).join("").slice(0,2).toUpperCase() || "SN",
    role:profile.professionalTitle || "Technology professional",
    location:profile.location || "Location not added",
    experience:profile.experienceYears,
    availability:"Open to opportunities",
    summary:`${profile.displayName} is building an evidence-backed profile for ${profile.professionalTitle || "technology roles"}. Connect a resume and GitHub account to replace onboarding claims with verified signals.`,
    skills:skillsForRole(profile.professionalTitle),
    github:{username:profile.githubUsername,repos:0,stars:0,commits:0,pullRequests:0,activeWeeks:0,languages:[],tests:35,documentation:35,originality:35},
    resume:{education:"Not added",projects:0,certifications:0},
    hackathons:{count:0,wins:0,innovation:45,project:"No hackathon project connected"},
    interview:{technical:45,communication:50,problemSolving:45},
    trust:{identity:94,resumeConsistency:35,repoAuthenticity:35,duplicateRisk:4},
    source:"seeded",
  };
  return { ...base, score:calculateTalentScore(base) };
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  return <div className="candidate-score-ring" style={{"--candidate-score":`${score*3.6}deg`} as CSSProperties}><div><strong>{score}</strong><span>{label}</span></div></div>;
}

function MetricBar({ label, value, detail }: { label: string; value: number; detail?: string }) {
  return <div className="candidate-metric"><div><span>{label}{detail&&<small>{detail}</small>}</span><strong>{value}</strong></div><div className="candidate-bar"><i style={{width:`${value}%`}}/></div></div>;
}

function calculateEvidenceBlend(candidate: Candidate, topMatch: JobMatch) {
  const skillAverage = candidate.skills.length ? candidate.skills.reduce((sum,item)=>sum+item.level,0)/candidate.skills.length : 0;
  const education = /master|m\.tech|m\.s/i.test(candidate.resume.education) ? 90 : /bachelor|b\.tech|b\.e|bca/i.test(candidate.resume.education) ? 78 : 45;
  const experience = Math.min(100, 35 + candidate.experience * 13);
  const resume = Math.round(skillAverage*.30 + experience*.25 + education*.15 + topMatch.total*.20 + topMatch.skillCoverage*.10);
  const github = Math.round(
    candidate.score.dimensions.projectQuality*.25 + candidate.score.dimensions.consistency*.20 +
    candidate.github.documentation*.10 + candidate.github.originality*.15 + candidate.score.dimensions.community*.10 +
    topMatch.total*.15 + topMatch.skillCoverage*.05,
  );
  return { resume, github, combined:Math.round(resume*.60 + github*.40) };
}

async function downloadResume(candidate: Candidate) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  doc.setFillColor(239,246,251);doc.rect(0,0,210,45,"F");
  doc.setTextColor(30,51,66);doc.setFontSize(23);doc.text(candidate.name,16,22);
  doc.setFontSize(11);doc.setTextColor(67,89,105);doc.text(`${candidate.role} | ${candidate.location}`,16,31);
  doc.text(`${candidate.experience} years experience | github.com/${candidate.github.username || "not-connected"}`,16,38);
  let y=58;doc.setTextColor(30,51,66);doc.setFontSize(13);doc.text("Professional summary",16,y);y+=8;
  doc.setTextColor(68,83,96);doc.setFontSize(10);doc.text(doc.splitTextToSize(candidate.summary,178),16,y);y+=22;
  doc.setTextColor(30,51,66);doc.setFontSize(13);doc.text("Skills",16,y);y+=8;
  doc.setTextColor(68,83,96);doc.setFontSize(10);doc.text(doc.splitTextToSize(candidate.skills.map((skill)=>`${skill.name} (${skill.level}${skill.verified?", verified":""})`).join(" • "),178),16,y);y+=24;
  doc.setTextColor(30,51,66);doc.setFontSize(13);doc.text("Evidence",16,y);y+=8;
  doc.setTextColor(68,83,96);doc.setFontSize(10);
  [
    `Talent score: ${candidate.score.total}/100 with ${candidate.score.confidence}% confidence`,
    `GitHub: ${candidate.github.repos} original repositories, ${candidate.github.commits} commit signals, ${candidate.github.pullRequests} PR signals`,
    `Education: ${candidate.resume.education}; ${candidate.resume.projects} projects; ${candidate.resume.certifications} certifications`,
  ].forEach((line)=>{doc.text(line,16,y);y+=7});
  doc.setFontSize(8);doc.setTextColor(112,126,137);doc.text("Generated by SkillNova from candidate-provided and public evidence. Review before submission.",16,286);
  doc.save(`${candidate.name.replace(/\s+/g,"-").toLowerCase()}-skillnova-resume.pdf`);
}

function downloadPortfolio(candidate: Candidate) {
  const skillCards = candidate.skills.map((skill)=>`<li><strong>${skill.name}</strong><span>${skill.level}% ${skill.verified?"verified":"claimed"}</span></li>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${candidate.name} — Portfolio</title><style>body{font-family:Inter,Arial,sans-serif;margin:0;color:#1f3443;background:#f5f8fa}main{max-width:900px;margin:50px auto;padding:45px;background:#fff;border-radius:20px;box-shadow:0 20px 60px #20384d18}header{display:flex;justify-content:space-between;gap:30px;border-bottom:1px solid #dce6ed;padding-bottom:28px}h1{font-size:42px;margin:0 0 8px}h2{font-size:20px;margin-top:34px}p{color:#617483;line-height:1.7}.score{font-size:44px;font-weight:800;color:#3974a8}.score small{display:block;font-size:11px;color:#748694;text-transform:uppercase}ul{padding:0;display:grid;grid-template-columns:repeat(2,1fr);gap:10px;list-style:none}li{border:1px solid #dce6ed;border-radius:10px;padding:14px}li span{float:right;color:#617483}footer{margin-top:38px;color:#84939e;font-size:12px}@media(max-width:700px){main{margin:0;border-radius:0;padding:28px}header{display:block}.score{margin-top:20px}ul{grid-template-columns:1fr}}</style></head><body><main><header><div><h1>${candidate.name}</h1><p>${candidate.role} · ${candidate.location}</p></div><div class="score">${candidate.score.total}<small>Talent score</small></div></header><h2>Profile</h2><p>${candidate.summary}</p><h2>Capabilities</h2><ul>${skillCards}</ul><h2>Evidence</h2><p>${candidate.github.repos} original repositories · ${candidate.github.commits} commit signals · ${candidate.score.evidenceCount} total evidence signals · ${candidate.score.confidence}% score confidence.</p><h2>Project signal</h2><p>${candidate.hackathons.project}</p><footer>Evidence-led portfolio generated by SkillNova.</footer></main></body></html>`;
  const url = URL.createObjectURL(new Blob([html],{type:"text/html"}));
  const anchor=document.createElement("a");anchor.href=url;anchor.download=`${candidate.name.replace(/\s+/g,"-").toLowerCase()}-portfolio.html`;anchor.click();URL.revokeObjectURL(url);
}

export function CandidateDashboard({ profile }: { profile: AccountProfile }) {
  const [active,setActive]=useState<CandidateView>("overview");
  const [candidate,setCandidate]=useState<Candidate>(()=>buildCandidate(profile));
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [resumeUrl, setResumeUrl] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyStatus, setApplyStatus] = useState<string|null>(null);
  
  useEffect(() => {
    fetch(`http://localhost:8000/api/candidates/account-${profile.userId}`)
      .then(res => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(data => {
        if (data) {
          const dbCandidate = data.score ? data : { ...data, score: calculateTalentScore(data) };
          setCandidate(dbCandidate as Candidate);
        }
      })
      .catch(err => console.log("Candidate not found in DB, using local profile."));

    fetch("http://localhost:8000/api/jobs/")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setJobs(data);
        else console.error("Failed to fetch jobs:", data);
      })
      .catch(err => console.log("Failed to fetch jobs", err));
  }, [profile.userId]);

  const [resumeFile,setResumeFile]=useState<File|null>(null);
  const [githubUsername,setGithubUsername]=useState(profile.githubUsername);
  const [resumeConnected,setResumeConnected]=useState(false);
  const [githubConnected,setGithubConnected]=useState(false);
  const [syncing,setSyncing]=useState(false);
  const [message,setMessage]=useState("Add real evidence to replace onboarding claims with verified signals.");
  const rankedJobs = useMemo(() => jobs.map((job) => ({job, match: calculateJobMatch(candidate, job.description || "")})).sort((a, b) => b.match.total - a.match.total), [candidate, jobs]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const selectedJob = rankedJobs.find((item) => item.job.id === selectedJobId) || rankedJobs[0];
  const topMatch = rankedJobs[0]?.match || { total: 0, skillCoverage: 0, semanticRelevance: 0, modelFit: 0, skillSimilarity: 0, projectRelevance: 0, experienceFit: 0, evidenceConfidence: 0, matchedSkills: [], missingSkills: [], requiredSkills: [], explanation: "" };
  const blend = calculateEvidenceBlend(candidate, topMatch);
  const authenticity=getAuthenticityScore(candidate);
  const verifiedSkills=candidate.skills.filter((skill)=>skill.verified);
  const verificationProgress=Math.round(([true,resumeConnected,githubConnected,verifiedSkills.length>=3].filter(Boolean).length/4)*100);
  const gapSummary=useMemo(()=>{
    const counts=new Map<string,{count:number;bestJob:string}>();
    rankedJobs.slice(0,3).forEach(({job,match})=>match.missingSkills.forEach((skill)=>counts.set(skill,{count:(counts.get(skill)?.count||0)+1,bestJob:counts.get(skill)?.bestJob||job.title})));
    return [...counts.entries()].map(([skill,data])=>({skill,...data})).sort((a,b)=>b.count-a.count||a.skill.localeCompare(b.skill));
  },[rankedJobs]);

  const [backendScores, setBackendScores] = useState<{resume?: number, github?: number, total?: number}>({});

  const analyzeResume=async()=>{
    if(!resumeFile){setMessage("Choose a resume first.");return;}
    setSyncing(true);setMessage("Reading resume and recalculating...");
    try{
      const formData = new FormData();
      formData.append("file", resumeFile);
      const response = await fetch("http://localhost:8000/api/analyze/resume", { method: "POST", body: formData });
      let backMsg = "";
      if (response.ok) {
        const resData = await response.json();
        backMsg = `[Backend Resume Score: ${resData.analysis.resume_total_score}] `;
        setBackendScores(prev => ({...prev, resume: resData.analysis.resume_total_score}));
      }
      const resume=parseResumeText(await extractFileText(resumeFile));
      const fullData = { resume_analysis: resData.analysis };
      let merged = mergeBackendCandidate(candidate, fullData);
      merged = {...merged, role: profile.professionalTitle || merged.role, location: profile.location || merged.location};
      
      // Save to DB
      try {
        const putRes = await fetch(`http://localhost:8000/api/candidates/${merged.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(merged)
        });
        if (!putRes.ok) {
          await fetch(`http://localhost:8000/api/candidates/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(merged)
          });
        }
      } catch(e) { console.error("Failed to save to DB:", e); }

      setCandidate(merged);
      setResumeConnected(true);
      setMessage(`${backMsg}Profile recalculated from resume.`);
    }catch(error){setMessage(error instanceof Error?error.message:"Analysis failed.");}
    finally{setSyncing(false);}
  };

  const analyzeGithub=async()=>{
    if(!githubUsername.trim()){setMessage("Add a GitHub username first.");return;}
    setSyncing(true);setMessage("Reading GitHub and recalculating...");
    try{
      const response = await fetch("http://localhost:8000/api/analyze/github", { 
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: githubUsername.trim() }) 
      });
      let backMsg = "";
      if (response.ok) {
        const resData = await response.json();
        backMsg = `[Backend GitHub Score: ${resData.analysis.github_total_score}] `;
        setBackendScores(prev => ({...prev, github: resData.analysis.github_total_score}));
      }
      const fullData = { github_username: githubUsername.trim(), github_analysis: resData.analysis };
      let merged = mergeBackendCandidate(candidate, fullData);
      merged = {...merged, role: profile.professionalTitle || merged.role, location: profile.location || merged.location, source: "live"};
      
      // Save to DB
      try {
        const putRes = await fetch(`http://localhost:8000/api/candidates/${merged.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(merged)
        });
        if (!putRes.ok) {
          await fetch(`http://localhost:8000/api/candidates/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(merged)
          });
        }
      } catch(e) { console.error("Failed to save to DB:", e); }

      setCandidate(merged);
      setGithubConnected(true);
      setMessage(`${backMsg}Profile recalculated from GitHub.`);
    }catch(error){setMessage(error instanceof Error?error.message:"Analysis failed.");}
    finally{setSyncing(false);}
  };

  const analyzeTotal=async()=>{
    if(!resumeFile&&!githubUsername.trim()){setMessage("Choose a resume or add a GitHub username first.");return;}
    setSyncing(true);setMessage("Reading evidence and recalculating your profile…");
    try{
      const formData = new FormData();
      if(resumeFile) formData.append("file", resumeFile);
      if(githubUsername.trim()) formData.append("github_username", githubUsername.trim());
      const response = await fetch("http://localhost:8000/api/analyze/full", { method: "POST", body: formData });
      let backMsg = "";
      if (response.ok) {
        const resData = await response.json();
        backMsg = `[Backend Total Score: ${resData.scores_summary.combined_total_score}] Github: ${resData.scores_summary.github_total_score}, Resume: ${resData.scores_summary.resume_total_score} `;
        setBackendScores(prev => ({
          ...prev, 
          total: resData.scores_summary.combined_total_score,
          github: resData.scores_summary.github_total_score,
          resume: resData.scores_summary.resume_total_score
        }));
        
        let merged = mergeBackendCandidate(candidate, resData);
        merged = {...merged, role: profile.professionalTitle || merged.role, location: profile.location || merged.location};
        
        // Save to DB
        try {
          const putRes = await fetch(`http://localhost:8000/api/candidates/${merged.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(merged)
          });
          if (!putRes.ok) {
            // Try POST if not exists
            await fetch(`http://localhost:8000/api/candidates/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(merged)
            });
          }
        } catch(e) { console.error("Failed to save to DB:", e); }

        setCandidate(merged);
        if(resumeFile) setResumeConnected(true);
        if(githubUsername.trim()) setGithubConnected(true);
        setMessage(`${backMsg}Profile recalculated from evidence and saved to database.`);
      } else {
        throw new Error("Analysis request failed.");
      }
    }catch(error){setMessage(error instanceof Error?error.message:"Analysis failed.");}
    finally{setSyncing(false);}
  };

  const [backendMatch, setBackendMatch] = useState<{score: number, matched: string[], missing: string[]} | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const runBackendMatch = async () => {
    if(!resumeFile){ alert("Please upload a resume first to run backend matching."); return; }
    setMatchLoading(true);
    try {
      const text = await extractFileText(resumeFile);
      const response = await fetch("http://localhost:8000/api/matchmaker/evaluate-text", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv_text: text, jd_text: selectedJob.job.description })
      });
      if (!response.ok) throw new Error("Match failed");
      const resData = await response.json();
      setBackendMatch({
        score: resData.match_percentage,
        matched: resData.matched_skills,
        missing: resData.missing_skills
      });
    } catch(e) {
      alert("Backend match failed");
    } finally {
      setMatchLoading(false);
    }
  };

  const initials=profile.displayName.split(/\s+/).map((part)=>part[0]).join("").slice(0,2).toUpperCase();
  return <main className="candidate-app-shell">
    <aside className="candidate-sidebar">
      <div className="candidate-brand"><span>✦</span><div><strong>SkillNova</strong><small>Candidate intelligence</small></div></div>
      <div className="candidate-profile-mini"><span>{initials}</span><div><strong>{profile.displayName}</strong><small>{profile.professionalTitle}</small></div></div>
      <nav aria-label="Candidate workspace">{navItems.map((item)=><button key={item.id} className={active===item.id?"active":""} onClick={()=>{setActive(item.id);window.scrollTo({top:0,behavior:"smooth"})}}><small>{item.eyebrow}</small><span>{item.label}</span></button>)}</nav>
      <div className="candidate-sidebar-foot"><div><span>Profile strength</span><strong>{verificationProgress}%</strong></div><div className="candidate-bar"><i style={{width:`${verificationProgress}%`}}/></div><a href="/signout-with-chatgpt?return_to=/">Sign out</a></div>
    </aside>
    <section className="candidate-main">
      <header className="candidate-topbar"><div><p>{navItems.find((item)=>item.id===active)?.eyebrow}</p><h1>{navItems.find((item)=>item.id===active)?.label}</h1></div><div className="candidate-top-actions"><span><i/>AI scoring live</span><button onClick={()=>setActive("verification")}>{initials}</button></div></header>

      {active==="overview"&&<div className="candidate-page">
        <section className="candidate-hero"><div className="candidate-hero-copy"><span className="candidate-eyebrow">YOUR VERIFIED TALENT IDENTITY</span><h2>See what your evidence says about you.</h2><p>Your score is recalculated from resume signals, public GitHub work, project quality, consistency and verification—not from profile keywords alone.</p><div className="candidate-hero-actions"><button className="candidate-primary" onClick={()=>setActive("matches")}>Explore {rankedJobs.length} job matches</button><button className="candidate-secondary" onClick={()=>setActive("exports")}>Export profile</button></div></div><div className="candidate-score-panel"><ScoreRing score={candidate.score.total} label="Talent score"/><div><span>{candidate.score.confidence}% confidence</span><span>{candidate.score.evidenceCount} evidence signals</span><span>{authenticity}/100 authenticity</span></div></div></section>
        <section className="candidate-stat-row">{[[`${rankedJobs.length ? rankedJobs[0].match.total : 0}%`,"Best job match"],[verifiedSkills.length,"Verified skills"],[gapSummary.length,"Priority skill gaps"],[verificationProgress+"%","Profile verified"]].map(([value,label])=><article key={String(label)}><strong>{value}</strong><span>{label}</span></article>)}</section>
        <section className="candidate-card" style={{padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px'}}>
          <div><p className="candidate-kicker">LIVE EVIDENCE</p><h3>Recalculate with your resume and GitHub</h3><p>Files are parsed in your browser. GitHub analysis uses public repositories and contribution events.</p></div>
          <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
            <label className="field-group" style={{flex: 1}}><span>Resume PDF</span><div className="input-shell"><input type="file" accept=".pdf,.txt" onChange={(event)=>setResumeFile(event.target.files?.[0]||null)}/></div><small>{resumeFile?.name||"No file selected"}</small></label>
            <label className="field-group" style={{flex: 1}}><span>GitHub username</span><div className="input-shell"><input value={githubUsername} onChange={(event)=>setGithubUsername(event.target.value)} placeholder="your-username" style={{width: '100%'}}/></div></label>
          </div>
          <div style={{display: 'flex', gap: '15px', width: '100%'}}>
            <button className="candidate-primary" style={{flex: 1}} onClick={analyzeGithub} disabled={syncing||!githubUsername.trim()}>
              {syncing?"Calculating...":"Analyze GitHub"}
            </button>
            <button className="candidate-primary" style={{flex: 1}} onClick={analyzeResume} disabled={syncing||!resumeFile}>
              {syncing?"Calculating...":"Analyze Resume"}
            </button>
            <button className="candidate-primary" style={{flex: 1}} onClick={analyzeTotal} disabled={syncing||(!resumeFile&&!githubUsername.trim())}>
              {syncing?"Calculating...":"Calculate Total Score"}
            </button>
          </div>
          <div className={`candidate-evidence-message ${/failed|not found|limit/i.test(message)?"error":""}`}>{message}</div>
          
          {(backendScores.resume !== undefined || backendScores.github !== undefined || backendScores.total !== undefined) && (
            <div style={{display: 'flex', gap: '30px', marginTop: '10px', justifyContent: 'center', padding: '15px'}}>
              {backendScores.resume !== undefined && (
                <ScoreRing score={backendScores.resume} label="Resume Score" />
              )}
              {backendScores.github !== undefined && (
                <ScoreRing score={backendScores.github} label="GitHub Score" />
              )}
              {backendScores.total !== undefined && (
                <ScoreRing score={backendScores.total} label="Total Score" />
              )}
            </div>
          )}
        </section>
        <div className="candidate-two-column"><section className="candidate-card"><div className="candidate-section-head"><div><p className="candidate-kicker">TALENT PROFILE</p><h3>Seven explainable dimensions</h3></div><span>Formula v1.1</span></div>{dimensions.map(([key,label,weight])=><MetricBar key={key} label={label} value={candidate.score.dimensions[key]} detail={`${weight}% weight`}/>)}<div className="candidate-formula">Total = Coding×.25 + Projects×.20 + Problem solving×.15 + Consistency×.12 + Leadership×.10 + Innovation×.10 + Community×.08</div></section><section className="candidate-card"><div className="candidate-section-head"><div><p className="candidate-kicker">EVIDENCE BLEND</p><h3>Resume + GitHub intelligence</h3></div><strong className="candidate-big-number">{blend.combined}</strong></div><div className="candidate-blend"><article><span>Resume analysis</span><strong>{blend.resume}</strong><small>60% of evidence blend</small></article><article><span>GitHub analysis</span><strong>{blend.github}</strong><small>40% of evidence blend</small></article></div><div className="candidate-formula">Branch2 method: Combined evidence = Resume score×.60 + GitHub score×.40</div><div className="candidate-section-head candidate-job-head"><div><p className="candidate-kicker">TOP OPPORTUNITIES</p><h3>Ranked for your evidence</h3></div><button onClick={()=>setActive("matches")}>View all</button></div>{rankedJobs.slice(0,3).map(({job,match},index)=><button className="candidate-job-compact" key={job.id} onClick={()=>{setSelectedJobId(job.id);setActive("matches")}}><span>{index+1}</span><div><strong>{job.title}</strong><small>{job.company} · {job.location}</small></div><b>{match.total}%<small>match</small></b></button>)}</section></div>
      </div>}

      {active==="matches"&&<div className="candidate-page"><section className="candidate-page-lead"><div><span className="candidate-eyebrow">EXPLAINABLE JOB MATCHING</span><h2>Opportunities ranked for your real capabilities.</h2><p>The MODELS method contributes 60% semantic relevance and 40% explicit skill coverage inside every fit calculation.</p></div>{rankedJobs.length > 0 && <ScoreRing score={rankedJobs[0].match.total} label="Best match"/>}</section><div className="candidate-match-layout"><section className="candidate-card candidate-job-list"><div className="candidate-section-head"><div><p className="candidate-kicker">RANKED FOR YOU</p><h3>{rankedJobs.length} active roles</h3></div></div>{rankedJobs.map(({job,match},index)=><button key={job.id} className={selectedJob?.job.id===job.id?"active":""} onClick={()=>{setSelectedJobId(job.id);setBackendMatch(null);}}><span className="candidate-rank">{String(index+1).padStart(2,"0")}</span><div><strong>{job.title}</strong><small>{job.company} · {job.location} · {job.mode}</small><p>{match.matchedSkills.slice(0,4).join(" · ")||"Adjacent opportunity"}</p></div><b>{match.total}<small>% fit</small></b></button>)}</section><section className="candidate-card candidate-match-detail">
        {selectedJob ? (
          <>
            <div className="candidate-match-title"><div><span>{selectedJob.job.company}</span><h3>{selectedJob.job.title}</h3><p>{selectedJob.job.location} · {selectedJob.job.mode} · {selectedJob.job.salary}</p></div>
        <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
          <ScoreRing score={selectedJob.match.total} label="Local Match"/>
          {backendMatch && <ScoreRing score={backendMatch.score} label="Backend ML Match"/>}
        </div>
        </div><p className="candidate-match-copy">{selectedJob.match.explanation}</p><div className="candidate-model-split"><article><span>Semantic relevance</span><strong>{selectedJob.match.semanticRelevance}%</strong><small>60% model weight</small></article><article><span>Skill coverage</span><strong>{selectedJob.match.skillCoverage}%</strong><small>40% model weight</small></article></div>{[["Hybrid model fit",selectedJob.match.modelFit],["Project relevance",selectedJob.match.projectRelevance],["Experience fit",selectedJob.match.experienceFit],["Evidence confidence",selectedJob.match.evidenceConfidence]].map(([label,value])=><MetricBar key={String(label)} label={String(label)} value={Number(value)}/>)}<div className="candidate-skill-columns"><div><h4>Matched skills</h4>{(backendMatch?backendMatch.matched:selectedJob.match.matchedSkills).map((skill)=><span className="candidate-skill good" key={skill}>{skill}</span>)}</div><div><h4>Missing skills</h4>{(backendMatch?backendMatch.missing:selectedJob.match.missingSkills).length?(backendMatch?backendMatch.missing:selectedJob.match.missingSkills).map((skill)=><span className="candidate-skill gap" key={skill}>{skill}</span>):<span className="candidate-skill good">No core gaps</span>}</div></div>
        <button className="candidate-primary full" onClick={runBackendMatch} disabled={matchLoading} style={{marginBottom: "10px"}}>
          {matchLoading ? "Calculating..." : "Calculate ML Match (Backend)"}
        </button>
        <button className="candidate-secondary full" onClick={() => setApplyModalOpen(true)}>Apply for Role</button>
          </>
        ) : (
          <div style={{textAlign: 'center', color: '#64748b', padding: '40px'}}>No jobs available. Please ask a recruiter to create some!</div>
        )}
      </section></div></div>}

      {applyModalOpen && selectedJob && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{background: 'white', padding: '30px', borderRadius: '12px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'}}>
            <h3 style={{marginTop: 0}}>Apply to {selectedJob?.job.title}</h3>
            <p style={{fontSize: '14px', color: '#64748b', marginBottom: '20px'}}>Provide your links below to submit your application.</p>
            
            <label style={{display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 600}}>Resume Link (Google Drive, Dropbox, etc)</label>
            <input type="text" style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '15px'}} placeholder="https://..." value={resumeUrl} onChange={e => setResumeUrl(e.target.value)} />
            
            <label style={{display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 600}}>GitHub Profile / Repository Link</label>
            <input type="text" style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '20px'}} placeholder="https://github.com/..." value={githubLink} onChange={e => setGithubLink(e.target.value)} />
            
            {applyStatus && <p style={{color: applyStatus.includes('success') ? 'green' : 'red', fontSize: '14px', marginBottom: '15px'}}>{applyStatus}</p>}
            
            <div style={{display: 'flex', gap: '10px'}}>
              <button className="candidate-secondary" style={{flex: 1}} onClick={() => setApplyModalOpen(false)}>Cancel</button>
              <button className="candidate-primary" style={{flex: 1}} disabled={applyLoading} onClick={async () => {
                setApplyLoading(true); setApplyStatus(null);
                try {
                  const res = await fetch(`http://localhost:8000/api/jobs/${selectedJob.job.id}/apply`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      job_id: selectedJob.job.id,
                      candidate_id: candidate.id,
                      resume_url: resumeUrl,
                      github_link: githubLink,
                      match_score: backendMatch?.score || selectedJob.match.total
                    })
                  });
                  if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.detail || "Application failed");
                  }
                  setApplyStatus("Successfully applied!");
                  setTimeout(() => setApplyModalOpen(false), 1500);
                } catch(e: any) {
                  setApplyStatus(e.message);
                } finally {
                  setApplyLoading(false);
                }
              }}>{applyLoading ? 'Applying...' : 'Submit Application'}</button>
            </div>
          </div>
        </div>
      )}

      {active==="gaps"&&<div className="candidate-page"><section className="candidate-page-lead"><div><span className="candidate-eyebrow">PERSONALIZED CAREER GUIDANCE</span><h2>Close the gaps that unlock your best matches.</h2><p>Priorities come from missing requirements across your top three ranked opportunities—not from a generic learning list.</p></div><div className="candidate-readiness"><span>Market readiness</span><strong>{Math.round(rankedJobs.slice(0,3).reduce((sum,item)=>sum+item.match.total,0)/3)}%</strong><small>Top three average</small></div></section><div className="candidate-gap-grid"><section className="candidate-card"><div className="candidate-section-head"><div><p className="candidate-kicker">PRIORITY GAPS</p><h3>Your highest-impact next skills</h3></div><span>{gapSummary.length} detected</span></div>{gapSummary.length?gapSummary.map((gap,index)=><article className="candidate-gap-row" key={gap.skill}><span>{index+1}</span><div><strong>{gap.skill}</strong><p>Missing from {gap.count} of your top 3 matches · most useful for {gap.bestJob}</p><div className="candidate-bar"><i style={{width:`${Math.min(100,45+gap.count*18)}%`}}/></div></div><b>{gap.count===3?"Critical":gap.count===2?"High":"Useful"}</b></article>):<div className="candidate-empty">No core skill gaps across your top opportunities.</div>}</section><section className="candidate-card"><div className="candidate-section-head"><div><p className="candidate-kicker">90-DAY ROADMAP</p><h3>Recommended next actions</h3></div></div>{gapSummary.slice(0,3).map((gap,index)=><article className="candidate-roadmap" key={gap.skill}><span>{index===0?"Days 1–30":index===1?"Days 31–60":"Days 61–90"}</span><h4>{index===0?`Build foundations in ${gap.skill}`:index===1?`Ship a ${gap.skill} proof project`:`Verify ${gap.skill} in an assessment`}</h4><p>{index===0?"Complete one focused course and document the concepts you can apply.":index===1?"Create a tested repository with a clear README and measurable outcome.":"Take a role-specific interview and add the verified result to your profile."}</p><button>{index===2?"Start verification":"View learning plan"}</button></article>)}</section></div></div>}

      {active==="verification"&&<div className="candidate-page"><section className="candidate-page-lead"><div><span className="candidate-eyebrow">TRUSTED CANDIDATE IDENTITY</span><h2>Know what is verified and what still needs proof.</h2><p>Each status is linked to a specific evidence source so recruiters can distinguish claims from validated capabilities.</p></div><ScoreRing score={verificationProgress} label="Verified"/></section><section className="candidate-verification-grid">{[
        ["Identity","Verified","Hosted sign-in identity is linked to this profile.",true],
        ["Resume",resumeConnected?"Analyzed":"Action needed",resumeConnected?`${candidate.resume.projects} project signals and ${candidate.skills.length} normalized skills.`:"Upload your resume from My Talent Profile.",resumeConnected],
        ["GitHub",githubConnected?"Connected":"Action needed",githubConnected?`${candidate.github.repos} original repositories and ${candidate.github.commits} commit signals.`:"Connect your public GitHub username.",githubConnected],
        ["Skill verification",verifiedSkills.length>=3?"Evidence-backed":"In progress",`${verifiedSkills.length} of ${candidate.skills.length} skills have supporting repository evidence.`,verifiedSkills.length>=3],
      ].map(([title,status,copy,done])=><article className="candidate-card" key={String(title)}><div className={`candidate-verification-icon ${done?"done":"pending"}`}>{done?"✓":"!"}</div><span className={done?"candidate-status done":"candidate-status pending"}>{status}</span><h3>{title}</h3><p>{copy}</p></article>)}</section><section className="candidate-card"><div className="candidate-section-head"><div><p className="candidate-kicker">SKILL EVIDENCE</p><h3>Capability verification report</h3></div><span>{verifiedSkills.length}/{candidate.skills.length} verified</span></div><div className="candidate-skill-table"><div><span>Skill</span><span>Level</span><span>Sources</span><span>Status</span></div>{candidate.skills.map((skill)=><div key={skill.name}><strong>{skill.name}</strong><span>{skill.level}/100</span><span>{skill.sources.join(" · ")}</span><b className={skill.verified?"verified":"claimed"}>{skill.verified?"Verified":"Claimed"}</b></div>)}</div></section></div>}

      {active==="exports"&&<div className="candidate-page"><section className="candidate-page-lead"><div><span className="candidate-eyebrow">RESUME & PORTFOLIO BUILDER</span><h2>Turn your verified profile into recruiter-ready proof.</h2><p>Exports use the same evidence currently shown in your profile. Recalculate before downloading to include the latest resume and GitHub signals.</p></div><div className="candidate-export-actions"><button className="candidate-primary" onClick={()=>downloadResume(candidate)}>Download resume PDF</button><button className="candidate-secondary" onClick={()=>downloadPortfolio(candidate)}>Export portfolio HTML</button></div></section><div className="candidate-export-grid"><section className="candidate-resume-preview"><header><div><span>{candidate.initials}</span><div><h2>{candidate.name}</h2><p>{candidate.role} · {candidate.location}</p></div></div><strong>{candidate.score.total}<small>Talent score</small></strong></header><article><h3>Professional profile</h3><p>{candidate.summary}</p><h3>Evidence-backed skills</h3><div>{candidate.skills.map((skill)=><span key={skill.name}>{skill.name} <b>{skill.level}</b></span>)}</div><h3>Technical evidence</h3><ul><li>{candidate.github.repos} original GitHub repositories</li><li>{candidate.github.commits} recent commit signals</li><li>{candidate.score.confidence}% scoring confidence</li><li>{authenticity}/100 authenticity score</li></ul></article><footer>Generated by SkillNova · Evidence over keywords</footer></section><section className="candidate-card candidate-export-checklist"><div className="candidate-section-head"><div><p className="candidate-kicker">EXPORT READINESS</p><h3>Before you share</h3></div></div>{[["Identity details",true],["Professional title",Boolean(profile.professionalTitle)],["Resume evidence",resumeConnected],["GitHub evidence",githubConnected],["Three verified skills",verifiedSkills.length>=3]].map(([label,done])=><div key={String(label)}><span className={done?"done":"pending"}>{done?"✓":"!"}</span><strong>{label}</strong><small>{done?"Ready":"Complete this to improve recruiter confidence"}</small></div>)}<div className="candidate-formula">Exports never include protected traits or hidden scoring inputs.</div></section></div></div>}
      <footer className="candidate-footer"><span><strong>SkillNova</strong> · Proof over paperwork.</span><span>Decision support only · Human review required</span></footer>
    </section>
  </main>;
}
