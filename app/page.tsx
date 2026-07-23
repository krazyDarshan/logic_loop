"use client";

import { FormEvent, useMemo, useState } from "react";

type Role = "recruiter" | "candidate";
type Candidate = {
  id: number;
  name: string;
  initials: string;
  role: string;
  location: string;
  match: number;
  talent: number;
  authenticity: number;
  color: string;
  skills: string[];
  proof: string;
  activity: string;
  experience: string;
};

const candidates: Candidate[] = [
  {
    id: 1,
    name: "Aarav Mehta",
    initials: "AM",
    role: "GenAI Engineer",
    location: "New Delhi",
    match: 96,
    talent: 92,
    authenticity: 98,
    color: "coral",
    skills: ["Python", "RAG", "Open Source"],
    proof: "Winner · HackNCR 2026",
    activity: "347 contributions",
    experience: "3.2 yrs",
  },
  {
    id: 2,
    name: "Naina Rao",
    initials: "NR",
    role: "ML Product Engineer",
    location: "Bengaluru",
    match: 93,
    talent: 89,
    authenticity: 97,
    color: "violet",
    skills: ["PyTorch", "React", "LLMOps"],
    proof: "12 merged OSS PRs",
    activity: "28 repositories",
    experience: "2.8 yrs",
  },
  {
    id: 3,
    name: "Kabir Sharma",
    initials: "KS",
    role: "Full-stack AI Developer",
    location: "Gurugram",
    match: 91,
    talent: 87,
    authenticity: 95,
    color: "blue",
    skills: ["Next.js", "GenAI", "Node"],
    proof: "Finalist · Smart India",
    activity: "84 pull requests",
    experience: "2.4 yrs",
  },
  {
    id: 4,
    name: "Ishita Sen",
    initials: "IS",
    role: "Data & AI Engineer",
    location: "Pune",
    match: 88,
    talent: 86,
    authenticity: 99,
    color: "green",
    skills: ["MLOps", "Python", "AWS"],
    proof: "Maintainer · Flowline",
    activity: "526 contributions",
    experience: "3.6 yrs",
  },
];

const recruiterNav = [
  ["overview", "⌂", "Overview"],
  ["discover", "⌕", "Talent discovery"],
  ["pipeline", "◇", "Hiring pipeline"],
  ["assessments", "◈", "Assessments"],
  ["hackathons", "⚑", "Hackathons"],
  ["pitch", "▱", "Pitch analyzer"],
  ["analytics", "◒", "Hiring analytics"],
];

const candidateNav = [
  ["overview", "⌂", "My dashboard"],
  ["profile", "◉", "Talent identity"],
  ["opportunities", "◇", "Job matches"],
  ["roadmap", "↗", "Career roadmap"],
  ["resume", "▤", "Resume studio"],
  ["assessments", "◈", "My assessments"],
];

function Avatar({
  candidate,
  size = "medium",
}: {
  candidate: Candidate;
  size?: "small" | "medium" | "large";
}) {
  return (
    <div className={`avatar avatar-${size} ${candidate.color}`}>
      <span>{candidate.initials}</span>
      <i aria-label="Verified candidate">✓</i>
    </div>
  );
}

function ScoreRing({
  value,
  label,
  size = "medium",
  tone = "lime",
}: {
  value: number;
  label?: string;
  size?: "small" | "medium" | "large";
  tone?: "lime" | "violet" | "coral";
}) {
  return (
    <div
      className={`score-ring score-${size} score-${tone}`}
      style={{ "--score": `${value * 3.6}deg` } as React.CSSProperties}
      aria-label={`${label || "Score"}: ${value}`}
    >
      <div>
        <strong>{value}</strong>
        {label && <span>{label}</span>}
      </div>
    </div>
  );
}

function PageHeading({
  eyebrow,
  title,
  copy,
  action,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  );
}

function MiniSparkline({ points }: { points: number[] }) {
  return (
    <div className="sparkline" aria-label="Trend">
      {points.map((point, index) => (
        <i key={index} style={{ height: `${point}%` }} />
      ))}
    </div>
  );
}

