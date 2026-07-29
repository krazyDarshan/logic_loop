"use client";

import { useEffect, useMemo, useState } from "react";

type View = "profile" | "match" | "verify" | "hackathon" | "recruiter";
type IconName =
  | "spark"
  | "profile"
  | "match"
  | "verify"
  | "trophy"
  | "people"
  | "github"
  | "file"
  | "arrow"
  | "check"
  | "search"
  | "briefcase"
  | "menu"
  | "close"
  | "bolt"
  | "shield"
  | "code"
  | "clock";

const icons: Record<IconName, React.ReactNode> = {
  spark: <><path d="M12 2l1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2Z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/></>,
  profile: <><circle cx="12" cy="8" r="3.25"/><path d="M5.5 20c.65-4 2.8-6 6.5-6s5.85 2 6.5 6"/></>,
  match: <><circle cx="9.5" cy="9.5" r="5.5"/><path d="m14 14 5 5M7.5 9.5l1.3 1.3 2.8-3"/></>,
  verify: <><path d="M12 2.8 19 6v5.1c0 4.5-2.9 8-7 10.1-4.1-2.1-7-5.6-7-10.1V6l7-3.2Z"/><path d="m8.7 12 2.1 2.1 4.7-5"/></>,
  trophy: <><path d="M8 4h8v4.5c0 3-1.7 5-4 5s-4-2-4-5V4Z"/><path d="M8 6H4.5v1c0 2.4 1.5 4 4 4M16 6h3.5v1c0 2.4-1.5 4-4 4M12 14v4M8.5 20h7"/></>,
  people: <><circle cx="9" cy="8" r="3"/><path d="M3.5 19c.5-3.4 2.3-5.1 5.5-5.1s5 1.7 5.5 5.1"/><circle cx="17.3" cy="9" r="2.2"/><path d="M15.5 14.5c3.1-.5 4.8 1 5 4.5"/></>,
  github: <><path d="M12 2.8a9.2 9.2 0 0 0-2.9 17.9v-2.4c-2.3.5-2.9-1-2.9-1-.4-1-.9-1.3-.9-1.3-.8-.5 0-.5 0-.5.8.1 1.3.9 1.3.9.7 1.3 2 1 2.5.8.1-.6.3-1 .6-1.3-1.9-.2-3.8-.9-3.8-4.1 0-.9.3-1.7.9-2.3-.1-.2-.4-1.1.1-2.3 0 0 .7-.2 2.5.9A8.5 8.5 0 0 1 12 7c.8 0 1.5.1 2.2.3 1.8-1.2 2.5-.9 2.5-.9.5 1.2.2 2.1.1 2.3.6.6.9 1.4.9 2.3 0 3.2-1.9 3.9-3.8 4.1.3.3.6.8.6 1.6v4A9.2 9.2 0 0 0 12 2.8Z"/></>,
  file: <><path d="M6 2.8h8l4 4V21H6V2.8Z"/><path d="M14 2.8v4h4M9 12h6M9 16h6"/></>,
  arrow: <><path d="M5 12h14M14 7l5 5-5 5"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2"/></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  bolt: <path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z"/>,
  shield: <><path d="M12 2.8 19 6v5.1c0 4.5-2.9 8-7 10.1-4.1-2.1-7-5.6-7-10.1V6l7-3.2Z"/><path d="M9 12h6"/></>,
  code: <><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></>,
};

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icons[name]}</svg>;
}

const navItems: { id: View; label: string; icon: IconName; eyebrow: string }[] = [
  { id: "profile", label: "Talent Profile", icon: "profile", eyebrow: "Discover" },
  { id: "match", label: "Job Match", icon: "match", eyebrow: "Match" },
  { id: "verify", label: "Skill Verify", icon: "verify", eyebrow: "Validate" },
  { id: "hackathon", label: "Hackathon Hiring", icon: "trophy", eyebrow: "Identify" },
  { id: "recruiter", label: "Recruiter Hub", icon: "people", eyebrow: "Decide" },
];

