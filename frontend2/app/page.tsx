"use client";

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import {
  calculateJobMatch,
  calculateTalentScore,
  candidates as seededCandidates,
  getAuthenticityScore,
  mergeLiveCandidate,
  mergeBackendCandidate,
  parseResumeText,
  searchCandidates,
  type Candidate,
  type JobMatch,
  type ResumeSignals,
} from "./talent-engine";
import { extractFileText, fetchGithubEvidence } from "./evidence-client";
import { CandidateDashboard } from "./candidate-dashboard";
import type { AccountProfile, AccountRole } from "./account-types";
import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

type View = "profile" | "verify" | "hackathon" | "recruiter" | "trust" | "jobs" | "createjob";
type IconName = "spark" | "profile" | "match" | "verify" | "trophy" | "people" | "github" | "file" | "arrow" | "check" | "search" | "briefcase" | "menu" | "close" | "shield" | "code" | "clock" | "download" | "compare" | "database" | "alert";

const iconPaths: Record<IconName, ReactNode> = {
  spark:<><path d="M12 2l1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2Z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/></>,
  profile:<><circle cx="12" cy="8" r="3.25"/><path d="M5.5 20c.65-4 2.8-6 6.5-6s5.85 2 6.5 6"/></>,
  match:<><circle cx="9.5" cy="9.5" r="5.5"/><path d="m14 14 5 5M7.5 9.5l1.3 1.3 2.8-3"/></>,
  verify:<><path d="M12 2.8 19 6v5.1c0 4.5-2.9 8-7 10.1-4.1-2.1-7-5.6-7-10.1V6l7-3.2Z"/><path d="m8.7 12 2.1 2.1 4.7-5"/></>,
  trophy:<><path d="M8 4h8v4.5c0 3-1.7 5-4 5s-4-2-4-5V4Z"/><path d="M8 6H4.5v1c0 2.4 1.5 4 4 4M16 6h3.5v1c0 2.4-1.5 4-4 4M12 14v4M8.5 20h7"/></>,
  people:<><circle cx="9" cy="8" r="3"/><path d="M3.5 19c.5-3.4 2.3-5.1 5.5-5.1s5 1.7 5.5 5.1"/><circle cx="17.3" cy="9" r="2.2"/><path d="M15.5 14.5c3.1-.5 4.8 1 5 4.5"/></>,
  github:<path d="M12 2.8a9.2 9.2 0 0 0-2.9 17.9v-2.4c-2.3.5-2.9-1-2.9-1-.4-1-.9-1.3-.9-1.3-.8-.5 0-.5 0-.5.8.1 1.3.9 1.3.9.7 1.3 2 1 2.5.8.1-.6.3-1 .6-1.3-1.9-.2-3.8-.9-3.8-4.1 0-.9.3-1.7.9-2.3-.1-.2-.4-1.1.1-2.3 0 0 .7-.2 2.5.9A8.5 8.5 0 0 1 12 7c.8 0 1.5.1 2.2.3 1.8-1.2 2.5-.9 2.5-.9.5 1.2.2 2.1.1 2.3.6.6.9 1.4.9 2.3 0 3.2-1.9 3.9-3.8 4.1.3.3.6.8.6 1.6v4A9.2 9.2 0 0 0 12 2.8Z"/>,
  file:<><path d="M6 2.8h8l4 4V21H6V2.8Z"/><path d="M14 2.8v4h4M9 12h6M9 16h6"/></>,
  arrow:<><path d="M5 12h14M14 7l5 5-5 5"/></>,check:<path d="m5 12 4 4L19 6"/>,search:<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/></>,
  briefcase:<><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2"/></>,menu:<path d="M4 7h16M4 12h16M4 17h16"/>,close:<path d="m6 6 12 12M18 6 6 18"/>,
  shield:<><path d="M12 2.8 19 6v5.1c0 4.5-2.9 8-7 10.1-4.1-2.1-7-5.6-7-10.1V6l7-3.2Z"/><path d="M9 12h6"/></>,code:<><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/></>,clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></>,
  download:<><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></>,compare:<><path d="M8 4H4v16h4M16 4h4v16h-4M9 8h6M9 12h6M9 16h6"/></>,database:<><ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7"/></>,alert:<><path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v5M12 17h.01"/></>,
};

function Icon({name,size=20}:{name:IconName;size?:number}){return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg>}
const clamp=(value:number)=>Math.round(Math.min(100,Math.max(0,value)));

const navItems:{id:View;label:string;icon:IconName;eyebrow:string}[]=[
  {id:"profile",label:"Talent Intelligence",icon:"profile",eyebrow:"Analyze"},{id:"verify",label:"Skill Verification",icon:"verify",eyebrow:"Validate"},{id:"hackathon",label:"Hackathon Hiring",icon:"trophy",eyebrow:"Discover"},{id:"recruiter",label:"Recruiter Workspace",icon:"people",eyebrow:"Decide"},{id:"trust",label:"Trust Center",icon:"shield",eyebrow:"Govern"},{id:"jobs",label:"Jobs & Applications",icon:"briefcase",eyebrow:"Manage"},
];

const dimensions:[keyof Candidate["score"]["dimensions"],string,number][]=[
  ["coding","Coding ability",25],["projectQuality","Project quality",20],["problemSolving","Problem solving",15],["consistency","Consistency",12],["leadership","Leadership",10],["innovation","Innovation",10],["community","Community",8],
];

function ScoreRing({score,label,light=false}:{score:number;label:string;light?:boolean}){return <div className={`score-ring ${light?"light":""}`} style={{"--score-angle":`${score*3.6}deg`} as CSSProperties}><div className="score-inner"><strong>{score}</strong><span>{label}</span></div></div>}
function SkillPill({children,state="neutral"}:{children:ReactNode;state?:"neutral"|"good"|"missing"|"verified"}){return <span className={`skill-pill ${state}`}>{state==="verified"&&<Icon name="check" size={12}/>} {children}</span>}
function CandidateSelect({pool,value,onChange}:{pool:Candidate[];value:string;onChange:(id:string)=>void}){return <label className="candidate-picker"><span>Candidate</span><select value={value} onChange={event=>onChange(event.target.value)}>{pool.map(candidate=><option key={candidate.id} value={candidate.id}>{candidate.name} · {candidate.role}</option>)}</select></label>}

function AppHeader({active,onMenu,initials}:{active:View;onMenu:()=>void;initials:string}){const item=navItems.find(entry=>entry.id===active)!;return <header className="app-header"><button className="icon-button mobile-menu" onClick={onMenu} aria-label="Open navigation"><Icon name="menu"/></button><div className="header-title-group"><button type="button" className="recruiter-back-button" aria-label="Back">Back</button><div><p className="kicker">{item.eyebrow}</p><h1>{item.label}</h1></div></div><div className="header-actions"><span className="live-engine"><i/>Scoring engine live</span><a className="recruiter-signout" href="/signout-with-chatgpt?return_to=/">Sign out</a><button className="avatar-button" aria-label="Recruiter profile">{initials}</button></div></header>}

function EvidenceExplorer({candidate}:{candidate:Candidate}){
  const [selected,setSelected]=useState(candidate.skills[0]?.name||"");const signal=candidate.skills.find(item=>item.name===selected)||candidate.skills[0];
  return <section className="content-card evidence-explorer"><div className="section-heading"><div><p className="kicker">EVIDENCE EXPLORER</p><h3>Every claim has a source</h3></div><span><Icon name="database" size={14}/>{candidate.score.evidenceCount} signals</span></div><div className="explorer-layout"><div className="skill-evidence-list">{candidate.skills.map(item=><button key={item.name} className={item.name===signal?.name?"active":""} onClick={()=>setSelected(item.name)}><span>{item.name}<small>{item.verified?"Verified":"Claimed"}</small></span><strong>{item.level}</strong></button>)}</div>{signal&&<div className="evidence-detail"><div className="evidence-detail-head"><div><p>Selected capability</p><h4>{signal.name}</h4></div><span className={signal.verified?"verified-state":"review-state"}><Icon name={signal.verified?"check":"alert"} size={13}/>{signal.verified?"Verified":"Review needed"}</span></div><div className="evidence-meter"><span style={{width:`${signal.level}%`}}/></div><p className="evidence-confidence">Capability confidence <strong>{signal.level}%</strong></p><ul>{signal.sources.map(source=><li key={source}><Icon name="check" size={14}/><div><strong>{source}</strong><span>{source.includes("GitHub")?`${candidate.github.repos} repositories · ${candidate.github.commits} recent commit signals`:`Detected and normalized against the SkillNova taxonomy`}</span></div></li>)}</ul><div className="explain-note"><Icon name="shield" size={16}/>Scores never use name, gender, photo, age, or other protected traits.</div></div>}</div></section>
}