function RecruiterOverview({
  onNavigate,
  onCandidate,
  onSearch,
  saved,
  toggleSaved,
}: {
  onNavigate: (view: string) => void;
  onCandidate: (candidate: Candidate) => void;
  onSearch: (query: string) => void;
  saved: number[];
  toggleSaved: (id: number) => void;
}) {
  const [query, setQuery] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    onSearch(query || "Find top GenAI developers with open-source experience");
  }

  return (
    <>
      <section className="overview-intro">
        <div>
          <span className="eyebrow">Thursday · 23 July</span>
          <h1>
            Hire what they&apos;ve <em>proven.</em>
          </h1>
          <p>
            Good morning, Arjun. Your AI talent graph found{" "}
            <strong>18 high-signal candidates</strong> overnight.
          </p>
        </div>
        <button className="button button-dark" onClick={() => onNavigate("pipeline")}>
          <span>＋</span> Create a job
        </button>
      </section>

      <section className="metric-grid">
        <article className="metric-card featured-metric">
          <span className="metric-icon">◎</span>
          <div>
            <small>Verified talent pool</small>
            <strong>12,480</strong>
          </div>
          <span className="metric-trend positive">↑ 8.4%</span>
          <MiniSparkline points={[26, 40, 34, 55, 49, 71, 68, 88]} />
        </article>
        <article className="metric-card">
          <span className="metric-icon violet-wash">◇</span>
          <div>
            <small>Active roles</small>
            <strong>24</strong>
          </div>
          <span className="metric-trend">6 closing soon</span>
        </article>
        <article className="metric-card">
          <span className="metric-icon blue-wash">◷</span>
          <div>
            <small>Avg. time to shortlist</small>
            <strong>1.8d</strong>
          </div>
          <span className="metric-trend positive">↓ 32%</span>
        </article>
        <article className="metric-card">
          <span className="metric-icon coral-wash">◈</span>
          <div>
            <small>Quality of hire</small>
            <strong>91%</strong>
          </div>
          <span className="metric-trend positive">↑ 4.1%</span>
        </article>
      </section>

      <section className="copilot-card">
        <div className="copilot-orb">
          <span>✦</span>
          <i />
          <i />
        </div>
        <div className="copilot-content">
          <span className="dark-eyebrow">Proven copilot · Live talent graph</span>
          <h2>Who are you looking for?</h2>
          <form onSubmit={submit} className="copilot-search">
            <label htmlFor="overview-copilot" className="sr-only">
              Search candidates using natural language
            </label>
            <input
              id="overview-copilot"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. React developers from Delhi with hackathon wins..."
            />
            <button aria-label="Run AI talent search">↗</button>
          </form>
          <div className="suggestion-row">
            {["GenAI + open source", "Top hackathon builders", "Women in ML · Delhi"].map(
              (item) => (
                <button key={item} onClick={() => onSearch(item)}>
                  {item}
                </button>
              ),
            )}
          </div>
        </div>
        <div className="copilot-proof">
          <span>Evidence sources</span>
          <div>
            <b>GH</b>
            <b>in</b>
            <b>⌁</b>
            <b>＋7</b>
          </div>
          <small>Refreshed 4m ago</small>
        </div>
      </section>

      <section className="section-block">
        <div className="section-title">
          <div>
            <span className="eyebrow">AI-ranked for your open roles</span>
            <h2>Top talent matches</h2>
          </div>
          <button className="text-button" onClick={() => onNavigate("discover")}>
            Explore all 238 <span>→</span>
          </button>
        </div>
        <div className="candidate-grid">
          {candidates.slice(0, 3).map((candidate, index) => (
            <article className="candidate-card" key={candidate.id}>
              <div className="candidate-top">
                <span className="rank-tag">0{index + 1}</span>
                <button
                  className={`save-button ${saved.includes(candidate.id) ? "saved" : ""}`}
                  onClick={() => toggleSaved(candidate.id)}
                  aria-label={
                    saved.includes(candidate.id)
                      ? `Remove ${candidate.name} from shortlist`
                      : `Save ${candidate.name} to shortlist`
                  }
                >
                  {saved.includes(candidate.id) ? "♥" : "♡"}
                </button>
              </div>
              <div className="candidate-person">
                <Avatar candidate={candidate} size="large" />
                <ScoreRing value={candidate.match} size="small" />
              </div>
              <h3>{candidate.name}</h3>
              <p>{candidate.role}</p>
              <span className="candidate-location">⌖ {candidate.location}</span>
              <div className="tag-row">
                {candidate.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
              <div className="proof-strip">
                <span>⚡</span>
                <div>
                  <small>Strongest proof</small>
                  <strong>{candidate.proof}</strong>
                </div>
              </div>
              <div className="candidate-footer">
                <span>
                  <b>{candidate.talent}</b> Talent score
                </span>
                <button onClick={() => onCandidate(candidate)}>View proof →</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-bottom-grid">
        <article className="panel pipeline-panel">
          <div className="section-title compact">
            <div>
              <span className="eyebrow">Live pipeline</span>
              <h2>Hiring momentum</h2>
            </div>
            <button className="icon-button" onClick={() => onNavigate("pipeline")}>
              ↗
            </button>
          </div>
          <div className="pipeline-flow">
            {[
              ["Discovered", 238, 72],
              ["Shortlisted", 46, 50],
              ["Interview", 18, 36],
              ["Offer", 7, 22],
            ].map(([label, value, width], index) => (
              <div className="pipeline-stage" key={String(label)}>
                <div>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
                <i>
                  <b style={{ width: `${width}%` }} />
                </i>
                {index < 3 && <em>→</em>}
              </div>
            ))}
          </div>
          <div className="pipeline-note">
            <span>✦</span>
            <p>
              <strong>12 candidates</strong> are likely to drop off without action this
              week.
            </p>
            <button>Review</button>
          </div>
        </article>

        <article className="panel signal-panel">
          <div className="section-title compact">
            <div>
              <span className="eyebrow">Signals, not noise</span>
              <h2>Intelligence feed</h2>
            </div>
            <span className="live-pill">● Live</span>
          </div>
          <div className="signal-list">
            <div>
              <span className="signal-icon violet-wash">⚑</span>
              <p>
                <strong>8 top performers</strong>
                <small>from HackNCR now match your AI roles</small>
              </p>
              <time>8m</time>
            </div>
            <div>
              <span className="signal-icon blue-wash">⌘</span>
              <p>
                <strong>Naina merged a major OSS PR</strong>
                <small>Project relevance increased to 94%</small>
              </p>
              <time>22m</time>
            </div>
            <div>
              <span className="signal-icon coral-wash">!</span>
              <p>
                <strong>2 profile risks detected</strong>
                <small>Duplicate project evidence requires review</small>
              </p>
              <time>1h</time>
            </div>
          </div>
        </article>
      </section>
    </>
  );
}

function TalentDiscovery({
  initialQuery,
  onCandidate,
  saved,
  toggleSaved,
  notify,
}: {
  initialQuery: string;
  onCandidate: (candidate: Candidate) => void;
  saved: number[];
  toggleSaved: (id: number) => void;
  notify: (message: string) => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [searched, setSearched] = useState(Boolean(initialQuery));

  function runSearch(event?: FormEvent) {
    event?.preventDefault();
    setSearched(true);
  }

  return (
    <>
      <PageHeading
        eyebrow="AI talent discovery"
        title="Search for proof, not keywords."
        copy="Describe your ideal candidate in plain English. Proven searches skills, projects, communities, code, and verified performance."
        action={
          <button className="button button-outline" onClick={() => notify("Search saved to your talent alerts")}>
            ☆ Save this search
          </button>
        }
      />
      <form className="discovery-search" onSubmit={runSearch}>
        <span>✦</span>
        <label htmlFor="discovery-query" className="sr-only">
          Describe the candidates you want to find
        </label>
        <input
          id="discovery-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find React developers with GenAI and hackathon experience in Delhi"
        />
        <button>Find talent ↗</button>
      </form>
      <div className="filter-row">
        <button className="filter-button active">Best match</button>
        <button className="filter-button">Location · India</button>
        <button className="filter-button">Talent score · 80+</button>
        <button className="filter-button">Experience · 2–5 yrs</button>
        <button className="filter-button">More filters ＋</button>
        <span>{searched ? "238 evidence-backed results" : "12,480 verified profiles"}</span>
      </div>

      {searched && (
        <div className="ai-interpretation">
          <span>✦</span>
          <p>
            <small>I translated your request into</small>
            <strong>
              React or Next.js · GenAI projects · ≥1 hackathon · Delhi NCR · active in
              the last 90 days
            </strong>
          </p>
          <button>Edit logic</button>
        </div>
      )}

      <div className="results-layout">
        <div className="results-list">
          {candidates.map((candidate) => (
            <article className="result-card" key={candidate.id}>
              <Avatar candidate={candidate} size="large" />
              <div className="result-main">
                <div className="result-name">
                  <div>
                    <h3>{candidate.name}</h3>
                    <p>
                      {candidate.role} · {candidate.experience} · {candidate.location}
                    </p>
                  </div>
                  <div className="result-actions">
                    <button
                      className={`save-button ${saved.includes(candidate.id) ? "saved" : ""}`}
                      onClick={() => toggleSaved(candidate.id)}
                    >
                      {saved.includes(candidate.id) ? "♥" : "♡"}
                    </button>
                    <button className="button button-small" onClick={() => onCandidate(candidate)}>
                      View profile
                    </button>
                  </div>
                </div>
                <div className="tag-row">
                  {candidate.skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                  <span className="verified-tag">✓ Identity verified</span>
                </div>
                <div className="evidence-grid">
                  <div>
                    <small>Strongest evidence</small>
                    <strong>{candidate.proof}</strong>
                  </div>
                  <div>
                    <small>Technical consistency</small>
                    <strong>{candidate.activity}</strong>
                  </div>
                  <div>
                    <small>Authenticity</small>
                    <strong>{candidate.authenticity}/100 · Low risk</strong>
                  </div>
                </div>
              </div>
              <div className="match-score-block">
                <ScoreRing value={candidate.match} size="medium" />
                <strong>{candidate.match}% match</strong>
                <span>Skills 96 · Projects 94</span>
              </div>
            </article>
          ))}
        </div>
        <aside className="search-insights">
          <span className="eyebrow">Search intelligence</span>
          <h3>What makes a top match?</h3>
          <div className="weight-list">
            {[
              ["Verified skills", 94],
              ["Project relevance", 88],
              ["Technical consistency", 81],
              ["Hackathon signal", 76],
              ["Culture indicators", 68],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <span>
                  {label} <b>{value}%</b>
                </span>
                <i>
                  <b style={{ width: `${value}%` }} />
                </i>
              </div>
            ))}
          </div>
          <div className="insight-callout">
            <span>✦</span>
            <p>
              Expanding to Gurugram adds <strong>41 qualified candidates</strong> with
              no quality loss.
            </p>
            <button onClick={() => notify("Gurugram added to this search")}>Expand area</button>
          </div>
        </aside>
      </div>
    </>
  );
}

function HiringPipeline({ notify }: { notify: (message: string) => void }) {
  const stages = [
    { title: "AI shortlisted", count: 12, people: candidates.slice(0, 3) },
    { title: "Assessment", count: 7, people: [candidates[1], candidates[3]] },
    { title: "Interview", count: 4, people: [candidates[0], candidates[2]] },
    { title: "Offer", count: 2, people: [candidates[3]] },
  ];
  return (
    <>
      <PageHeading
        eyebrow="Recruitment pipeline"
        title="From signal to signed."
        copy="AI-ranked candidates for Senior GenAI Engineer · Delhi NCR"
        action={
          <button className="button button-dark" onClick={() => notify("New candidate flow opened")}>
            ＋ Add candidate
          </button>
        }
      />
      <div className="pipeline-toolbar">
        <div className="job-switcher">
          <span>GE</span>
          <p>
            <strong>Senior GenAI Engineer</strong>
            <small>24 candidates · 2 openings</small>
          </p>
          <button>⌄</button>
        </div>
        <div className="pipeline-metrics">
          <span>
            <small>Velocity</small>
            <b>1.8 days/stage</b>
          </span>
          <span>
            <small>Forecast</small>
            <b>2 hires by Aug 08</b>
          </span>
          <button className="button button-outline">⋯</button>
        </div>
      </div>
      <div className="kanban">
        {stages.map((stage, stageIndex) => (
          <section className="kanban-column" key={stage.title}>
            <header>
              <span className={`stage-dot stage-${stageIndex}`} />
              <strong>{stage.title}</strong>
              <b>{stage.count}</b>
              <button>＋</button>
            </header>
            {stage.people.map((candidate, index) => (
              <article className="kanban-card" key={`${stage.title}-${candidate.id}`}>
                <div className="kanban-person">
                  <Avatar candidate={candidate} size="small" />
                  <p>
                    <strong>{candidate.name}</strong>
                    <small>{candidate.role}</small>
                  </p>
                  <b className="match-chip">{candidate.match}%</b>
                </div>
                <div className="kanban-tags">
                  <span>{stageIndex === 0 ? candidate.proof : stageIndex === 1 ? "Assessment ready" : stageIndex === 2 ? "Interview · Today" : "Offer drafted"}</span>
                </div>
                <footer>
                  <span>Talent {candidate.talent}</span>
                  <span>{index === 0 ? "Today" : "2d ago"}</span>
                </footer>
              </article>
            ))}
            <button className="column-action" onClick={() => notify(`Candidate added to ${stage.title}`)}>
              ＋ Add candidate
            </button>
          </section>
        ))}
      </div>
      <div className="pipeline-ai-banner">
        <span>✦</span>
        <div>
          <strong>Pipeline health is strong</strong>
          <p>Move Naina Rao to interview — her assessment score is in the top 4%.</p>
        </div>
        <button onClick={() => notify("Naina moved to Interview")}>Move Naina →</button>
      </div>
    </>
  );
}

function Assessments({ notify, candidateMode = false }: { notify: (message: string) => void; candidateMode?: boolean }) {
  const [interviewing, setInterviewing] = useState(false);
  return (
    <>
      <PageHeading
        eyebrow={candidateMode ? "Skill verification" : "AI assessment studio"}
        title={candidateMode ? "Turn ability into evidence." : "Assess potential, consistently."}
        copy={
          candidateMode
            ? "Complete adaptive assessments and AI interviews to strengthen your verified talent identity."
            : "Coding, project, repository, and conversational assessments — one evidence trail, zero screening chaos."
        }
        action={
          <button className="button button-dark" onClick={() => setInterviewing(true)}>
            {candidateMode ? "Start practice interview" : "＋ Create assessment"}
          </button>
        }
      />
      <section className="assessment-stats">
        {[
          [candidateMode ? "Completed" : "In progress", candidateMode ? "08" : "34", "◈", "violet-wash"],
          [candidateMode ? "Avg. score" : "Completion rate", candidateMode ? "88%" : "87%", "◎", "blue-wash"],
          [candidateMode ? "Strongest area" : "Top performers", candidateMode ? "System design" : "12", "↗", "green-wash"],
          [candidateMode ? "Verified skills" : "Hours saved", candidateMode ? "14" : "86h", "◷", "coral-wash"],
        ].map(([label, value, icon, tone]) => (
          <article key={label}>
            <span className={tone}>{icon}</span>
            <p>
              <small>{label}</small>
              <strong>{value}</strong>
            </p>
          </article>
        ))}
      </section>
      <div className="assessment-grid">
        <article className="panel assessment-list">
          <div className="section-title compact">
            <div>
              <span className="eyebrow">{candidateMode ? "Your verification" : "Active assessments"}</span>
              <h2>{candidateMode ? "Evidence in progress" : "Senior GenAI Engineer"}</h2>
            </div>
            <button className="text-button">View all →</button>
          </div>
          {[
            ["Coding · RAG Pipeline", 92, "Completed", "Top 6%"],
            ["GitHub repository analysis", 88, "Verified", "Strong"],
            ["AI technical interview", 84, candidateMode ? "Completed" : "12 pending", "Good"],
            ["Communication & behavior", 79, candidateMode ? "Improve" : "8 pending", "Fair"],
          ].map(([title, score, status, rating], index) => (
            <div className="assessment-row" key={String(title)}>
              <span className={`assessment-number tone-${index}`}>0{index + 1}</span>
              <div>
                <strong>{title}</strong>
                <small>{status}</small>
              </div>
              <i>
                <b style={{ width: `${score}%` }} />
              </i>
              <span className="assessment-score">{score}</span>
              <b className="rating-pill">{rating}</b>
            </div>
          ))}
        </article>
        <article className="interview-card">
          <div className="interview-visual">
            <div className="ai-face">
              <span>✦</span>
              <i />
            </div>
            <div className="audio-wave">
              {[18, 34, 52, 30, 68, 42, 58, 24, 48, 30].map((height, i) => (
                <i key={i} style={{ height }} />
              ))}
            </div>
          </div>
          <span className="dark-eyebrow">AI interview agent</span>
          <h2>Structured. Adaptive. Human.</h2>
          <p>
            Technical depth, communication, reasoning, and confidence — evaluated
            against the role, not a generic script.
          </p>
          <div className="interview-scores">
            <span><b>91</b> Technical</span>
            <span><b>86</b> Communication</span>
            <span><b>89</b> Confidence</span>
          </div>
          <button onClick={() => setInterviewing(true)}>
            {candidateMode ? "Practice with AI" : "Preview interview"} →
          </button>
        </article>
      </div>
      {interviewing && (
        <div className="interview-overlay" role="dialog" aria-modal="true" aria-label="AI interview">
          <div className="interview-modal">
            <button className="modal-close" onClick={() => setInterviewing(false)} aria-label="Close interview">
              ×
            </button>
            <span className="modal-kicker">AI interview · Question 03 of 08</span>
            <div className="ai-face large"><span>✦</span><i /></div>
            <h2>How would you reduce hallucinations in a production RAG system?</h2>
            <p>Think aloud. I may ask a follow-up based on your approach.</p>
            <div className="recording-status"><i /> Listening · 00:18</div>
            <div className="modal-actions">
              <button className="button button-outline" onClick={() => setInterviewing(false)}>End session</button>
              <button className="button button-dark" onClick={() => { setInterviewing(false); notify("Answer saved · strong retrieval reasoning detected"); }}>Submit answer →</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Hackathons({ notify }: { notify: (message: string) => void }) {
  const ranking = [
    ["01", "VectorShift", "Aarav · Riya · Manas", "Civic AI", 94, "Delhi"],
    ["02", "Prism Labs", "Naina · Aditi · Dev", "Climate Tech", 91, "Bengaluru"],
    ["03", "Null Pointers", "Kabir · Noor · Om", "FinTech", 88, "Gurugram"],
    ["04", "Flowstate", "Ishita · Anay · Tara", "Developer Tools", 86, "Pune"],
  ];
  return (
    <>
      <PageHeading
        eyebrow="Hackathon-to-hiring"
        title="Where builders become hires."
        copy="Turn live performance, teamwork, and innovation into a trusted talent pipeline."
        action={<button className="button button-dark" onClick={() => notify("Hackathon connection flow opened")}>＋ Connect hackathon</button>}
      />
      <section className="hackathon-hero">
        <div>
          <span className="dark-eyebrow">Live event · 1,842 builders</span>
          <h2>Build India AI<br />Challenge 2026</h2>
          <p>Top 8% of performers now available to your talent graph.</p>
          <div className="hackathon-actions">
            <button onClick={() => notify("Top 50 performers added to your shortlist")}>Access top performers ↗</button>
            <span>Ends in 02d : 18h : 42m</span>
          </div>
        </div>
        <div className="event-score">
          <span>Innovation pulse</span>
          <strong>88.4</strong>
          <MiniSparkline points={[30, 55, 40, 76, 52, 82, 70, 95, 86]} />
        </div>
      </section>
      <section className="hackathon-stats">
        {[
          ["Teams analyzed", "428", "+86 today"],
          ["Verified contributors", "1,624", "88.2%"],
          ["Recruiter shortlists", "284", "+42 today"],
          ["Direct interviews", "61", "14 scheduled"],
        ].map(([label, value, note]) => (
          <article key={label}><small>{label}</small><strong>{value}</strong><span>{note}</span></article>
        ))}
      </section>
      <section className="ranking-panel panel">
        <div className="section-title compact">
          <div><span className="eyebrow">AI-evaluated leaderboard</span><h2>Top performing teams</h2></div>
          <div className="leaderboard-legend"><span>Innovation</span><span>Technical</span><span>Teamwork</span></div>
        </div>
        <div className="ranking-table">
          {ranking.map(([rank, team, members, track, score, location], index) => (
            <div className="ranking-row" key={String(team)}>
              <strong className={`rank-number rank-${index}`}>{rank}</strong>
              <div className={`team-mark team-${index}`}>{String(team).slice(0, 1)}</div>
              <p><strong>{team}</strong><small>{members}</small></p>
              <span className="track-tag">{track}</span>
              <span className="ranking-location">⌖ {location}</span>
              <div className="team-score"><b>{score}</b><small>Pitch score</small></div>
              <button onClick={() => notify(`${team} added to your hackathon watchlist`)}>View team →</button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function PitchAnalyzer({ notify }: { notify: (message: string) => void }) {
  const [analyzed, setAnalyzed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  function analyze() {
    setAnalyzing(true);
    window.setTimeout(() => {
      setAnalyzing(false);
      setAnalyzed(true);
      notify("Pitch analysis complete · Overall score 88");
    }, 1250);
  }

  return (
    <>
      <PageHeading
        eyebrow="Presentation intelligence"
        title="Read the idea behind the slides."
        copy="Evaluate clarity, technical depth, innovation, business potential, and content authenticity in minutes."
        action={<span className="secure-badge">⌾ Files are private & encrypted</span>}
      />
      {!analyzed ? (
        <section className="upload-stage">
          <div className="upload-orbit"><span>▱</span><i /><i /><i /></div>
          <span className="eyebrow">PPT · PPTX · PDF · up to 50 MB</span>
          <h2>{analyzing ? "Reading every slide..." : "Drop a pitch deck here"}</h2>
          <p>{analyzing ? "Mapping the narrative, claims, technical architecture, and market evidence." : "We’ll analyze the story, substance, feasibility, and originality."}</p>
          {analyzing ? (
            <div className="analysis-loader"><i /><span>Analyzing slide 12 of 18</span></div>
          ) : (
            <div className="upload-actions">
              <label className="button button-dark">
                Choose a presentation
                <input type="file" accept=".ppt,.pptx,.pdf" onChange={analyze} />
              </label>
              <button className="button button-outline" onClick={analyze}>Analyze sample deck</button>
            </div>
          )}
          <div className="analysis-features">
            <span>✓ 5-dimension scoring</span>
            <span>✓ Plagiarism & AI signals</span>
            <span>✓ Actionable feedback</span>
          </div>
        </section>
      ) : (
        <>
          <section className="pitch-summary">
            <div className="deck-preview">
              <div className="deck-slide">
                <span className="mini-brand">ECOLOOP</span>
                <strong>Waste,<br />reimagined.</strong>
                <small>AI-powered circular logistics</small>
                <i>01</i>
              </div>
              <div className="deck-meta">
                <span>EcoLoop_Seed_Deck.pdf</span><small>18 slides · 8.4 MB</small>
              </div>
            </div>
            <div className="pitch-overview">
              <span className="eyebrow">Analysis complete · 48 seconds</span>
              <h2>Clear problem. Credible tech.<br /><em>Sharpen the business proof.</em></h2>
              <p>
                EcoLoop presents a compelling circular-logistics platform with a
                technically plausible matching engine. The market narrative is strong,
                but unit economics and defensibility need harder evidence.
              </p>
              <div className="authenticity-row">
                <span><b>96%</b> Originality confidence</span>
                <span><b>Low</b> AI-generation risk</span>
                <span><b>0</b> Copied passages</span>
              </div>
            </div>
            <div className="overall-pitch-score">
              <ScoreRing value={88} label="Overall" size="large" tone="violet" />
              <span>Top 12% of decks</span>
              <button onClick={() => notify("Pitch report exported")}>Export report ↗</button>
            </div>
          </section>
          <section className="score-dimensions">
            {[
              ["Innovation", 92, "Original insight"],
              ["Technical feasibility", 89, "Architecture holds"],
              ["Presentation quality", 91, "Clear narrative"],
              ["Business potential", 78, "Needs proof"],
              ["Problem clarity", 94, "Exceptionally clear"],
            ].map(([label, value, note], index) => (
              <article key={String(label)}>
                <span className={`dimension-number dim-${index}`}>0{index + 1}</span>
                <small>{label}</small>
                <strong>{value}</strong>
                <i><b style={{ width: `${value}%` }} /></i>
                <span>{note}</span>
              </article>
            ))}
          </section>
          <div className="pitch-detail-grid">
            <article className="panel feedback-panel">
              <div className="section-title compact">
                <div><span className="eyebrow">AI recommendations</span><h2>Three moves to strengthen the pitch</h2></div>
                <span className="ai-label">✦ Proven AI</span>
              </div>
              {[
                ["Lead with measurable urgency", "Slide 03", "Replace the broad waste statistic with the ₹/day logistics loss for your target customer. It makes the pain immediate."],
                ["Prove the economic loop", "Slide 11", "Add a cohort view of contribution margin after collection density reaches 65%. Investors will test this assumption."],
                ["Make the moat tangible", "Slide 14", "Show how routing data improves matching accuracy over time. Your compounding data advantage is currently buried."],
              ].map(([title, slide, copy], index) => (
                <div className="feedback-item" key={String(title)}>
                  <span>0{index + 1}</span>
                  <div><strong>{title}</strong><small>{slide}</small><p>{copy}</p></div>
                  <button aria-label={`Open ${slide}`}>↗</button>
                </div>
              ))}
            </article>
            <article className="panel narrative-panel">
              <span className="eyebrow">Narrative arc</span>
              <h2>Audience attention</h2>
              <div className="attention-chart">
                {[42, 58, 72, 88, 76, 68, 74, 92, 86, 65, 58, 72, 80, 90, 84, 76, 70, 82].map((h, i) => (
                  <i key={i} style={{ height: `${h}%` }}><b>{i + 1}</b></i>
                ))}
              </div>
              <div className="attention-notes"><span>Strong opening</span><span>Dip at business model</span><span>Confident close</span></div>
            </article>
          </div>
        </>
      )}
    </>
  );
}

function HiringAnalytics() {
  return (
    <>
      <PageHeading
        eyebrow="Predictive hiring analytics"
        title="See what your funnel is saying."
        copy="Quality, velocity, equity, and hiring outcomes — connected to the evidence that created them."
        action={<button className="button button-outline">Last 90 days ⌄</button>}
      />
      <section className="analytics-hero">
        <div>
          <span className="dark-eyebrow">Hiring quality index</span>
          <strong>91.4</strong>
          <span className="big-trend">↑ 6.2 this quarter</span>
          <p>Driven by stronger project-relevance weighting and structured interviews.</p>
        </div>
        <div className="quality-chart">
          {[32, 38, 44, 48, 45, 57, 62, 67, 64, 76, 81, 88].map((point, i) => (
            <i key={i} style={{ height: `${point}%` }}><b /></i>
          ))}
          <span className="chart-label label-start">Apr</span>
          <span className="chart-label label-mid">Jun</span>
          <span className="chart-label label-end">Jul</span>
        </div>
        <div className="forecast-card">
          <span>✦ Forecast</span>
          <strong>17 hires</strong>
          <p>likely to close in the next 30 days</p>
          <small>92% confidence</small>
        </div>
      </section>
      <section className="analytics-grid">
        <article className="panel source-panel">
          <div className="section-title compact"><div><span className="eyebrow">Quality by source</span><h2>Where great hires begin</h2></div><button className="icon-button">⋯</button></div>
          {[
            ["Hackathons", 94, 28, "violet"],
            ["Open source", 91, 24, "blue"],
            ["Communities", 86, 19, "coral"],
            ["Direct applicants", 74, 29, "gray"],
          ].map(([source, quality, share, tone]) => (
            <div className="source-row" key={String(source)}>
              <span className={`source-dot ${tone}`} />
              <strong>{source}</strong>
              <i><b style={{ width: `${quality}%` }} /></i>
              <span><b>{quality}</b> quality</span>
              <small>{share}% hires</small>
            </div>
          ))}
        </article>
        <article className="panel diversity-panel">
          <span className="eyebrow">Talent reach</span>
          <h2>Opportunity footprint</h2>
          <div className="heatmap">
            {Array.from({ length: 63 }, (_, i) => <i key={i} className={`heat-${(i * 7 + i % 5) % 5}`} />)}
          </div>
          <div className="heatmap-stats"><span><b>42</b> campuses</span><span><b>18</b> communities</span><span><b>64%</b> beyond metros</span></div>
        </article>
      </section>
      <section className="analytics-metrics">
        {[
          ["Time to hire", "12.4d", "↓ 31%", "Target 15d"],
          ["Assessment accuracy", "89%", "↑ 7%", "vs. interview"],
          ["Offer acceptance", "84%", "↑ 4%", "Industry 72%"],
          ["First-90d retention", "96%", "↑ 3%", "Cohort 2026"],
        ].map(([label, value, trend, note]) => (
          <article key={label}><span>{label}</span><strong>{value}</strong><b>{trend}</b><small>{note}</small></article>
        ))}
      </section>
    </>
  );
}

function CandidateOverview({
  onNavigate,
  notify,
}: {
  onNavigate: (view: string) => void;
  notify: (message: string) => void;
}) {
  return (
    <>
      <section className="candidate-hero">
        <div className="candidate-identity">
          <div className="large-profile-avatar">AV<span>✓</span></div>
          <div>
            <span className="eyebrow">Verified talent identity</span>
            <h1>Ananya Verma</h1>
            <p>AI Product Engineer · New Delhi, India</p>
            <div className="tag-row">
              <span>Open to work</span><span>2.8 yrs experience</span><span>₹18–24 LPA</span>
            </div>
          </div>
        </div>
        <div className="candidate-hero-actions">
          <button className="button button-outline" onClick={() => onNavigate("resume")}>▤ Build resume</button>
          <button className="button button-dark" onClick={() => notify("Public talent profile copied")}>↗ Share profile</button>
        </div>
      </section>
      <section className="talent-score-hero">
        <div className="score-story">
          <span className="dark-eyebrow">Proven Talent Score™</span>
          <h2>Your evidence is getting stronger.</h2>
          <p>You&apos;re in the <strong>top 8%</strong> of AI product engineers with 2–4 years of experience.</p>
          <div className="score-movement"><span>↑ 4 points</span> in the last 30 days · 3 new verified signals</div>
        </div>
        <ScoreRing value={88} label="Excellent" size="large" />
        <div className="score-factors">
          {[
            ["Coding ability", 91],
            ["Project quality", 94],
            ["Problem solving", 89],
            ["Innovation", 86],
            ["Leadership", 78],
            ["Community", 82],
          ].map(([label, value]) => (
            <div key={String(label)}><span>{label}<b>{value}</b></span><i><b style={{ width: `${value}%` }} /></i></div>
          ))}
        </div>
      </section>
      <section className="candidate-kpis">
        {[
          ["Profile views", "148", "↑ 28% this week", "◎"],
          ["Recruiter saves", "24", "8 new", "♡"],
          ["Job matches", "36", "12 above 90%", "◇"],
          ["Authenticity", "98", "Very low risk", "✓"],
        ].map(([label, value, note, icon], index) => (
          <article key={label}><span className={`kpi-icon kpi-${index}`}>{icon}</span><div><small>{label}</small><strong>{value}</strong><b>{note}</b></div></article>
        ))}
      </section>
      <div className="candidate-main-grid">
        <article className="panel job-match-panel">
          <div className="section-title compact">
            <div><span className="eyebrow">Curated for your evidence</span><h2>Best job matches</h2></div>
            <button className="text-button" onClick={() => onNavigate("opportunities")}>View all 36 →</button>
          </div>
          {[
            ["V", "Vercel Labs", "AI Product Engineer", "Remote · India", 96, "violet"],
            ["R", "Razorpay", "Senior ML Engineer", "Bengaluru · Hybrid", 92, "blue"],
            ["A", "Atlassian", "AI Platform Engineer", "Remote · India", 89, "coral"],
          ].map(([mark, company, role, location, match, tone]) => (
            <div className="job-row" key={String(company)}>
              <span className={`company-mark ${tone}`}>{mark}</span>
              <p><strong>{role}</strong><small>{company} · {location}</small></p>
              <div className="job-reason"><small>Why you match</small><span>Projects · GenAI · Product</span></div>
              <b className="job-match">{match}%</b>
              <button onClick={() => notify(`${company} role saved`)}>♡</button>
            </div>
          ))}
        </article>
        <article className="panel roadmap-preview">
          <span className="eyebrow">Next best move</span>
          <h2>Move toward<br />AI Tech Lead</h2>
          <div className="roadmap-progress"><i><b style={{ width: "68%" }} /></i><span>68% role-ready</span></div>
          <div className="next-skill"><span>01</span><p><small>Highest-impact skill gap</small><strong>Production LLMOps</strong><b>+6 score potential</b></p></div>
          <div className="next-skill"><span>02</span><p><small>Leadership signal</small><strong>Mentor one OSS project</strong><b>+4 score potential</b></p></div>
          <button onClick={() => onNavigate("roadmap")}>Open my roadmap →</button>
        </article>
      </div>
      <section className="evidence-strip">
        <div><span className="eyebrow">Fresh evidence</span><h2>Your activity, translated.</h2></div>
        {[
          ["GH", "Merged PR #284", "LangChain community · +2 coding"],
          ["⚑", "Top 10 · HackNCR", "Multimodal accessibility · +3 innovation"],
          ["✓", "AWS ML Specialty", "Credential verified · +2 consistency"],
        ].map(([icon, title, copy]) => (
          <article key={String(title)}><span>{icon}</span><p><strong>{title}</strong><small>{copy}</small></p></article>
        ))}
      </section>
    </>
  );
}

function TalentIdentity() {
  return (
    <>
      <PageHeading
        eyebrow="AI talent profile engine"
        title="Your work, made legible."
        copy="A living identity built from verified projects, code, credentials, communities, and performance."
        action={<button className="button button-dark">↗ Share verified profile</button>}
      />
      <div className="identity-layout">
        <aside className="profile-card panel">
          <div className="large-profile-avatar">AV<span>✓</span></div>
          <h2>Ananya Verma</h2><p>AI Product Engineer</p><span>New Delhi · India</span>
          <div className="profile-score-row"><ScoreRing value={88} size="medium" /><div><strong>Excellent</strong><small>Top 8% in cohort</small></div></div>
          <div className="profile-links"><button>GH GitHub connected <b>✓</b></button><button>in LinkedIn verified <b>✓</b></button><button>▤ Resume analyzed <b>✓</b></button></div>
          <div className="auth-score"><span>Authenticity score</span><strong>98/100</strong><small>Very low fraud risk</small></div>
        </aside>
        <main className="identity-main">
          <section className="panel skill-evidence-panel">
            <div className="section-title compact"><div><span className="eyebrow">Verified skill graph</span><h2>Capabilities with receipts</h2></div><button className="text-button">View graph →</button></div>
            <div className="skill-cloud">
              {[
                ["Generative AI", 94, "Expert", "violet"],
                ["Python", 92, "Expert", "blue"],
                ["Product thinking", 89, "Advanced", "coral"],
                ["RAG systems", 88, "Advanced", "green"],
                ["React", 84, "Advanced", "yellow"],
                ["MLOps", 76, "Proficient", "gray"],
              ].map(([skill, score, level, tone]) => (
                <article className={`skill-tile ${tone}`} key={String(skill)}><span>{score}</span><div><strong>{skill}</strong><small>✓ {level} · Verified</small></div></article>
              ))}
            </div>
          </section>
          <section className="panel project-evidence">
            <div className="section-title compact"><div><span className="eyebrow">Signature work</span><h2>Projects that prove it</h2></div><button className="text-button">＋ Add project</button></div>
            {[
              ["01", "A11y Lens", "Multimodal AI assistant for visually impaired commuters.", ["GenAI", "Vision", "React"], "94", "HackNCR top 10"],
              ["02", "Tracebench", "Open-source evaluation suite for production RAG systems.", ["Python", "RAG", "OSS"], "91", "428 GitHub stars"],
              ["03", "CarbonRoute", "ML optimization for low-emission last-mile delivery.", ["ML", "Maps", "Product"], "86", "2 pilot partners"],
            ].map(([num, title, copy, tags, score, proof]) => (
              <article key={String(title)}><span className="project-num">{num}</span><div><strong>{title}</strong><p>{copy}</p><div className="tag-row">{(tags as string[]).map(tag => <span key={tag}>{tag}</span>)}</div></div><div className="project-proof"><b>{score}</b><small>Quality score</small><span>⚡ {proof}</span></div></article>
            ))}
          </section>
        </main>
      </div>
    </>
  );
}

function Opportunities({ notify }: { notify: (message: string) => void }) {
  return (
    <>
      <PageHeading eyebrow="AI job matching" title="Roles that fit the real you." copy="Matches ranked by verified capability, relevant projects, growth potential, and work preferences." action={<button className="button button-outline">Tune preferences</button>} />
      <div className="opportunity-banner"><span>✦</span><p><strong>Your market is moving.</strong> GenAI product roles matching your profile are up 18% this month. Your estimated range is <b>₹19–26 LPA</b>.</p><button>View salary insight →</button></div>
      <div className="opportunity-layout">
        <div className="opportunity-list">
          {[
            ["V", "AI Product Engineer", "Vercel Labs", "Remote · India", 96, "₹22–28 LPA", "Applied by 18", "violet"],
            ["R", "Senior ML Engineer", "Razorpay", "Bengaluru · Hybrid", 92, "₹24–30 LPA", "Actively hiring", "blue"],
            ["A", "AI Platform Engineer", "Atlassian", "Remote · India", 89, "₹20–27 LPA", "Posted 2d ago", "coral"],
            ["C", "GenAI Solutions Engineer", "CRED", "Bengaluru · On-site", 87, "₹22–26 LPA", "Team viewed profile", "green"],
          ].map(([mark, role, company, location, match, salary, status, tone]) => (
            <article className="opportunity-card" key={String(company)}>
              <span className={`company-mark large ${tone}`}>{mark}</span>
              <div className="opportunity-info"><span className="job-status">{status}</span><h2>{role}</h2><p>{company} · {location}</p><div className="tag-row"><span>Full-time</span><span>{salary}</span><span>2–5 yrs</span></div><div className="why-match"><span>✦</span><p><strong>Your strongest edge</strong><small>Your Tracebench project is highly relevant to their LLM evaluation roadmap.</small></p></div></div>
              <div className="opportunity-score"><ScoreRing value={Number(match)} size="medium" /><strong>{match}% match</strong><span>Skills 97 · Projects 98</span><button className="button button-dark" onClick={() => notify(`Application prepared for ${company}`)}>Prepare application</button><button className="text-button" onClick={() => notify(`${company} role saved`)}>♡ Save for later</button></div>
            </article>
          ))}
        </div>
        <aside className="match-breakdown panel"><span className="eyebrow">Your match profile</span><h2>What recruiters see</h2>{[["Technical fit", 93],["Project relevance", 96],["Growth trajectory", 88],["Culture signals", 84],["Location & salary", 91]].map(([label, value]) => <div key={String(label)}><span>{label}<b>{value}%</b></span><i><b style={{ width: `${value}%` }} /></i></div>)}<button onClick={() => notify("Profile optimization tips opened")}>Improve my matches →</button></aside>
      </div>
    </>
  );
}

function CareerRoadmap({ notify }: { notify: (message: string) => void }) {
  return (
    <>
      <PageHeading eyebrow="AI career guidance" title="Your next chapter, mapped." copy="A practical path from AI Product Engineer to AI Tech Lead — personalized to your evidence and market demand." action={<button className="button button-outline">AI Tech Lead ⌄</button>} />
      <section className="roadmap-hero">
        <div><span className="dark-eyebrow">Target role readiness</span><strong>68%</strong><p>You&apos;re <b>2–3 focused milestones</b> away from being a strong AI Tech Lead candidate.</p></div>
        <div className="readiness-arc"><ScoreRing value={68} label="Role-ready" size="large" tone="coral" /></div>
        <div className="salary-forecast"><span>Predicted salary</span><strong>₹28–36 LPA</strong><small>+42% from current estimate</small><MiniSparkline points={[24, 32, 38, 48, 54, 66, 78, 91]} /></div>
      </section>
      <section className="roadmap-timeline">
        {[
          ["Now", "Strengthen production LLMOps", "Complete the LLM systems observability path and ship monitoring to Tracebench.", "6–8 weeks", "In progress", 62],
          ["Next", "Prove technical leadership", "Mentor two contributors and lead an architecture RFC in an active open-source project.", "8–12 weeks", "Recommended", 0],
          ["Then", "Own a measurable product outcome", "Lead one AI feature from discovery to launch and document adoption, reliability, and revenue impact.", "3–4 months", "High impact", 0],
          ["Target", "AI Tech Lead ready", "Expected readiness: 91% · projected by February 2027.", "6–8 months", "Milestone", 0],
        ].map(([phase, title, copy, time, status, progress], index) => (
          <article className={`roadmap-step step-${index}`} key={String(phase)}>
            <div className="timeline-marker"><span>{index + 1}</span><i /></div>
            <div className="step-card"><span className="phase-label">{phase}</span><h2>{title}</h2><p>{copy}</p><div className="step-meta"><span>◷ {time}</span><b>{status}</b></div>{Number(progress) > 0 && <div className="step-progress"><i><b style={{ width: `${progress}%` }} /></i><span>{progress}%</span></div>}{index < 3 && <button onClick={() => notify(`${title} added to your plan`)}>{index === 0 ? "Continue learning" : "Add to my plan"} →</button>}</div>
            {index < 3 && <aside><span className="eyebrow">{index === 0 ? "Recommended learning" : index === 1 ? "Proof to collect" : "Success measure"}</span><strong>{index === 0 ? "DeepLearning.AI · LLMOps" : index === 1 ? "Merged RFC + mentor feedback" : "Launch metrics + case study"}</strong><small>{index === 0 ? "4.8 ★ · 12 hours · Certificate" : index === 1 ? "+4 Leadership score potential" : "+7 Project quality potential"}</small></aside>}
          </article>
        ))}
      </section>
    </>
  );
}

function ResumeStudio({ notify }: { notify: (message: string) => void }) {
  const [targeted, setTargeted] = useState(false);
  return (
    <>
      <PageHeading eyebrow="AI resume & portfolio builder" title="Make every application count." copy="Turn your verified evidence into ATS-ready resumes, tailored cover letters, and a dynamic portfolio." action={<button className="button button-dark" onClick={() => notify("New application kit created")}>＋ New application kit</button>} />
      <section className="studio-grid">
        <article className="resume-preview panel">
          <div className="resume-toolbar"><span>AI_Product_Engineer_Ananya.pdf</span><div><button>−</button><b>85%</b><button>＋</button></div></div>
          <div className="resume-sheet">
            <header><div><h2>Ananya Verma</h2><p>AI Product Engineer</p></div><span>New Delhi · ananya.dev<br />github.com/ananyav</span></header>
            <section><h3>PROFESSIONAL SUMMARY</h3><p>AI product engineer building reliable GenAI experiences, with verified expertise in RAG systems, evaluation, and user-centered product delivery.</p></section>
            <section><h3>EXPERIENCE</h3><div className="resume-line"><strong>AI Product Engineer · Lime Labs</strong><span>2024–Present</span></div><p>Led a retrieval-quality initiative that improved grounded-answer precision by 23% across 1.8M monthly queries.</p></section>
            <section><h3>SIGNATURE PROJECTS</h3><div className="resume-line"><strong>Tracebench · Open-source RAG evaluation</strong><span>428 ★</span></div><p>Created a production evaluation suite used by 16 engineering teams; authored core scoring and observability modules.</p></section>
            <section><h3>VERIFIED SKILLS</h3><p>Generative AI · Python · RAG Systems · Product Strategy · React · MLOps</p></section>
          </div>
        </article>
        <aside className="studio-controls">
          <article className="ats-score-card"><div><span className="dark-eyebrow">ATS strength</span><strong>{targeted ? 96 : 88}</strong><small>{targeted ? "Excellent for target role" : "Strong baseline resume"}</small></div><ScoreRing value={targeted ? 96 : 88} size="medium" /></article>
          <article className="panel optimize-card"><span className="eyebrow">Company-specific optimization</span><h2>Target a role</h2><label htmlFor="job-description">Paste a job description</label><textarea id="job-description" placeholder="Paste the role here and Proven will tailor your evidence..." /><button className="button button-dark" onClick={() => { setTargeted(true); notify("Resume optimized for target role · ATS score 96"); }}>✦ Optimize with AI</button>{targeted && <div className="optimization-result"><span>✓ 7 evidence points strengthened</span><span>✓ 5 role keywords added naturally</span><span>✓ Summary rewritten for impact</span></div>}</article>
          <article className="builder-actions panel">{[["▤","Cover letter","Tailored to role & company"],["↗","Portfolio website","Live, dynamic, evidence-backed"],["◎","LinkedIn summary","Optimized for discovery"]].map(([icon,title,copy]) => <button key={title} onClick={() => notify(`${title} draft generated`)}><span>{icon}</span><p><strong>{title}</strong><small>{copy}</small></p><b>→</b></button>)}</article>
        </aside>
      </section>
    </>
  );
}

function CandidateModal({
  candidate,
  onClose,
  notify,
}: {
  candidate: Candidate;
  onClose: () => void;
  notify: (message: string) => void;
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`${candidate.name} verified profile`}>
      <div className="candidate-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close profile">×</button>
        <header>
          <Avatar candidate={candidate} size="large" />
          <div><span className="verified-line">✓ Identity & evidence verified</span><h2>{candidate.name}</h2><p>{candidate.role} · {candidate.location}</p><div className="tag-row">{candidate.skills.map(skill => <span key={skill}>{skill}</span>)}</div></div>
          <div className="modal-match"><ScoreRing value={candidate.match} size="medium" /><strong>{candidate.match}% role match</strong></div>
        </header>
        <section className="modal-score-section">
          <div><span className="eyebrow">Proven Talent Score™</span><strong className="huge-score">{candidate.talent}</strong><small>Top 7% of comparable talent</small></div>
          <div className="modal-skill-bars">{[["Coding ability",94],["Project quality",92],["Problem solving",89],["Innovation",91],["Leadership",78],["Consistency",87]].map(([label,value]) => <div key={String(label)}><span>{label}<b>{value}</b></span><i><b style={{ width: `${value}%` }} /></i></div>)}</div>
        </section>
        <section className="modal-evidence">
          <div className="modal-section-title"><span className="eyebrow">Why this candidate stands out</span><h3>Evidence, not claims.</h3></div>
          <div className="modal-evidence-grid">
            <article><span>⚑</span><small>Hackathon signal</small><strong>{candidate.proof}</strong><p>Top-ranked for innovation and technical feasibility.</p></article>
            <article><span>GH</span><small>Open-source signal</small><strong>{candidate.activity}</strong><p>Consistent, reviewed contributions across 14 months.</p></article>
            <article><span>✓</span><small>Trust signal</small><strong>{candidate.authenticity}/100 authenticity</strong><p>No duplicate, plagiarism, or credential risk detected.</p></article>
          </div>
        </section>
        <footer><button className="button button-outline" onClick={() => notify(`${candidate.name}'s report exported`)}>Export evidence report</button><button className="button button-dark" onClick={() => { notify(`${candidate.name} moved to interview`); onClose(); }}>Move to interview →</button></footer>
      </div>
    </div>
  );
}

export default function Home() {
  const [role, setRole] = useState<Role>("recruiter");
  const [view, setView] = useState("overview");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [saved, setSaved] = useState<number[]>([2]);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  const nav = role === "recruiter" ? recruiterNav : candidateNav;
  const title = useMemo(() => nav.find((item) => item[0] === view)?.[2] || "Overview", [nav, view]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  function changeRole(nextRole: Role) {
    setRole(nextRole);
    setView("overview");
    setMobileNav(false);
  }

  function navigate(nextView: string) {
    setView(nextView);
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function runSearch(query: string) {
    setSearchQuery(query);
    navigate("discover");
  }

  function toggleSaved(id: number) {
    setSaved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    notify(saved.includes(id) ? "Removed from shortlist" : "Added to shortlist");
  }

  function renderView() {
    if (role === "candidate") {
      switch (view) {
        case "profile": return <TalentIdentity />;
        case "opportunities": return <Opportunities notify={notify} />;
        case "roadmap": return <CareerRoadmap notify={notify} />;
        case "resume": return <ResumeStudio notify={notify} />;
        case "assessments": return <Assessments notify={notify} candidateMode />;
        default: return <CandidateOverview onNavigate={navigate} notify={notify} />;
      }
    }
    switch (view) {
      case "discover": return <TalentDiscovery initialQuery={searchQuery} onCandidate={setSelectedCandidate} saved={saved} toggleSaved={toggleSaved} notify={notify} />;
      case "pipeline": return <HiringPipeline notify={notify} />;
      case "assessments": return <Assessments notify={notify} />;
      case "hackathons": return <Hackathons notify={notify} />;
      case "pitch": return <PitchAnalyzer notify={notify} />;
      case "analytics": return <HiringAnalytics />;
      default: return <RecruiterOverview onNavigate={navigate} onCandidate={setSelectedCandidate} onSearch={runSearch} saved={saved} toggleSaved={toggleSaved} />;
    }
  }

  return (
    <div className={`app-shell role-${role}`}>
      <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
        <div className="brand" onClick={() => navigate("overview")} role="button" tabIndex={0}>
          <span className="brand-mark">P<span>•</span></span>
          <div><strong>PROVEN</strong><small>Talent intelligence</small></div>
        </div>
        <div className="workspace-switcher">
          <button className={role === "recruiter" ? "active" : ""} onClick={() => changeRole("recruiter")}>Recruiter</button>
          <button className={role === "candidate" ? "active" : ""} onClick={() => changeRole("candidate")}>Candidate</button>
        </div>
        <nav aria-label={`${role} navigation`}>
          <span className="nav-label">{role === "recruiter" ? "Workspace" : "My career"}</span>
          {nav.map(([id, icon, label]) => (
            <button key={id} className={view === id ? "active" : ""} onClick={() => navigate(id)}>
              <span>{icon}</span>{label}
              {id === "discover" && role === "recruiter" && <b>238</b>}
              {id === "opportunities" && role === "candidate" && <b>36</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="trust-mini"><span>✓</span><p><strong>Trust engine active</strong><small>12,480 profiles monitored</small></p></div>
          <button><span>?</span> Help & resources</button>
          <button><span>⚙</span> Settings</button>
          <div className="user-mini">
            <span className={role === "recruiter" ? "avatar-arjun" : "avatar-ananya"}>{role === "recruiter" ? "AK" : "AV"}</span>
            <p><strong>{role === "recruiter" ? "Arjun Khanna" : "Ananya Verma"}</strong><small>{role === "recruiter" ? "Nexora Labs" : "AI Product Engineer"}</small></p>
            <button aria-label="User menu">⋯</button>
          </div>
        </div>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle navigation">☰</button>
          <div className="breadcrumb"><span>Proven</span><b>/</b><strong>{title}</strong></div>
          <button className="global-search" onClick={() => role === "recruiter" ? navigate("discover") : navigate("opportunities")}>
            <span>⌕</span><span>{role === "recruiter" ? "Ask Proven or search talent..." : "Search jobs, skills, or companies..."}</span><kbd>⌘ K</kbd>
          </button>
          <div className="top-actions">
            <span className="system-status"><i /> All systems live</span>
            <button aria-label="Notifications">♢<b>3</b></button>
            <button aria-label="Open AI copilot" className="spark-button" onClick={() => role === "recruiter" ? navigate("discover") : navigate("roadmap")}>✦</button>
          </div>
        </header>
        <div className="page-content">{renderView()}</div>
      </main>
      {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}
      {selectedCandidate && <CandidateModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} notify={notify} />}
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </div>
  );
}