const candidates = [
  { name: "Ananya Verma", role: "Full-stack AI Engineer", initials: "AV", match: 94, verified: 91, score: 92, location: "Bengaluru", evidence: "12 repos · 3 hackathons", skills: ["Python", "React", "LangGraph"] },
  { name: "Rohan Mehta", role: "Machine Learning Engineer", initials: "RM", match: 89, verified: 87, score: 88, location: "Delhi", evidence: "18 repos · OSS contributor", skills: ["PyTorch", "FastAPI", "MLOps"] },
  { name: "Meera Nair", role: "Frontend Engineer", initials: "MN", match: 86, verified: 90, score: 87, location: "Pune", evidence: "9 repos · Hackathon winner", skills: ["React", "TypeScript", "Next.js"] },
  { name: "Kabir Shah", role: "Backend Engineer", initials: "KS", match: 83, verified: 84, score: 85, location: "Mumbai", evidence: "15 repos · 1 hackathon", skills: ["Python", "Postgres", "Docker"] },
];

function ScoreRing({ score, label, compact = false }: { score: number; label: string; compact?: boolean }) {
  const angle = Math.round((score / 100) * 360);
  return (
    <div className={`score-ring ${compact ? "compact" : ""}`} style={{ "--score-angle": `${angle}deg` } as React.CSSProperties}>
      <div className="score-inner"><strong>{score}</strong><span>{compact ? "/100" : label}</span></div>
    </div>
  );
}

function SkillPill({ children, state = "neutral" }: { children: React.ReactNode; state?: "neutral" | "good" | "missing" | "verified" }) {
  return <span className={`skill-pill ${state}`}>{state === "verified" && <Icon name="check" size={13} />}{children}</span>;
}

function AppHeader({ title, subtitle, onMenu }: { title: string; subtitle: string; onMenu: () => void }) {
  return (
    <header className="app-header">
      <button className="icon-button mobile-menu" onClick={onMenu} aria-label="Open navigation"><Icon name="menu" /></button>
      <div><p className="kicker">{subtitle}</p><h1>{title}</h1></div>
      <div className="header-actions">
        <div className="system-status"><span />AI systems ready</div>
        <button className="avatar-button" aria-label="Open recruiter profile">DP</button>
      </div>
    </header>
  );
}