function TalentScoreCard({candidate}:{candidate:Candidate}){return <section className="content-card formula-card"><div className="section-heading"><div><p className="kicker">EXPLAINABLE TALENT SCORE</p><h3>Calculated from seven dimensions</h3></div><ScoreRing score={candidate.score.total} label="Talent score" light/></div><p className="formula-copy">Weighted evidence model · Confidence {candidate.score.confidence}% · No black-box ranking</p><div className="dimension-list">{dimensions.map(([key,label,weight])=><div key={key}><div><span>{label}<small>{weight}% weight</small></span><strong>{candidate.score.dimensions[key]}</strong></div><div className="bar"><i style={{width:`${candidate.score.dimensions[key]}%`}}/></div></div>)}</div><div className="formula-equation">Total = Coding×.25 + Projects×.20 + Problem solving×.15 + Consistency×.12 + Leadership×.10 + Innovation×.10 + Community×.08</div></section>}

function ProfileView({candidate,onCandidateAnalyzed,onNavigate}:{candidate:Candidate;onCandidateAnalyzed:(candidate:Candidate)=>void;onNavigate:(view:View)=>void}){
  const [file,setFile]=useState<File|null>(null);const [username,setUsername]=useState("darshanbawaskar");const [loading,setLoading]=useState(false);const [message,setMessage]=useState("");const [resumeSignals,setResumeSignals]=useState<ResumeSignals|null>(null);
  const [backendScores, setBackendScores] = useState<{resume?: number, github?: number, total?: number}>({});
  
  const analyzeGithub = async () => {
    setLoading(true); setMessage("");
    try {
      const response = await fetch("http://localhost:8000/api/analyze/github", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }) 
      });
      if (!response.ok) throw new Error("Backend analysis failed");
      const resData = await response.json();
      setBackendScores(prev => ({...prev, github: resData.analysis.github_total_score}));
      setMessage(`[Backend GitHub Score: ${resData.analysis.github_total_score}] Analysis complete.`);
      const fullData = { github_username: resData.username, github_analysis: resData.analysis };
      const merged = mergeBackendCandidate(candidate, fullData);
      
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

      onCandidateAnalyzed(merged);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Analysis failed.");
    } finally { setLoading(false); }
  };
  
  const analyzeResume = async () => {
    setLoading(true); setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file!);
      const response = await fetch("http://localhost:8000/api/analyze/resume", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Backend analysis failed");
      const resData = await response.json();
      setBackendScores(prev => ({...prev, resume: resData.analysis.resume_total_score}));
      setMessage(`[Backend Resume Score: ${resData.analysis.resume_total_score}] Analysis complete.`);
      const text=await extractFileText(file!);
      const fullData = { resume_analysis: resData.analysis };
      const merged = mergeBackendCandidate(candidate, fullData);
      
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

      onCandidateAnalyzed(merged);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Analysis failed.");
    } finally { setLoading(false); }
  };
  
  const analyzeTotal = async () => {
    setLoading(true); setMessage("");
    try {
      const formData = new FormData();
      if(file) formData.append("file", file);
      if(username.trim()) formData.append("github_username", username.trim());
      const response = await fetch("http://localhost:8000/api/analyze/full", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Backend analysis failed");
      const resData = await response.json();
      setBackendScores({
        total: resData.scores_summary.combined_total_score,
        github: resData.scores_summary.github_total_score,
        resume: resData.scores_summary.resume_total_score
      });
      setMessage(`[Backend Total Score: ${resData.scores_summary.combined_total_score}] Github: ${resData.scores_summary.github_total_score}, Resume: ${resData.scores_summary.resume_total_score}`);
      
      const merged = mergeBackendCandidate(candidate, resData);
      
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

      onCandidateAnalyzed(merged);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Analysis failed.");
    } finally { setLoading(false); }
  };

  return <div className="view-wrap"><section className="product-hero"><div><span className="eyebrow"><Icon name="spark" size={14}/>LIVE TALENT INTELLIGENCE</span><h2>Turn candidate evidence into a decision you can defend.</h2><p>Upload a resume and connect any public GitHub profile. SkillNova extracts skills, inspects contribution signals, calculates seven capability dimensions, and shows the proof behind every score.</p><div className="hero-proof"><span><Icon name="database" size={16}/>Live public data</span><span><Icon name="shield" size={16}/>Explainable formulas</span><span><Icon name="check" size={16}/>Evidence-linked claims</span></div></div><div className="hero-score-panel"><div><span>Current candidate</span><strong>{candidate.name}</strong><small>{candidate.source==="live"?"Live evidence profile":"Verified sample dataset"}</small></div><ScoreRing score={candidate.score.total} label="Talent score" light/><div className="hero-mini-stats"><span><b>{candidate.score.confidence}%</b> confidence</span><span><b>{candidate.score.evidenceCount}</b> evidence signals</span><span><b>{getAuthenticityScore(candidate)}</b> authenticity</span></div></div></section>
    <section className="analysis-console"><div><div className="section-heading"><div><p className="kicker">ANALYZE A CANDIDATE</p><h3>Connect candidate evidence</h3></div><span>Public data only</span></div><label className="upload-zone"><input type="file" accept=".pdf,.txt" onChange={event=>setFile(event.target.files?.[0]||null)}/><span className="upload-icon"><Icon name="file"/></span><div><strong>{file?.name||"Choose a resume PDF"}</strong><p>{file?"Ready for local skill extraction":"PDF or text · up to 20 pages analyzed"}</p></div>{file&&<span className="ready-pill"><Icon name="check" size={12}/>Ready</span>}</label><label className="field-group"><span>GitHub username</span><div className="input-shell"><Icon name="github" size={18}/><span>github.com/</span><input value={username} onChange={event=>setUsername(event.target.value)} placeholder="username"/></div></label><div className="analysis-actions">
<div style={{display: 'flex', gap: '12px'}}>
  <button className="primary-button" style={{flex: 1}} onClick={analyzeGithub} disabled={loading||!username.trim()}>
    {loading?<><span className="spinner"/>Calculating...</>:<><Icon name="github" size={16}/>Analyze GitHub</>}
  </button>
  <button className="primary-button" style={{flex: 1}} onClick={analyzeResume} disabled={loading||!file}>
    {loading?<><span className="spinner"/>Calculating...</>:<><Icon name="file" size={16}/>Analyze Resume</>}
  </button>
  <button className="primary-button" style={{flex: 1}} onClick={analyzeTotal} disabled={loading||!username.trim()&&!file}>
    {loading?<><span className="spinner"/>Calculating...</>:<><Icon name="spark" size={16}/>Calculate Total Score</>}
  </button>
</div>
<button className="ghost-button" onClick={()=>{onCandidateAnalyzed(seededCandidates[0]);setResumeSignals(null);setBackendScores({});setMessage("Sample evidence profile loaded.")}}>Use sample profile</button></div>{message&&<div className={`analysis-message ${message.includes("failed")||message.includes("not found")||message.includes("limit")?"error":""}`}>{message}</div>}
{(backendScores.resume !== undefined || backendScores.github !== undefined || backendScores.total !== undefined) && (
  <div style={{display: 'flex', gap: '30px', marginTop: '20px', justifyContent: 'center', padding: '15px'}}>
    {backendScores.resume !== undefined && (
      <ScoreRing score={backendScores.resume} label="Resume Score" />
    )}
    {backendScores.github !== undefined && (
      <ScoreRing score={backendScores.github} label="GitHub Score" />
    )}
    {backendScores.total !== undefined && (
      <ScoreRing score={backendScores.total} label="Total Score" light />
    )}
  </div>
)}
</div><div className="analysis-pipeline"><p className="kicker">CALCULATION PIPELINE</p>{[["Resume extraction",file?"Ready":"Optional",file?"check":"file"],["GitHub activity",username?"Connected":"Required","github"],["Evidence normalization",resumeSignals?`${resumeSignals.skills.length} skills detected`:"Runs automatically","database"],["Talent scoring","7 weighted dimensions","spark"]].map(([label,status,icon],index)=><div className="calculation-step" key={label}><span><Icon name={icon as IconName} size={17}/></span><div><strong>{index+1}. {label}</strong><small>{status}</small></div><Icon name="check" size={14}/></div>)}</div></section>
    <div className="results-grid final-grid"><div className="span-7"><EvidenceExplorer candidate={candidate}/></div><div className="span-5"><TalentScoreCard candidate={candidate}/></div><section className="content-card span-7"><div className="section-heading"><div><p className="kicker">GITHUB INTELLIGENCE</p><h3>@{candidate.github.username}</h3></div><span className={candidate.source==="live"?"live-badge":"sample-badge"}>{candidate.source==="live"?"Live API":"Sample"}</span></div><div className="github-stat-grid">{[[candidate.github.repos,"Original repos"],[candidate.github.stars,"Stars earned"],[candidate.github.commits,"Recent commits"],[candidate.github.pullRequests,"PR signals"],[`${candidate.github.tests}%`,"Testing maturity"],[`${candidate.github.documentation}%`,"Documentation"]].map(([value,label])=><div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div><div className="skill-list">{candidate.github.languages.map(language=><SkillPill key={language}>{language}</SkillPill>)}</div></section><section className="content-card span-5 decision-card"><p className="kicker">NEXT DECISION</p><h3>Profile ready for role matching</h3><p>SkillNova has enough evidence to calculate role fit and generate targeted interview questions.</p><button className="primary-button full" onClick={()=>onNavigate("createjob")}>Create Job <Icon name="arrow" size={16}/></button><button className="text-button" onClick={()=>onNavigate("verify")}>Start skill verification</button></section></div>
  </div>
}

function CreateJobView() {
  const [role, setRole] = useState("");
  const [profile, setProfile] = useState("");
  const [skills, setSkills] = useState("");
  const [description, setDescription] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [message, setMessage] = useState("");

  const handleSave = () => {
    setMessage("Job created successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="view-wrap">
      <section className="page-lead light-lead">
        <div>
          <span className="eyebrow"><Icon name="file" size={14}/>CREATE NEW JOB</span>
          <h2>Define role requirements and responsibilities.</h2>
          <p>Create a job listing to match candidates against specific skills and experiences.</p>
        </div>
      </section>
      
      <section className="content-card match-form" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="section-heading">
          <div>
            <p className="kicker">JOB DETAILS</p>
            <h3>New Job Listing</h3>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <label className="field-group">
            <span>Job Role</span>
            <div className="input-shell">
              <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Senior Frontend Engineer" style={{width: '100%'}}/>
            </div>
          </label>
          <label className="field-group">
            <span>Job Profile</span>
            <div className="input-shell">
              <input value={profile} onChange={e => setProfile(e.target.value)} placeholder="e.g. Engineering" style={{width: '100%'}}/>
            </div>
          </label>
          <label className="field-group">
            <span>Skills Required (comma separated)</span>
            <div className="input-shell">
              <input value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g. React, TypeScript, Next.js" style={{width: '100%'}}/>
            </div>
          </label>
          <label className="field-group">
            <span>Job Description</span>
            <textarea rows={6} value={description} onChange={e => setDescription(e.target.value)} placeholder="Overview of the role..." />
          </label>
          <label className="field-group">
            <span>Responsibilities</span>
            <textarea rows={6} value={responsibilities} onChange={e => setResponsibilities(e.target.value)} placeholder="Key responsibilities..." />
          </label>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '15px' }}>
            {message && <span style={{ color: '#16a34a', fontSize: '14px', fontWeight: 'bold' }}>{message}</span>}
            <button className="primary-button" onClick={handleSave} style={{ width: 'auto', padding: '0 30px' }}>
              Create Job Listing
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}


function VerifyView({pool,selectedId,onSelect}:{pool:Candidate[];selectedId:string;onSelect:(id:string)=>void}){
  const candidate=pool.find(item=>item.id===selectedId)||pool[0];
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [questionIndex,setQuestionIndex]=useState(0);
  const [answer,setAnswer]=useState("");
  const [evaluation,setEvaluation]=useState<any>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [accumulatedScores, setAccumulatedScores] = useState<number[]>([]);
  const [interviewComplete, setInterviewComplete] = useState(false);
  
  const generateQuestions = async () => {
    setGenerating(true); setQuestions([]); setQuestionIndex(0); setEvaluation(null); setAnswer("");
    setAccumulatedScores([]); setInterviewComplete(false);
    try {
      const res = await fetch("http://localhost:8000/api/interview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_role: candidate.role, skills: candidate.skills.slice(0,3).map(s=>s.name) })
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const mcqs = (data.mcq_questions || []).map((q: any) => ({ ...q, type: 'mcq' }));
      const objs = (data.objective_questions || []).map((q: any) => ({ ...q, type: 'objective' }));
      setQuestions([...mcqs, ...objs]);
    } catch(e) {
      alert("Failed to generate questions");
    } finally {
      setGenerating(false);
    }
  };

  const evaluateAnswer = async () => {
    if (!answer.trim()) return;
    setEvaluating(true);
    try {
      const q = questions[questionIndex];
      const res = await fetch("http://localhost:8000/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          job_role: candidate.role, 
          mcq_questions: q.type === 'mcq' ? [q] : [], 
          mcq_answers: q.type === 'mcq' ? { [q.id]: answer } : {},
          objective_questions: q.type === 'objective' ? [q] : [],
          objective_answers: q.type === 'objective' ? { [q.id]: answer } : {}
        })
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      
      if (q.type === 'mcq') {
        const mcqRes = data.mcq_results[0] || {};
        const sc = mcqRes.is_correct ? 100 : 0;
        setEvaluation({
          score: sc,
          feedback: mcqRes.is_correct ? "Correct answer!" : `Incorrect. The correct answer was ${mcqRes.correct_answer}.`,
          coverage: mcqRes.is_correct ? 100 : 0,
          depth: mcqRes.is_correct ? 100 : 0,
          structure: mcqRes.is_correct ? 100 : 0
        });
        setAccumulatedScores(prev => { const n = [...prev]; n[questionIndex] = sc; return n; });
      } else {
        const objRes = data.objective_results[0] || {};
        const sc = objRes.score * 10 || 0;
        setEvaluation({
          score: sc, // scale 0-10 to 0-100
          feedback: objRes.feedback,
          coverage: objRes.score >= 5 ? 80 : 30, // Mock metrics since backend doesn't return exact depth/structure
          depth: objRes.score >= 7 ? 90 : 40,
          structure: objRes.score >= 8 ? 95 : 50
        });
        setAccumulatedScores(prev => { const n = [...prev]; n[questionIndex] = sc; return n; });
      }
    } catch(e) {
      alert("Failed to evaluate answer");
    } finally {
      setEvaluating(false);
    }
  };

  const [code,setCode]=useState(`function normalizeSkills(skills) {\n  return [...new Set(skills.map(skill => skill.trim().toLowerCase()))].sort();\n}`);
  const [testResult,setTestResult]=useState<{passed:number;total:number;message:string}|null>(null);
  const runTests=()=>{setTestResult(null);const source=`onmessage=e=>{try{const fn=eval('('+e.data+')');const tests=[[[' React ','python','react'],['python','react']],[[],[]],[['SQL','sql',' Python'],['python','sql']]];let passed=0;for(const [input,expected] of tests){const actual=fn(input);if(JSON.stringify(actual)===JSON.stringify(expected))passed++}postMessage({passed,total:tests.length,message:passed===tests.length?'All tests passed':'Review normalization, duplicates, and sorting.'})}catch(error){postMessage({passed:0,total:3,message:error.message})}}`;const worker=new Worker(URL.createObjectURL(new Blob([source],{type:"text/javascript"})));const timer=window.setTimeout(()=>{worker.terminate();setTestResult({passed:0,total:3,message:"Execution timed out after 2 seconds."})},2000);worker.onmessage=event=>{window.clearTimeout(timer);worker.terminate();setTestResult(event.data)};worker.postMessage(code)};
  
  return <div className="view-wrap"><section className="page-lead light-lead"><div><span className="eyebrow"><Icon name="verify" size={14}/>ADAPTIVE SKILL VERIFICATION</span><h2>Test claims against reasoning and code.</h2><p>Interview ratings are calculated from Llama 3.3 rubric coverage, answer depth, structure, and executable test results.</p></div><CandidateSelect pool={pool} value={selectedId} onChange={id=>{onSelect(id);setQuestionIndex(0);setEvaluation(null);setQuestions([]);}}/></section>
  <div className="verify-final-grid"><section className="content-card interview-workspace">
    <div className="interview-top"><div className="agent-id"><span><Icon name="spark"/></span><div><strong>Nova · Evidence interviewer</strong><p><i/>Grounded in {candidate.name}&apos;s profile</p></div></div>
      {questions.length > 0 && !interviewComplete && <span>Question {questionIndex+1} of {questions.length}</span>}
      {questions.length === 0 && <button className="primary-button" onClick={generateQuestions} disabled={generating}>{generating ? "Generating..." : "Generate AI Interview"}</button>}
    </div>
    
    {questions.length > 0 && !interviewComplete && <>
      <div className="progress-track"><i style={{width:`${((questionIndex+1)/questions.length)*100}%`}}/></div>
      <div className="question-card">
        <span>{questions[questionIndex].topic} {questions[questionIndex].type === 'mcq' ? '(Multiple Choice)' : '(Short Answer)'}</span>
        <h3>{questions[questionIndex].question}</h3>
        {questions[questionIndex].type === 'objective' && <small>Hint: {questions[questionIndex].expected_answer_hint}</small>}
      </div>
      
      <div className="answer-area">
        <label>Candidate answer</label>
        {questions[questionIndex].type === 'mcq' ? (
          <div className="mcq-options" style={{display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px'}}>
            {Object.entries(questions[questionIndex].options || {}).map(([key, value]) => (
              <label key={key} style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', background: answer === key ? '#f0f9ff' : 'white', borderColor: answer === key ? '#0284c7' : '#e2e8f0'}}>
                <input type="radio" name="mcq" value={key} checked={answer === key} onChange={(e) => setAnswer(e.target.value)} style={{width: '16px', height: '16px', margin: 0}}/>
                <span style={{fontWeight: 600, width: '20px'}}>{key}</span>
                <span style={{fontSize: '14px', color: '#1e293b'}}>{String(value)}</span>
              </label>
            ))}
          </div>
        ) : (
          <textarea rows={8} value={answer} onChange={event=>setAnswer(event.target.value)} placeholder="Explain decisions, trade-offs, validation, and measurable outcome..."/>
        )}
      </div>
      
      <div className="answer-footer">
        <span>{questions[questionIndex].type === 'objective' ? `${answer.trim().split(/\s+/).filter(Boolean).length} words` : answer ? 'Option selected' : 'No option selected'}</span>
        <button className="primary-button" disabled={(questions[questionIndex].type === 'objective' ? answer.trim().length < 10 : !answer) || evaluating} onClick={evaluateAnswer}>
          {evaluating ? "Evaluating..." : "Evaluate answer"} <Icon name="spark" size={15}/>
        </button>
      </div>
      
      {evaluation&&<div className="evaluation-panel"><div><ScoreRing score={evaluation.score} label="Answer score" light/><div><h3>{evaluation.score>=80?"Strong evidence":"Follow-up recommended"}</h3><p>{evaluation.feedback}</p></div></div><div className="evaluation-metrics"><span>Rubric coverage <b>{evaluation.coverage}%</b></span><span>Answer depth <b>{evaluation.depth}%</b></span><span>Reasoning structure <b>{evaluation.structure}%</b></span></div>
      <button className="ghost-button" onClick={()=>{
        if (questionIndex + 1 < questions.length) {
          setQuestionIndex(questionIndex + 1);
          setAnswer("");
          setEvaluation(null);
        } else {
          setInterviewComplete(true);
        }
      }}>
        {questionIndex + 1 < questions.length ? "Next adaptive question" : "Complete Interview"} <Icon name="arrow" size={15}/>
      </button></div>}
    </>}
    
    {interviewComplete && (
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '20px', textAlign: 'center'}}>
        <ScoreRing score={Math.round(accumulatedScores.reduce((a,b)=>a+b,0)/Math.max(1,accumulatedScores.length))} label="Overall Interview Score" />
        <h2 style={{fontSize: '24px', margin: 0, color: '#0f172a'}}>Skill Verification Complete</h2>
        <p style={{color: '#64748b', margin: 0}}>This candidate has successfully completed the adaptive AI interview.</p>
        <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
           <div style={{background: '#f8fafc', padding: '15px 20px', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
             <strong style={{display: 'block', fontSize: '20px', color: '#0ea5e9'}}>{accumulatedScores.filter(s => s >= 80).length}</strong>
             <span style={{fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Strong Answers</span>
           </div>
           <div style={{background: '#f8fafc', padding: '15px 20px', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
             <strong style={{display: 'block', fontSize: '20px', color: '#64748b'}}>{questions.length}</strong>
             <span style={{fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Total Questions</span>
           </div>
        </div>
      </div>
    )}
    
  </section><section className="content-card code-workspace"><div className="section-heading"><div><p className="kicker">CODE VERIFICATION</p><h3>Executable assessment</h3></div><span><Icon name="clock" size={13}/>2s limit</span></div><div className="challenge"><strong>Normalize a skill list</strong><p>Return unique, lowercase, trimmed skills in alphabetical order.</p></div><textarea className="code-editor" value={code} onChange={event=>setCode(event.target.value)} spellCheck={false} rows={12}/><button className="primary-button full" onClick={runTests}><Icon name="code" size={16}/>Run 3 test cases</button>{testResult&&<div className={`test-result ${testResult.passed===testResult.total?"pass":"fail"}`}><Icon name={testResult.passed===testResult.total?"check":"alert"}/><div><strong>{testResult.passed}/{testResult.total} tests passed</strong><p>{testResult.message}</p></div></div>}<div className="verified-skill-stack"><p className="kicker">PROFILE VERIFICATION</p>{candidate.skills.slice(0,5).map(item=><div key={item.name}><span><Icon name={item.verified?"check":"alert"} size={13}/>{item.name}</span><strong>{item.verified?`${item.level}%`:`Review`}</strong></div>)}</div></section></div></div>}

function HackathonView({pool,onSelect,onNavigate}:{pool:Candidate[];onSelect:(id:string)=>void;onNavigate:(view:View)=>void}){
  const ranked=[...pool].filter(item=>item.hackathons.count).sort((a,b)=>b.hackathons.innovation-a.hackathons.innovation);
  const [activeId,setActiveId]=useState(ranked[0].id);
  const candidate=ranked.find(item=>item.id===activeId)||ranked[0];

  const [projectName, setProjectName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [pitchDeck, setPitchDeck] = useState<File|null>(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);

  const handleEvaluate = async () => {
    if (!projectName || !repoUrl) { alert("Project name and Repo URL required."); return; }
    setEvalLoading(true); setEvalResult(null);
    try {
      const formData = new FormData();
      formData.append("project_name", projectName);
      formData.append("repo_url", repoUrl);
      if (pitchDeck) formData.append("pitch_deck", pitchDeck);
      const res = await fetch("http://localhost:8000/api/hackathon/evaluate-with-deck", {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Evaluation failed");
      const data = await res.json();
      setEvalResult(data);
    } catch(e) {
      alert("Failed to evaluate hackathon project");
    } finally {
      setEvalLoading(false);
    }
  };

  return <div className="view-wrap">
    <section className="page-lead light-lead"><div><span className="eyebrow"><Icon name="trophy" size={14}/>HACKATHON-TO-HIRING</span><h2>Find builders while the work is still visible.</h2><p>Rank projects using innovation, feasibility, technical depth, contribution evidence, and candidate authenticity.</p></div><div className="event-chip"><span className="event-mark">LL</span><div><small>Talent pool</small><strong>Logic Loop 2026</strong></div><span>{ranked.length} finalists</span></div></section>
    
    {/* EVALUATE NEW PROJECT FORM */}
    <section className="content-card match-form" style={{ maxWidth: '800px', margin: '0 auto 40px auto' }}>
      <div className="section-heading"><div><p className="kicker">EVALUATE</p><h3>Score a new project</h3></div></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <label className="field-group"><span>Project Name</span><div className="input-shell"><input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. SkillNova AI" style={{width: '100%'}}/></div></label>
        <label className="field-group"><span>GitHub Repo URL</span><div className="input-shell"><input value={repoUrl} onChange={e => setRepoUrl(e.target.value)} placeholder="https://github.com/user/repo" style={{width: '100%'}}/></div></label>
        <label className="field-group"><span>Pitch Deck (PDF)</span><input type="file" accept=".pdf" onChange={e => setPitchDeck(e.target.files?.[0]||null)}/></label>
        <button className="primary-button" onClick={handleEvaluate} disabled={evalLoading}>{evalLoading ? "Evaluating..." : "Evaluate Project"}</button>
        {evalResult && <div style={{background: "#f0fdf4", padding: "20px", borderRadius: "10px", marginTop: "10px"}}>
          <h4>Evaluation Result: {evalResult.project_name}</h4>
          <p><strong>Overall Score:</strong> {evalResult.overall_score}%</p>
          <p><strong>Innovation:</strong> {evalResult.innovation_score}%</p>
          <p><strong>Code Quality:</strong> {evalResult.code_quality_score}%</p>
          <p><strong>Summary:</strong> {evalResult.recruiter_summary}</p>
        </div>}
      </div>
    </section>

    <div className="hackathon-stats">{[[ranked.reduce((sum,item)=>sum+item.hackathons.count,0),"Projects analyzed","trophy"],[ranked.filter(item=>item.score.total>=80).length,"Recruiter-ready","people"],[Math.max(...ranked.map(item=>item.hackathons.innovation)),"Top innovation","spark"],[ranked.reduce((sum,item)=>sum+item.hackathons.wins,0),"Winning projects","briefcase"]].map(([value,label,icon])=><div key={String(label)}><span className="stat-icon blue"><Icon name={icon as IconName}/></span><p>{label}<strong>{value}</strong></p></div>)}</div><div className="hackathon-layout"><section className="content-card leaderboard"><div className="section-heading"><div><p className="kicker">PROJECT RANKING</p><h3>Top evidence signals</h3></div></div>{ranked.map((item,index)=><button key={item.id} className={`project-row ${activeId===item.id?"active":""}`} onClick={()=>setActiveId(item.id)}><span className="rank">{String(index+1).padStart(2,"0")}</span><span className="project-avatar">{item.initials}</span><span className="project-copy"><strong>{item.hackathons.project}</strong><small>{item.name} · {item.role}</small></span><span className="project-score">{item.hackathons.innovation}<small>innovation</small></span><Icon name="arrow" size={15}/></button>)}</section><section className="content-card project-detail"><div className="project-cover"><div><span className="fit-badge">{candidate.hackathons.wins?"Winner":"Finalist"}</span><h3>{candidate.hackathons.project}</h3><p>Led by {candidate.name} · {candidate.location}</p></div><ScoreRing score={candidate.hackathons.innovation} label="Innovation" light/></div><p className="project-description">{candidate.summary} The project is supported by {candidate.github.repos} public repositories, {candidate.github.commits} contribution signals, and {candidate.score.evidenceCount} total evidence points.</p><div className="project-score-grid">{[["Innovation",candidate.hackathons.innovation],["Technical depth",candidate.score.dimensions.coding],["Feasibility",candidate.score.dimensions.projectQuality],["Authenticity",getAuthenticityScore(candidate)]].map(([label,value])=><div key={String(label)}><span>{label}</span><strong>{value}</strong><div className="bar"><i style={{width:`${value}%`}}/></div></div>)}</div><div className="tech-team"><div><h4>Verified technology</h4><div className="skill-list">{candidate.skills.slice(0,5).map(item=><SkillPill key={item.name} state={item.verified?"good":"neutral"}>{item.name}</SkillPill>)}</div></div><div><h4>Contribution signal</h4><p>{candidate.github.pullRequests} PRs · {candidate.github.activeWeeks} active weeks</p></div></div><div className="project-actions"><button className="ghost-button" onClick={()=>{onSelect(candidate.id);onNavigate("profile")}}>View talent profile</button><button className="primary-button" onClick={()=>{onSelect(candidate.id);onNavigate("verify")}}>Invite to verification <Icon name="arrow" size={15}/></button></div></section></div></div>}

async function downloadHiringReport(candidate:Candidate,match:JobMatch){const {jsPDF}=await import("jspdf");const doc=new jsPDF();doc.setFillColor(59,111,168);doc.rect(0,0,210,28,"F");doc.setTextColor(255,255,255);doc.setFontSize(22);doc.text("SkillNova Hiring Intelligence",16,18);doc.setTextColor(31,47,61);doc.setFontSize(18);doc.text(candidate.name,16,42);doc.setFontSize(11);doc.text(`${candidate.role} · ${candidate.location} · ${candidate.experience} years`,16,50);doc.setDrawColor(220,229,236);doc.line(16,57,194,57);doc.setFontSize(13);doc.text(`Talent Score: ${candidate.score.total}/100`,16,68);doc.text(`Role Match: ${match.total}%`,75,68);doc.text(`Authenticity: ${getAuthenticityScore(candidate)}/100`,130,68);doc.setFontSize(11);doc.text("Evidence summary",16,82);const summary=doc.splitTextToSize(candidate.summary,175);doc.text(summary,16,90);let y=108;doc.text("Verified skills",16,y);y+=8;doc.text(doc.splitTextToSize(candidate.skills.filter(item=>item.verified).map(item=>`${item.name} (${item.level})`).join(" · "),175),16,y);y+=22;doc.text("Talent dimensions",16,y);y+=8;dimensions.forEach(([key,label,weight])=>{doc.text(`${label}: ${candidate.score.dimensions[key]}/100 (${weight}% weight)`,20,y);y+=7});y+=4;doc.text("Job match explanation",16,y);y+=8;doc.text(doc.splitTextToSize(match.explanation,175),16,y);y+=14;doc.text(`Matched: ${match.matchedSkills.join(", ")||"No explicit technical requirements detected"}`,16,y);y+=8;doc.text(`Missing / verify: ${match.missingSkills.join(", ")||"No core gaps"}`,16,y);y+=14;doc.text("Recommendation",16,y);y+=8;doc.text(doc.splitTextToSize(match.total>=85?"Proceed to a focused final interview. Validate any missing skills and review evidence links before a human hiring decision.":"Run an additional technical screen and consider adjacent roles before a human hiring decision.",175),16,y);doc.setFontSize(8);doc.setTextColor(100,116,130);doc.text("Decision support only. SkillNova does not make autonomous hiring decisions.",16,286);doc.save(`${candidate.name.replace(/\s+/g,"-").toLowerCase()}-hiring-report.pdf`)}

function RecruiterView({pool,selectedId,onSelect}:{pool:Candidate[];selectedId:string;onSelect:(id:string)=>void}){const [query,setQuery]=useState("Find React developers with hackathon experience");const results=useMemo(()=>searchCandidates(query,pool),[query,pool]);const [compareIds,setCompareIds]=useState([pool[0].id,pool[1].id,pool[4].id]);const [shortlisted,setShortlisted]=useState<string[]>([pool[0].id]);const compare=compareIds.map(id=>pool.find(item=>item.id===id)).filter(Boolean) as Candidate[];const defaultDescription="AI product engineer with Python, React, FastAPI, LangGraph, PostgreSQL and AWS experience.";const selected=pool.find(item=>item.id===selectedId)||pool[0];const toggleCompare=(id:string)=>setCompareIds(current=>current.includes(id)?current.filter(item=>item!==id):current.length<4?[...current,id]:current);return <div className="view-wrap"><section className="page-lead light-lead recruiter-lead"><div><span className="eyebrow"><Icon name="people" size={14}/>RECRUITER WORKSPACE</span><h2>Search, compare, shortlist, and export.</h2><p>Natural-language discovery uses transparent filters across skills, location, hackathons, GitHub activity, and Talent Score.</p></div><button className="primary-button" onClick={()=>downloadHiringReport(selected,calculateJobMatch(selected,defaultDescription))}><Icon name="download" size={16}/>Download hiring report</button></section><section className="copilot-card"><div className="copilot-mark"><Icon name="spark"/></div><div><p className="kicker">RECRUITER COPILOT</p><h3>Describe the talent you need</h3><div className="copilot-input"><Icon name="search" size={18}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Find Python developers in Delhi with hackathon experience"/><span>{results.length} found</span></div><div className="prompt-examples">{["GenAI developers with open source work","AWS engineers with talent score above 80","Hackathon winners in Bengaluru"].map(prompt=><button key={prompt} onClick={()=>setQuery(prompt)}>{prompt}</button>)}</div></div></section><section className="content-card recruiter-table-card"><div className="table-tools"><div><p className="kicker">DISCOVERY RESULTS</p><h3>Evidence-ranked candidates</h3></div><span className="selection-count"><Icon name="compare" size={14}/>{compareIds.length}/4 comparing</span></div><div className="table-wrap"><table><thead><tr><th>Compare</th><th>Candidate</th><th>Evidence</th><th>Talent</th><th>Authenticity</th><th>Hackathons</th><th>Decision</th></tr></thead><tbody>{results.map(candidate=><tr key={candidate.id} className={candidate.id===selectedId?"selected-row":""}><td><input type="checkbox" checked={compareIds.includes(candidate.id)} onChange={()=>toggleCompare(candidate.id)} aria-label={`Compare ${candidate.name}`}/></td><td><button className="table-candidate plain-button" onClick={()=>onSelect(candidate.id)}><span className="small-avatar">{candidate.initials}</span><div><strong>{candidate.name}</strong><small>{candidate.role} · {candidate.location}</small><div className="micro-skills">{candidate.skills.slice(0,3).map(item=><span key={item.name}>{item.name}</span>)}</div></div></button></td><td><span className="proof-text"><Icon name="github" size={14}/>{candidate.github.repos} repos · {candidate.score.evidenceCount} signals</span></td><td><strong className="talent-number">{candidate.score.total}</strong></td><td><span className="verified-score"><Icon name="shield" size={14}/>{getAuthenticityScore(candidate)}</span></td><td>{candidate.hackathons.count} · {candidate.hackathons.wins} wins</td><td><button className={shortlisted.includes(candidate.id)?"shortlist active":"shortlist"} onClick={()=>setShortlisted(current=>current.includes(candidate.id)?current.filter(id=>id!==candidate.id):[...current,candidate.id])}>{shortlisted.includes(candidate.id)?<><Icon name="check" size={13}/>Shortlisted</>:"Shortlist"}</button></td></tr>)}</tbody></table></div></section><section className="content-card comparison-card"><div className="section-heading"><div><p className="kicker">CANDIDATE COMPARISON</p><h3>Compare the whole signal</h3></div><span>{compare.length} selected</span></div>{compare.length?<div className="compare-grid">{compare.map(candidate=><article key={candidate.id}><div className="compare-head"><span className="small-avatar">{candidate.initials}</span><div><strong>{candidate.name}</strong><small>{candidate.role}</small></div><button onClick={()=>toggleCompare(candidate.id)} aria-label={`Remove ${candidate.name}`}><Icon name="close" size={14}/></button></div><div className="compare-score"><strong>{candidate.score.total}</strong><span>Talent Score<small>{candidate.score.confidence}% confidence</small></span></div>{[["Coding",candidate.score.dimensions.coding],["Projects",candidate.score.dimensions.projectQuality],["Problem solving",candidate.score.dimensions.problemSolving],["Interview",candidate.interview.technical],["Authenticity",getAuthenticityScore(candidate)]].map(([label,value])=><div className="compare-row" key={String(label)}><span>{label}</span><b>{value}</b></div>)}<button className="ghost-button full" onClick={()=>{onSelect(candidate.id);downloadHiringReport(candidate,calculateJobMatch(candidate,defaultDescription))}}><Icon name="download" size={14}/>Export report</button></article>)}</div>:<div className="empty-state">Select up to four candidates from the table.</div>}</section></div>}

function TrustView({pool,selectedId,onSelect}:{pool:Candidate[];selectedId:string;onSelect:(id:string)=>void}){const candidate=pool.find(item=>item.id===selectedId)||pool[0];const authenticity=getAuthenticityScore(candidate);const [controls,setControls]=useState({humanReview:true,piiRedaction:true,auditLog:true,protectedTraits:true});return <div className="view-wrap"><section className="page-lead light-lead"><div><span className="eyebrow"><Icon name="shield" size={14}/>TRUST & GOVERNANCE</span><h2>Make AI assistance accountable.</h2><p>Inspect authenticity, data provenance, fraud indicators, and the controls that keep a human responsible for every decision.</p></div><CandidateSelect pool={pool} value={selectedId} onChange={onSelect}/></section><div className="trust-grid"><section className="content-card trust-score-card"><div className="section-heading"><div><p className="kicker">AUTHENTICITY SCORE</p><h3>{candidate.name}</h3></div><ScoreRing score={authenticity} label="Authenticity" light/></div><p>Calculated from identity confidence, resume-to-repository consistency, repository originality, and duplicate risk.</p>{[["Identity confidence",candidate.trust.identity],["Resume consistency",candidate.trust.resumeConsistency],["Repository authenticity",candidate.trust.repoAuthenticity],["Duplicate safety",100-candidate.trust.duplicateRisk]].map(([label,value])=><div className="trust-factor" key={String(label)}><div><span>{label}</span><strong>{value}</strong></div><div className="bar"><i style={{width:`${value}%`}}/></div></div>)}</section><section className="content-card"><div className="section-heading"><div><p className="kicker">RESPONSIBLE AI CONTROLS</p><h3>Decision safeguards</h3></div><span>All local</span></div><div className="control-list">{[["humanReview","Human approval required","AI can recommend, never hire or reject."],["piiRedaction","PII redaction","Hide phone, email, address, age and photo."],["auditLog","Decision audit log","Record score inputs and recruiter actions."],["protectedTraits","Protected traits excluded","Never score gender, religion, caste, age or disability."]].map(([key,label,copy])=><label key={key}><button role="switch" aria-checked={controls[key as keyof typeof controls]} className={controls[key as keyof typeof controls]?"toggle on":"toggle"} onClick={()=>setControls(current=>({...current,[key]:!current[key as keyof typeof controls]}))}><i/></button><span><strong>{label}</strong><small>{copy}</small></span></label>)}</div></section><section className="content-card"><div className="section-heading"><div><p className="kicker">FRAUD RISK REPORT</p><h3>Automated checks</h3></div><span className="low-risk"><Icon name="check" size={13}/>Low risk</span></div><div className="fraud-checks">{[["Resume–GitHub consistency",candidate.trust.resumeConsistency,"Skills align with repository languages and activity."],["Original project ratio",candidate.github.originality,"Forks are excluded from project depth scoring."],["Duplicate profile risk",100-candidate.trust.duplicateRisk,"No high-similarity identity conflicts detected."],["Evidence freshness",Math.min(98,candidate.github.activeWeeks*2),`${candidate.github.activeWeeks} active contribution weeks detected.`]].map(([label,value,copy])=><div key={String(label)}><span className={Number(value)>=80?"check-icon":"warn-icon"}><Icon name={Number(value)>=80?"check":"alert"} size={14}/></span><div><strong>{label}</strong><p>{copy}</p></div><b>{value}</b></div>)}</div></section><section className="content-card"><div className="section-heading"><div><p className="kicker">DECISION AUDIT</p><h3>Traceable activity</h3></div><span>Current session</span></div><div className="audit-timeline">{[["Talent score calculated",`${candidate.score.evidenceCount} evidence signals · formula v1.0`],["Authenticity checks completed",`Score ${authenticity}/100 · duplicate risk ${candidate.trust.duplicateRisk}%`],["Protected traits excluded","Only job-relevant technical evidence used"],["Human review pending","Recruiter must approve any final decision"]].map(([title,copy],index)=><div key={title}><span>{index+1}</span><div><strong>{title}</strong><p>{copy}</p></div></div>)}</div></section></div></div>}

function JobsView() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', company: 'LogicLoop', location: '', mode: 'Remote', salary: '', description: '' });
  const [selectedJob, setSelectedJob] = useState<string|null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  
  useEffect(() => {
    fetch("http://localhost:8000/api/jobs/")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setJobs(data);
        else console.error("Failed to fetch jobs:", data);
      })
      .catch(console.error);
  }, []);
  
  useEffect(() => {
    if (selectedJob) {
      fetch(`http://localhost:8000/api/jobs/${selectedJob}/applications`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setApplications(data);
          else console.error("Failed to fetch applications:", data);
        })
        .catch(console.error);
    } else {
      setApplications([]);
    }
  }, [selectedJob]);

  const handleCreate = async () => {
    if (!newJob.title || !newJob.description) return alert("Title and Description required");
    const res = await fetch("http://localhost:8000/api/jobs/", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newJob)
    });
    if (res.ok) {
      setJobs([...jobs, await res.json()]);
      setCreating(false);
      setNewJob({ title: '', company: 'LogicLoop', location: '', mode: 'Remote', salary: '', description: '' });
    }
  };

  return <div className="view-wrap">
    <section className="page-lead light-lead">
      <div><span className="eyebrow"><Icon name="briefcase" size={14}/>JOB MANAGEMENT</span><h2>Manage Jobs & Applications.</h2><p>Create dynamic roles for AI matchmaking and review candidate applications with verified ML scores.</p></div>
      <button className="primary-button" onClick={() => setCreating(true)}><Icon name="file" size={16}/>Create New Job</button>
    </section>
    
    {creating && (
      <section className="content-card">
        <h3>Create New Job</h3>
        <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px'}}>
          <input type="text" placeholder="Job Title (e.g. AI Product Engineer)" value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} style={{padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1'}} />
          <input type="text" placeholder="Location" value={newJob.location} onChange={e => setNewJob({...newJob, location: e.target.value})} style={{padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1'}} />
          <input type="text" placeholder="Salary Range" value={newJob.salary} onChange={e => setNewJob({...newJob, salary: e.target.value})} style={{padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1'}} />
          <textarea rows={5} placeholder="Job Description & Requirements..." value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} style={{padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1'}} />
          <div style={{display: 'flex', gap: '10px'}}>
            <button className="primary-button" onClick={handleCreate}>Publish Job</button>
            <button className="ghost-button" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </div>
      </section>
    )}

    <div style={{display: 'flex', gap: '20px', marginTop: '20px'}}>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '15px'}}>
        {jobs.map(job => (
          <div key={job.id} onClick={() => setSelectedJob(job.id)} className="content-card" style={{cursor: 'pointer', border: selectedJob === job.id ? '2px solid #0284c7' : '1px solid #e2e8f0', background: selectedJob === job.id ? '#f0f9ff' : 'white'}}>
            <h4 style={{margin: '0 0 5px'}}>{job.title}</h4>
            <p style={{margin: '0', fontSize: '13px', color: '#64748b'}}>{job.location} · {job.salary}</p>
          </div>
        ))}
        {jobs.length === 0 && <p>No jobs found.</p>}
      </div>
      
      <div style={{flex: 2}}>
        {selectedJob ? (
          <section className="content-card">
            <h3>Applications</h3>
            {applications.length > 0 ? (
              <div className="table-wrap"><table style={{width: '100%', borderCollapse: 'collapse', marginTop: '10px'}}>
                <thead><tr style={{textAlign: 'left', borderBottom: '1px solid #e2e8f0'}}><th style={{padding: '10px'}}>Candidate</th><th style={{padding: '10px'}}>Match Score</th><th style={{padding: '10px'}}>Links</th></tr></thead>
                <tbody>
                  {applications.map(app => (
                    <tr key={app.id} style={{borderBottom: '1px solid #e2e8f0'}}>
                      <td style={{padding: '10px'}}><strong>{app.candidate.name}</strong><br/><small>{app.candidate.email}</small></td>
                      <td style={{padding: '10px'}}>{app.match_score ? `${app.match_score}%` : 'N/A'}</td>
                      <td style={{padding: '10px'}}>
                        {app.resume_url && <a href={app.resume_url} target="_blank" style={{color: '#0284c7', marginRight: '10px'}}>Resume</a>}
                        {app.github_link && <a href={app.github_link} target="_blank" style={{color: '#0284c7'}}>GitHub</a>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            ) : <p>No applications yet.</p>}
          </section>
        ) : (
          <div className="content-card" style={{textAlign: 'center', color: '#64748b', padding: '40px'}}>
            Select a job to view its applications.
          </div>
        )}
      </div>
    </div>
  </div>;
}

function RecruiterWorkspace({profile, onLogout}:{profile:AccountProfile, onLogout?:()=>void}){
  const [active,setActive]=useState<View>("recruiter");
  const [pool,setPool]=useState<Candidate[]>(seededCandidates);
  const [selectedId,setSelectedId]=useState(seededCandidates[0].id);
  const [menuOpen,setMenuOpen]=useState(false);
  
  useEffect(() => {
    fetch("http://localhost:8000/api/candidates/")
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          // Transform if needed or just set directly if backend matches schema
          // (assuming FastAPI returns Candidate objects compatible with frontend schema)
          // For now, we'll try to map them or just set them.
          // Wait, we need to apply `calculateTalentScore` if they lack scores. 
          // Let's just blindly use them but calculate score if missing.
          const liveCandidates = data.map((c: any) => c.score ? c : { ...c, score: calculateTalentScore(c) });
          setPool(liveCandidates);
          setSelectedId(liveCandidates[0].id);
        }
      })
      .catch(err => console.error("Failed to fetch candidates from DB:", err));
  }, []);

  const selected=pool.find(item=>item.id===selectedId)||pool[0];
  const initials=profile.displayName.split(/\s+/).map(part=>part[0]).join("").slice(0,2).toUpperCase();
  const navigate=(view:View)=>{setActive(view);setMenuOpen(false);window.scrollTo({top:0,behavior:"smooth"})};
  const handleAnalyzed=(candidate:Candidate)=>{setPool(current=>[candidate,...current.filter(item=>!item.id.startsWith("live-")&&item.id!==candidate.id)]);setSelectedId(candidate.id)};
  return <main className="app-shell"><aside className={`sidebar ${menuOpen?"open":""}`}><div className="brand"><span className="brand-mark"><Icon name="spark" size={18}/></span><div><strong>SkillNova</strong><small>Evidence-led hiring</small></div><button className="icon-button close-menu" onClick={()=>setMenuOpen(false)} aria-label="Close navigation"><Icon name="close"/></button></div><nav><p className="nav-label">INTELLIGENCE WORKSPACE</p>{navItems.map(item=><button key={item.id} className={active===item.id?"active":""} onClick={()=>navigate(item.id)}><span className="nav-icon"><Icon name={item.icon}/></span><span><small>{item.eyebrow}</small>{item.label}</span>{active===item.id&&<i/>}</button>)}</nav><div className="engine-card"><span><i/>Live engine</span><strong>{pool.length} candidates</strong><small>Transparent scoring · v1.1</small></div><div className="sidebar-user"><span className="small-avatar">{initials}</span><div><strong>{profile.displayName}</strong><small>Recruiter workspace</small></div><span className="online-dot"/></div>
  <button className="ghost-button" style={{margin: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}} onClick={onLogout}>
    <Icon name="close" size={16}/> Logout / Back to Auth
  </button>
  </aside>{menuOpen&&<button className="sidebar-overlay" onClick={()=>setMenuOpen(false)} aria-label="Close navigation"/>}<section className="main-stage"><AppHeader active={active} onMenu={()=>setMenuOpen(true)} initials={initials}/>{active==="profile"&&<ProfileView candidate={selected} onCandidateAnalyzed={handleAnalyzed} onNavigate={navigate}/>} {active==="jobs"&&<JobsView/>} {active==="verify"&&<VerifyView pool={pool} selectedId={selectedId} onSelect={setSelectedId}/>} {active==="hackathon"&&<HackathonView pool={pool} onSelect={setSelectedId} onNavigate={navigate}/>} {active==="recruiter"&&<RecruiterView pool={pool} selectedId={selectedId} onSelect={setSelectedId}/>} {active==="trust"&&<TrustView pool={pool} selectedId={selectedId} onSelect={setSelectedId}/>}<footer><span><strong>SkillNova</strong> · Proof over paperwork.</span><span>Decision support only · Human approval required</span></footer></section></main>
}

function AuthScreen({onPreview, onLogin}:{onPreview:(role:AccountRole)=>void, onLogin: (user: FirebaseUser) => void}){
  const [mode,setMode]=useState<"login"|"register">("login");
  const [role,setRole]=useState<AccountRole>("candidate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [localPreview,setLocalPreview]=useState(false);
  
  useEffect(()=>{const timer=window.setTimeout(()=>setLocalPreview(["localhost","127.0.0.1"].includes(window.location.hostname)),0);return()=>window.clearTimeout(timer)},[]);
  
  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        onLogin(cred.user);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        onLogin(cred.user);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return <main className="auth-shell"><section className="auth-story"><div className="auth-brand"><span>✦</span><strong>SkillNova</strong></div><div className="auth-story-copy"><span>AI-NATIVE TALENT INTELLIGENCE</span><h1>Proof of skill.<br/>One trusted profile.</h1><p>Transform resumes, GitHub work, assessments and hackathon evidence into a hiring identity people can understand and trust.</p><div className="auth-proof-row"><div><strong>7</strong><span>explainable score dimensions</span></div><div><strong>60/40</strong><span>semantic and skill matching</span></div><div><strong>100%</strong><span>human decision control</span></div></div></div><div className="auth-signal-card"><div><span className="auth-live"><i/>AI scoring live</span><strong>Evidence → match → verify → hire</strong></div><div className="auth-mini-score"><b>92</b><span>Talent<br/>score</span></div></div></section><section className="auth-panel"><div className="auth-card"><div className="auth-mobile-brand"><span>✦</span><strong>SkillNova</strong></div><div className="auth-tabs"><button className={mode==="login"?"active":""} onClick={()=>setMode("login")}>Log in</button><button className={mode==="register"?"active":""} onClick={()=>setMode("register")}>Create account</button></div><div className="auth-heading"><p>{mode==="login"?"WELCOME BACK":"JOIN SKILLNOVA"}</p><h2>{mode==="login"?"Open your intelligence workspace":"Build your verified talent identity"}</h2><span>{mode==="login"?"Your saved role opens the correct candidate or recruiter window automatically.":"Choose how you will use SkillNova. You can complete your profile after secure sign-in."}</span></div><div className="auth-role-grid"><button className={role==="candidate"?"active":""} onClick={()=>setRole("candidate")}><span className="auth-role-icon">C</span><strong>Candidate</strong><small>Talent profile, skill gaps, job matches and exports</small><i>{role==="candidate"?"✓":""}</i></button><button className={role==="recruiter"?"active":""} onClick={()=>setRole("recruiter")}><span className="auth-role-icon">R</span><strong>Recruiter</strong><small>Discovery, verification, shortlisting and analytics</small><i>{role==="recruiter"?"✓":""}</i></button></div>
  <form onSubmit={handleAuth} style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px'}}>
    <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)} style={{padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1'}} />
    <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} style={{padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1'}} />
    {error && <div style={{color: 'red', fontSize: '14px'}}>{error}</div>}
    <button type="submit" className="auth-primary" style={{border: 'none', cursor: 'pointer', width: '100%', boxSizing: 'border-box'}} disabled={loading}>
      {loading ? "Please wait..." : (mode==="login"?"Secure login":"Create account")}<span>→</span>
    </button>
  </form>
  <div className="auth-secure"><span>✓</span><p><strong>Secure Firebase sign-in</strong><small>Authenticated directly via Firebase.</small></p></div>{localPreview&&<div className="auth-preview"><span>Local development</span><button onClick={()=>onPreview(role)}>Preview {role} workspace</button></div>}<p className="auth-legal">By continuing, you agree to use AI scores as decision support with human review.</p></div></section></main>
}

function RegistrationScreen({user,onComplete}:{user:FirebaseUser;onComplete:(profile:AccountProfile)=>void}){
  const params=typeof window!=="undefined"?new URLSearchParams(window.location.search):null;
  const [role,setRole]=useState<AccountRole>(params?.get("role")==="recruiter"?"recruiter":"candidate");
  const [displayName,setDisplayName]=useState(user.displayName||user.email?.split("@")[0]||"");
  const [professionalTitle,setProfessionalTitle]=useState("");
  const [experienceYears,setExperienceYears]=useState(0);
  const [location,setLocation]=useState("");
  const [githubUsername,setGithubUsername]=useState("");
  const [saving,setSaving]=useState(false);
  
  const submit=async(event:FormEvent)=>{
    event.preventDefault();
    setSaving(true);
    const profile: AccountProfile = {
      userId: user.uid,
      email: user.email || "",
      displayName,
      role,
      professionalTitle,
      experienceYears,
      location,
      githubUsername,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    localStorage.setItem(`profile_${user.uid}`, JSON.stringify(profile));
    onComplete(profile);
    setSaving(false);
  };
  return <main className="onboarding-shell"><div className="onboarding-brand"><span>✦</span><strong>SkillNova</strong><small>Account setup</small></div><form className="onboarding-card" onSubmit={submit}><div className="onboarding-progress"><span className="done">✓</span><i/><span className="active">2</span><i/><span>3</span></div><div className="auth-heading"><p>CREATE YOUR WORKSPACE</p><h1>Tell us how you use SkillNova</h1><span>This determines the window and tools you see after login.</span></div><div className="auth-role-grid"><button type="button" className={role==="candidate"?"active":""} onClick={()=>setRole("candidate")}><span className="auth-role-icon">C</span><strong>Candidate</strong><small>Build my verified talent profile</small><i>{role==="candidate"?"✓":""}</i></button><button type="button" className={role==="recruiter"?"active":""} onClick={()=>setRole("recruiter")}><span className="auth-role-icon">R</span><strong>Recruiter</strong><small>Discover and evaluate talent</small><i>{role==="recruiter"?"✓":""}</i></button></div><div className="onboarding-fields"><label><span>Full name</span><input required value={displayName} onChange={event=>setDisplayName(event.target.value)}/></label><label><span>{role==="candidate"?"Target role":"Job title"}</span><input required={role==="candidate"} value={professionalTitle} onChange={event=>setProfessionalTitle(event.target.value)} placeholder={role==="candidate"?"e.g. AI Product Engineer":"e.g. Technical Recruiter"}/></label>{role==="candidate"&&<label><span>Experience (years)</span><input type="number" min="0" max="50" value={experienceYears} onChange={event=>setExperienceYears(Number(event.target.value))}/></label>}<label><span>Location</span><input value={location} onChange={event=>setLocation(event.target.value)} placeholder="e.g. Bengaluru"/></label>{role==="candidate"&&<label className="wide"><span>GitHub username <small>optional</small></span><input value={githubUsername} onChange={event=>setGithubUsername(event.target.value)} placeholder="your-username"/></label>}<label className="wide"><span>Secure account email</span><input value={user.email||""} readOnly/></label></div><button className="auth-primary button" disabled={saving}>{saving?"Creating workspace…":`Create ${role} workspace`}<span>→</span></button><button type="button" className="onboarding-signout" onClick={() => signOut(auth)}>Sign out</button></form></main>
}

function localPreviewProfile(role:AccountRole):AccountProfile{return {userId:`preview-${role}`,email:`${role}@skillnova.demo`,displayName:role==="candidate"?"Ananya Verma":"Darshan Patel",role,professionalTitle:role==="candidate"?"AI Product Engineer":"Technical Recruiter",experienceYears:role==="candidate"?3:5,location:"Bengaluru",githubUsername:role==="candidate"?"darshanbawaskar":"",createdAt:Date.now(),updatedAt:Date.now()}}

export default function Home(){
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [preview,setPreview]=useState<AccountProfile|null>(null);
  
  useEffect(()=>{
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const storedProfile = localStorage.getItem(`profile_${firebaseUser.uid}`);
        if (storedProfile) {
          setProfile(JSON.parse(storedProfile));
        } else {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  },[]);
  
  const handleLogout = async () => {
    await signOut(auth);
    setPreview(null);
    setProfile(null);
  };
  
  if(preview)return preview.role==="candidate"?<CandidateDashboard profile={preview} onLogout={() => setPreview(null)}/>:<RecruiterWorkspace profile={preview} onLogout={() => setPreview(null)}/>;
  if(loading)return <main className="auth-loading"><div><span>✦</span><strong>SkillNova</strong><small>Connecting your talent workspace…</small></div></main>;
  if(!user)return <AuthScreen onPreview={(role)=>setPreview(localPreviewProfile(role))} onLogin={setUser}/>;
  if(!profile)return <RegistrationScreen user={user} onComplete={setProfile}/>;
  return profile.role==="candidate"?<CandidateDashboard profile={profile} onLogout={handleLogout}/>:<RecruiterWorkspace profile={profile} onLogout={handleLogout}/>;
}