function ProfileView({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [resume, setResume] = useState("Ananya_Verma_Resume.pdf");
  const [github, setGithub] = useState("ananyaverma");
  const [status, setStatus] = useState<"ready" | "loading" | "done">("ready");
  const [dragging, setDragging] = useState(false);

  const analyze = () => {
    setStatus("loading");
    window.setTimeout(() => setStatus("done"), 1250);
  };

  if (status === "done") return (
    <div className="view-wrap profile-results">
      <div className="result-banner">
        <div><span className="result-check"><Icon name="check" /></span><div><strong>Talent profile generated</strong><p>Resume and 12 public repositories analyzed in 18 seconds.</p></div></div>
        <button className="ghost-button" onClick={() => setStatus("ready")}>Analyze another</button>
      </div>

      <section className="candidate-hero-card">
        <div className="candidate-primary">
          <div className="large-avatar">AV<span className="verified-dot"><Icon name="check" size={11}/></span></div>
          <div><div className="candidate-name-row"><h2>Ananya Verma</h2><span className="verified-label"><Icon name="shield" size={14}/>Verified identity</span></div><p className="role">Full-stack AI Engineer</p><p className="meta">Bengaluru, India · 3 years experience · Open to work</p><div className="skill-list"><SkillPill state="verified">Python</SkillPill><SkillPill state="verified">React</SkillPill><SkillPill state="verified">FastAPI</SkillPill><SkillPill state="verified">LangGraph</SkillPill></div></div>
        </div>
        <div className="hero-score"><ScoreRing score={92} label="Talent score"/><div><strong>Top 8%</strong><span>among AI engineers</span></div></div>
      </section>

      <div className="results-grid">
        <section className="content-card span-7">
          <div className="section-heading"><div><p className="kicker">AI SYNTHESIS</p><h3>Talent intelligence brief</h3></div><span className="ai-label"><Icon name="spark" size={14}/>Generated by AI</span></div>
          <p className="summary-copy">Ananya is a product-minded full-stack engineer who consistently ships AI applications from prototype to production. Her strongest evidence is the depth of work across agent orchestration, API design, and usable React interfaces—not just repository count.</p>
          <div className="evidence-columns">
            <div><h4><span className="dot positive"/>Evidence-backed strengths</h4><ul className="evidence-list"><li>Maintains 4 active production-grade repositories</li><li>Strong Python and TypeScript consistency</li><li>Led a 4-person hackathon team to the finals</li></ul></div>
            <div><h4><span className="dot caution"/>Growth opportunities</h4><ul className="evidence-list"><li>Add automated tests to two core projects</li><li>Demonstrate more cloud deployment depth</li><li>Increase external open-source contributions</li></ul></div>
          </div>
        </section>

        <section className="content-card span-5">
          <div className="section-heading"><div><p className="kicker">SKILL EVIDENCE</p><h3>Capability map</h3></div><span className="confidence">High confidence</span></div>
          {[['Coding ability',94],['Project quality',91],['Problem solving',89],['Consistency',86]].map(([label,score]) => <div className="bar-row" key={String(label)}><div><span>{label}</span><strong>{score}</strong></div><div className="bar"><i style={{width:`${score}%`}}/></div></div>)}
        </section>

        <section className="content-card span-7">
          <div className="section-heading"><div><p className="kicker">GITHUB SIGNALS</p><h3>Proof behind the profile</h3></div><span className="connected"><Icon name="github" size={15}/>ananyaverma</span></div>
          <div className="repo-list">
            <div className="repo-row"><div className="repo-icon">AI</div><div><strong>agentflow-studio</strong><p>Visual LangGraph workflow builder with FastAPI runtime.</p><span>Python · 184 stars · Updated 3d ago</span></div><b>96</b></div>
            <div className="repo-row"><div className="repo-icon">CV</div><div><strong>vision-docs</strong><p>Document intelligence pipeline for structured extraction.</p><span>TypeScript · 93 stars · Updated 8d ago</span></div><b>91</b></div>
            <div className="repo-row"><div className="repo-icon">HF</div><div><strong>hireflow</strong><p>Semantic candidate-to-role matching experiment.</p><span>Python · 47 stars · Updated 12d ago</span></div><b>88</b></div>
          </div>
        </section>

        <section className="content-card span-5 next-card">
          <p className="kicker">NEXT BEST ACTION</p><h3>Ready to match</h3><p>Use this evidence-rich profile against a live job description, then verify the highest-impact skills.</p>
          <button className="primary-button full" onClick={() => onNavigate("match")}>Run job match <Icon name="arrow" size={17}/></button>
          <button className="text-button" onClick={() => onNavigate("verify")}>Start skill verification</button>
        </section>
      </div>
    </div>
  );

  return (
    <div className="view-wrap profile-start">
      <section className="hero-intro">
        <div className="hero-copy"><span className="eyebrow"><Icon name="spark" size={15}/>AI TALENT PROFILE ENGINE</span><h2>Turn scattered proof into one <em>trusted talent profile.</em></h2><p>SkillNova reads the resume, inspects public GitHub work, and connects every claim to real evidence—so recruiters see capability, not just keywords.</p><div className="hero-proof"><span><Icon name="shield" size={17}/>Evidence-linked scoring</span><span><Icon name="bolt" size={17}/>Results in seconds</span><span><Icon name="github" size={17}/>Live repository signals</span></div></div>
        <div className="evidence-board">
          <div className="evidence-board-head"><div><span>Candidate evidence</span><strong>Unified profile signal</strong></div><span className="evidence-ready"><i/>Analysis ready</span></div>
          <div className="evidence-score"><strong>92</strong><div><span>Talent Score</span><small>High confidence · Top 8%</small></div></div>
          <div className="evidence-metrics">
            <div><span><Icon name="github" size={17}/>GitHub repositories</span><strong>12 <Icon name="check" size={14}/></strong></div>
            <div><span><Icon name="code" size={17}/>Evidence-backed skills</span><strong>8 <Icon name="check" size={14}/></strong></div>
            <div><span><Icon name="trophy" size={17}/>Hackathon projects</span><strong>3 <Icon name="check" size={14}/></strong></div>
          </div>
          <div className="evidence-board-foot"><Icon name="shield" size={16}/>Every score links back to candidate evidence</div>
        </div>
      </section>

      <section className="analysis-workbench">
        <div className="workbench-form">
          <div className="section-heading"><div><p className="kicker">BUILD A PROFILE</p><h3>Add candidate evidence</h3></div><span className="step-count">Step 1 of 1</span></div>
          <label className={`upload-zone ${dragging ? "dragging" : ""}`} onDragOver={(e) => {e.preventDefault(); setDragging(true)}} onDragLeave={() => setDragging(false)} onDrop={(e) => {e.preventDefault(); setDragging(false); const file=e.dataTransfer.files[0]; if(file) setResume(file.name)}}>
            <input type="file" accept=".pdf" onChange={(e) => {const file=e.target.files?.[0]; if(file) setResume(file.name)}}/>
            <span className="upload-icon"><Icon name="file" size={24}/></span>
            <div><strong>{resume || "Drop a resume PDF here"}</strong><p>{resume ? "PDF ready for extraction · 1.8 MB" : "or click to browse · PDF up to 10 MB"}</p></div>
            {resume && <span className="ready-pill"><Icon name="check" size={13}/>Ready</span>}
          </label>
          <div className="field-group"><label htmlFor="github">GitHub profile</label><div className="input-shell"><Icon name="github"/><span>github.com/</span><input id="github" value={github} onChange={(e)=>setGithub(e.target.value)} placeholder="username"/></div><small>We only analyze public repositories and contribution signals.</small></div>
          <button className="primary-button full analyze-button" onClick={analyze} disabled={!resume || !github || status === "loading"}>{status === "loading" ? <><span className="spinner"/>Connecting evidence...</> : <><Icon name="spark" size={18}/>Generate talent profile <Icon name="arrow" size={18}/></>}</button>
        </div>
        <div className="pipeline-panel">
          <p className="kicker">WHAT SKILLNOVA CONNECTS</p><h3>From claims to confidence</h3>
          <div className="pipeline-step active"><span><Icon name="file"/></span><div><strong>Resume intelligence</strong><p>Skills, education, impact, experience</p></div><b>01</b></div>
          <div className="pipeline-line"><i/></div>
          <div className="pipeline-step"><span><Icon name="github"/></span><div><strong>GitHub evidence</strong><p>Code quality, activity, ownership, depth</p></div><b>02</b></div>
          <div className="pipeline-line"><i/></div>
          <div className="pipeline-step"><span><Icon name="spark"/></span><div><strong>Unified talent profile</strong><p>Strengths, gaps, suitability, score</p></div><b>03</b></div>
          <div className="privacy-note"><Icon name="shield" size={18}/><p><strong>Privacy by design</strong><br/>Candidate evidence stays permissioned and transparent.</p></div>
        </div>
      </section>
    </div>
  );
}

function MatchView({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [job, setJob] = useState("Senior AI Product Engineer");
  const [description, setDescription] = useState("We are looking for a product-minded engineer with strong Python, React and FastAPI experience. You will build LLM-powered workflows with LangGraph, ship reliable APIs, work with PostgreSQL and deploy production systems on AWS.");
  const [matched, setMatched] = useState(true);
  const [loading, setLoading] = useState(false);
  const run = () => { setLoading(true); setMatched(false); window.setTimeout(()=>{setLoading(false);setMatched(true)},900) };
  return <div className="view-wrap">
    <section className="page-lead"><div><span className="eyebrow"><Icon name="match" size={15}/>SEMANTIC MATCHING</span><h2>Find fit beyond keywords.</h2><p>SkillNova compares role intent with verified candidate evidence and explains every point in the match.</p></div><div className="profile-chip"><div className="small-avatar">AV</div><div><small>Matching candidate</small><strong>Ananya Verma</strong></div><Icon name="check" size={18}/></div></section>
    <div className="match-layout">
      <section className="content-card match-form">
        <div className="section-heading"><div><p className="kicker">ROLE REQUIREMENTS</p><h3>Job description</h3></div><span className="connected"><Icon name="briefcase" size={15}/>Active role</span></div>
        <div className="field-group"><label htmlFor="job-title">Job title</label><input className="text-input" id="job-title" value={job} onChange={e=>setJob(e.target.value)}/></div>
        <div className="field-group"><label htmlFor="job-description">Description</label><textarea id="job-description" rows={9} value={description} onChange={e=>setDescription(e.target.value)}/><small>{description.length} characters · Rich enough for semantic analysis</small></div>
        <button className="primary-button full" onClick={run} disabled={loading}>{loading ? <><span className="spinner"/>Comparing evidence...</> : <><Icon name="spark" size={17}/>Run semantic match <Icon name="arrow" size={17}/></>}</button>
      </section>
      <section className={`content-card match-result ${matched ? "visible" : "empty"}`}>
        {matched ? <>
          <div className="match-score-head"><ScoreRing score={94} label="Role match"/><div><span className="fit-badge">Exceptional fit</span><h3>{job}</h3><p>Strong evidence across 7 of 9 core requirements.</p></div></div>
          <div className="explain-score"><p className="kicker">WHY THIS MATCHES</p><div className="match-factor"><span>Skill similarity</span><div className="bar"><i style={{width:'96%'}}/></div><strong>96</strong></div><div className="match-factor"><span>Project relevance</span><div className="bar"><i style={{width:'93%'}}/></div><strong>93</strong></div><div className="match-factor"><span>Experience fit</span><div className="bar"><i style={{width:'88%'}}/></div><strong>88</strong></div></div>
          <div className="match-skills"><div><h4>Evidence matched</h4><div className="skill-list"><SkillPill state="good">Python</SkillPill><SkillPill state="good">React</SkillPill><SkillPill state="good">FastAPI</SkillPill><SkillPill state="good">LangGraph</SkillPill><SkillPill state="good">PostgreSQL</SkillPill></div></div><div><h4>Skills to validate</h4><div className="skill-list"><SkillPill state="missing">AWS depth</SkillPill><SkillPill state="missing">Observability</SkillPill></div></div></div>
          <div className="recommendation-box"><Icon name="spark"/><div><strong>AI recommendation</strong><p>Shortlist Ananya. Validate AWS architecture and production monitoring in the interview; her repository evidence strongly predicts fast onboarding.</p></div></div>
          <button className="primary-button full" onClick={()=>onNavigate("verify")}>Verify priority skills <Icon name="arrow" size={17}/></button>
        </> : <div className="result-placeholder"><span className="placeholder-icon"><Icon name="match" size={28}/></span><h3>Your match report appears here</h3><p>Run the semantic analysis to compare role intent with candidate evidence.</p></div>}
      </section>
    </div>
  </div>
}

function VerifyView({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [question, setQuestion] = useState(1);
  const sendAnswer = () => { if(!answer.trim()) return; setSubmitted(true); window.setTimeout(()=>{setAnswer(""); setSubmitted(false); setQuestion(2)},1100) };
  return <div className="view-wrap">
    <section className="page-lead"><div><span className="eyebrow"><Icon name="verify" size={15}/>SKILL VERIFICATION AGENT</span><h2>Let real capability answer.</h2><p>An adaptive technical interview connects candidate answers to resume claims and repository evidence.</p></div><div className="timer-chip"><Icon name="clock"/><div><small>Session time</small><strong>12:48</strong></div></div></section>
    <div className="verify-layout">
      <section className="content-card interview-card">
        <div className="interview-top"><div className="agent-id"><span><Icon name="spark"/></span><div><strong>Nova · Technical Interviewer</strong><p><i/>Live adaptive interview</p></div></div><span>Question {question} of 5</span></div>
        <div className="progress-track"><i style={{width: question === 1 ? '20%' : '40%'}}/></div>
        <div className="chat-window">
          <div className="agent-message"><span className="chat-avatar"><Icon name="spark" size={17}/></span><div><small>Nova</small><p>{question === 1 ? "In your agentflow-studio repository, you used LangGraph for orchestration. How would you prevent an agent loop from running indefinitely, and where would you store the execution state?" : "Good. Now imagine that checkpoint writes start slowing down under load. How would you diagnose and redesign that part without losing resumability?"}</p><div className="question-signal"><Icon name="github" size={14}/>Grounded in agentflow-studio · LangGraph</div></div></div>
          {submitted && <div className="user-message"><div><small>You</small><p>{answer}</p></div><span className="chat-avatar user">AV</span></div>}
        </div>
        <div className="answer-area"><label htmlFor="answer">Your answer</label><textarea id="answer" rows={5} value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Explain your approach, trade-offs, and implementation details..."/><div className="answer-footer"><span><Icon name="code" size={15}/>Code snippets supported</span><button className="primary-button" onClick={sendAnswer} disabled={!answer.trim() || submitted}>{submitted ? <><span className="spinner"/>Evaluating...</> : <>Submit answer <Icon name="arrow" size={16}/></>}</button></div></div>
      </section>
      <aside className="verify-side">
        <section className="content-card candidate-mini"><div className="candidate-primary"><div className="small-avatar">AV</div><div><strong>Ananya Verma</strong><p>Full-stack AI Engineer</p></div></div><div className="verification-total"><div><span>Verification score</span><strong>91<small>/100</small></strong></div><span className="fit-badge">High confidence</span></div></section>
        <section className="content-card"><div className="section-heading"><div><p className="kicker">LIVE EVIDENCE</p><h3>Skills under review</h3></div></div><div className="verify-skill"><span><Icon name="check" size={15}/></span><div><strong>Python</strong><p>Verified · 94 confidence</p></div><b>94</b></div><div className="verify-skill"><span><Icon name="check" size={15}/></span><div><strong>React</strong><p>Verified · 91 confidence</p></div><b>91</b></div><div className="verify-skill current"><span><Icon name="spark" size={15}/></span><div><strong>LangGraph</strong><p>Interviewing now</p></div><b>...</b></div><div className="verify-skill pending"><span>4</span><div><strong>AWS</strong><p>Pending validation</p></div><b>—</b></div></section>
        <section className="content-card repo-proof"><Icon name="github"/><div><p className="kicker">PROJECT VERIFICATION</p><strong>3 claims cross-checked</strong><span>Resume ↔ repository consistency: 96%</span></div></section>
        <button className="ghost-button full" onClick={()=>onNavigate("recruiter")}>Preview recruiter report</button>
      </aside>
    </div>
  </div>
}

function HackathonView({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [activeProject, setActiveProject] = useState(0);
  const [invited, setInvited] = useState(false);
  const projects = [
    {name:"JalDrishti", team:"Team Aether", rank:"Winner", initials:"JA", score:94, innovation:96, feasibility:89, desc:"Computer-vision water quality monitoring for rural communities, with low-cost edge sensors and multilingual alerts.", stack:["Python","YOLOv8","FastAPI","React"], members:["AV","RN","SK","PM"]},
    {name:"GridWise", team:"Volt Labs", rank:"Runner-up", initials:"GW", score:91, innovation:92, feasibility:90, desc:"AI demand forecasting that helps campuses reduce peak energy use and visualize savings in real time.", stack:["PyTorch","Next.js","PostgreSQL"], members:["MN","KS","AR"]},
    {name:"Sahayak", team:"Civic Stack", rank:"Top 5", initials:"SA", score:88, innovation:90, feasibility:84, desc:"A multilingual civic-assistance agent that guides residents through public services using verified sources.", stack:["LangGraph","RAG","TypeScript"], members:["RM","PD","NT"]}
  ];
  const p=projects[activeProject];
  return <div className="view-wrap">
    <section className="page-lead"><div><span className="eyebrow"><Icon name="trophy" size={15}/>HACKATHON-TO-HIRING</span><h2>Discover builders in motion.</h2><p>Turn hackathon projects, team contributions, and GitHub proof into a direct talent pipeline.</p></div><div className="event-chip"><span className="event-mark">LL</span><div><small>Live talent pool</small><strong>Logic Loop 2026</strong></div><span>128 builders</span></div></section>
    <div className="hackathon-stats"><div><span className="stat-icon blue"><Icon name="trophy"/></span><p>Projects analyzed<strong>32</strong></p><small>100% complete</small></div><div><span className="stat-icon green"><Icon name="people"/></span><p>Recruiter-ready<strong>18</strong></p><small>Score above 80</small></div><div><span className="stat-icon amber"><Icon name="spark"/></span><p>Top innovation<strong>96</strong></p><small>JalDrishti</small></div><div><span className="stat-icon navy"><Icon name="briefcase"/></span><p>Interview invites<strong>11</strong></p><small>Across 6 teams</small></div></div>
    <div className="hackathon-layout">
      <section className="content-card leaderboard"><div className="section-heading"><div><p className="kicker">AI PROJECT RANKING</p><h3>Top talent signals</h3></div><button className="mini-filter"><Icon name="search" size={15}/>Filter</button></div>{projects.map((project,i)=><button key={project.name} className={`project-row ${i===activeProject?'active':''}`} onClick={()=>{setActiveProject(i);setInvited(false)}}><span className="rank">0{i+1}</span><span className="project-avatar">{project.initials}</span><span className="project-copy"><strong>{project.name}</strong><small>{project.team} · {project.rank}</small></span><span className="project-score">{project.score}<small>AI score</small></span><Icon name="arrow" size={16}/></button>)}</section>
      <section className="content-card project-detail"><div className="project-cover"><div><span className="fit-badge">{p.rank}</span><h3>{p.name}</h3><p>{p.team} · Social impact AI</p></div><ScoreRing score={p.score} label="Project score" compact/></div><p className="project-description">{p.desc}</p><div className="project-score-grid"><div><span>Innovation</span><strong>{p.innovation}</strong><div className="bar"><i style={{width:`${p.innovation}%`}}/></div></div><div><span>Feasibility</span><strong>{p.feasibility}</strong><div className="bar"><i style={{width:`${p.feasibility}%`}}/></div></div><div><span>Technical depth</span><strong>92</strong><div className="bar"><i style={{width:'92%'}}/></div></div><div><span>Documentation</span><strong>86</strong><div className="bar"><i style={{width:'86%'}}/></div></div></div><div className="tech-team"><div><h4>Technology evidence</h4><div className="skill-list">{p.stack.map(s=><SkillPill key={s} state="good">{s}</SkillPill>)}</div></div><div><h4>Team contributors</h4><div className="member-stack">{p.members.map((m,i)=><span key={m} style={{zIndex:p.members.length-i}}>{m}</span>)}</div></div></div><div className="project-actions"><button className="ghost-button" onClick={()=>onNavigate("profile")}>View talent profiles</button><button className="primary-button" onClick={()=>setInvited(true)}>{invited ? <><Icon name="check" size={16}/>Invite sent</> : <>Invite top contributors <Icon name="arrow" size={16}/></>}</button></div></section>
    </div>
  </div>
}

function RecruiterView({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [query,setQuery]=useState(""); const [shortlisted,setShortlisted]=useState<string[]>(["Ananya Verma"]);
  const filtered=useMemo(()=>candidates.filter(c=>(c.name+c.role+c.location+c.skills.join(' ')).toLowerCase().includes(query.toLowerCase())),[query]);
  const toggle=(name:string)=>setShortlisted(x=>x.includes(name)?x.filter(n=>n!==name):[...x,name]);
  return <div className="view-wrap">
    <section className="page-lead recruiter-lead"><div><span className="eyebrow"><Icon name="people" size={15}/>RECRUITER INTELLIGENCE HUB</span><h2>Decide with the whole signal.</h2><p>Talent profiles, role fit, verified skills, and hackathon proof—finally in one place.</p></div><button className="primary-button" onClick={()=>onNavigate("match")}><Icon name="briefcase" size={17}/>Create job match</button></section>
    <div className="recruiter-stats"><div><span>Active candidates</span><strong>128</strong><small><b>+18</b> this week</small></div><div><span>High-fit talent</span><strong>34</strong><small>Match score ≥ 85</small></div><div><span>Skills verified</span><strong>76%</strong><small><b>+9%</b> this month</small></div><div><span>Time to shortlist</span><strong>1.8d</strong><small><b>−42%</b> vs manual</small></div></div>
    <section className="content-card recruiter-table-card"><div className="table-tools"><div><p className="kicker">UNIFIED TALENT PIPELINE</p><h3>Recommended candidates</h3></div><div className="search-shell"><Icon name="search" size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search skill, role, or city"/></div></div><div className="table-wrap"><table><thead><tr><th>Candidate</th><th>Proof</th><th>Role match</th><th>Verified skill</th><th>Talent score</th><th>Decision</th></tr></thead><tbody>{filtered.map(c=><tr key={c.name}><td><div className="table-candidate"><span className="small-avatar">{c.initials}</span><div><strong>{c.name}</strong><small>{c.role} · {c.location}</small><div className="micro-skills">{c.skills.map(s=><span key={s}>{s}</span>)}</div></div></div></td><td><span className="proof-text"><Icon name="github" size={15}/>{c.evidence}</span></td><td><div className="number-cell"><strong>{c.match}%</strong><div className="bar"><i style={{width:`${c.match}%`}}/></div></div></td><td><span className="verified-score"><Icon name="shield" size={15}/>{c.verified}%</span></td><td><strong className="talent-number">{c.score}</strong></td><td><button className={shortlisted.includes(c.name)?"shortlist active":"shortlist"} onClick={()=>toggle(c.name)}>{shortlisted.includes(c.name)?<><Icon name="check" size={14}/>Shortlisted</>:"Shortlist"}</button></td></tr>)}</tbody></table></div><div className="table-footer"><span>Showing {filtered.length} of 128 candidates</span><div><button disabled>Previous</button><button className="current">1</button><button>2</button><button>3</button><button>Next</button></div></div></section>
    <div className="insight-grid"><section className="content-card"><div className="section-heading"><div><p className="kicker">PIPELINE HEALTH</p><h3>Hiring funnel</h3></div><span>Last 30 days</span></div><div className="funnel"><div style={{width:'100%'}}><span>Sourced</span><strong>128</strong></div><div style={{width:'78%'}}><span>High-fit</span><strong>62</strong></div><div style={{width:'58%'}}><span>Verified</span><strong>41</strong></div><div style={{width:'42%'}}><span>Shortlisted</span><strong>24</strong></div></div></section><section className="content-card recruiter-insight"><span className="insight-icon"><Icon name="spark"/></span><div><p className="kicker">NOVA’S INSIGHT</p><h3>Your strongest hidden talent pool</h3><p>Hackathon participants are converting to shortlist at <strong>2.4×</strong> the rate of resume-only applicants. Explore 7 high-fit builders not yet reviewed.</p><button className="text-button" onClick={()=>onNavigate("hackathon")}>Explore hackathon talent <Icon name="arrow" size={15}/></button></div></section></div>
  </div>
}

export default function Home() {
  const [active, setActive] = useState<View>("profile");
  const [menuOpen, setMenuOpen] = useState(false);
  const activeNav = navItems.find(item=>item.id===active)!;
  useEffect(()=>{window.scrollTo({top:0,behavior:'smooth'})},[active]);
  const navigate=(view:View)=>{setActive(view);setMenuOpen(false)};
  return <main className="app-shell">
    <aside className={`sidebar ${menuOpen?'open':''}`}>
      <div className="brand"><span className="brand-mark"><Icon name="spark" size={19}/></span><div><strong>SkillNova</strong><small>Talent intelligence</small></div><button className="icon-button close-menu" onClick={()=>setMenuOpen(false)} aria-label="Close navigation"><Icon name="close"/></button></div>
      <nav aria-label="Product navigation"><p className="nav-label">WORKSPACE</p>{navItems.map(item=><button key={item.id} className={active===item.id?'active':''} onClick={()=>navigate(item.id)}><span className="nav-icon"><Icon name={item.icon}/></span><span><small>{item.eyebrow}</small>{item.label}</span>{active===item.id&&<i/>}</button>)}</nav>
      <div className="sidebar-flow"><p>One connected signal</p><div><span className="done"><Icon name="check" size={11}/></span><i/><span className={active==='profile'?'current':'done'}>{active==='profile'?'1':<Icon name="check" size={11}/>}</span><i/><span className={['verify','hackathon','recruiter'].includes(active)?'done':active==='match'?'current':''}>{['verify','hackathon','recruiter'].includes(active)?<Icon name="check" size={11}/>:active==='match'?'2':'3'}</span><i/><span className={active==='recruiter'?'current':''}>{active==='recruiter'?'5':'4'}</span></div><small>Evidence → match → verify → hire</small></div>
      <div className="sidebar-user"><span className="small-avatar">DP</span><div><strong>Darshan</strong><small>Recruiter workspace</small></div><span className="online-dot"/></div>
    </aside>
    {menuOpen&&<button className="sidebar-overlay" onClick={()=>setMenuOpen(false)} aria-label="Close navigation overlay"/>}
    <section className="main-stage">
      <AppHeader title={activeNav.label} subtitle={activeNav.eyebrow} onMenu={()=>setMenuOpen(true)}/>
      {active==="profile"&&<ProfileView onNavigate={navigate}/>} {active==="match"&&<MatchView onNavigate={navigate}/>} {active==="verify"&&<VerifyView onNavigate={navigate}/>} {active==="hackathon"&&<HackathonView onNavigate={navigate}/>} {active==="recruiter"&&<RecruiterView onNavigate={navigate}/>} 
      <footer><span><strong>SkillNova</strong> · Proof over paperwork.</span><span>AI Talent Intelligence Platform · Logic Loop 2026</span></footer>
    </section>
  </main>;
}
