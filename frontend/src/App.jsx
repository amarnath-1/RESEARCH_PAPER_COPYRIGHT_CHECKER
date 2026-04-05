import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = '/api';

// ── Token helpers ─────────────────────────────────────────────────────────────
const getToken  = () => localStorage.getItem('argads_token');
const setToken  = (t) => localStorage.setItem('argads_token', t);
const clearToken= () => localStorage.removeItem('argads_token');
const authHdr   = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

// ── Colour helpers ────────────────────────────────────────────────────────────
function verdictColor(level) {
  return { critical:'var(--red)', high:'var(--orange)', medium:'var(--yellow)', clean:'var(--green)' }[level] || 'var(--cyan)';
}
function verdictBg(level) {
  return { critical:'rgba(255,45,85,0.08)', high:'rgba(255,149,0,0.08)', medium:'rgba(255,214,10,0.08)', clean:'rgba(52,199,89,0.08)' }[level] || 'rgba(0,212,255,0.08)';
}
function verdictIcon(level) {
  return { critical:'🚨', high:'⚠️', medium:'🔎', clean:'✅' }[level] || '📄';
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH PAGES — LOGIN / REGISTER
// ═══════════════════════════════════════════════════════════════════════════════

function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ researcher_id:'', name:'', email:'', password:'', department:'Computer Science Engineering' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [particles] = useState(() => Array.from({length:30}, (_,i) => ({
    id:i, x:Math.random()*100, y:Math.random()*100,
    size: Math.random()*3+1, speed: Math.random()*0.5+0.2,
    opacity: Math.random()*0.5+0.1,
  })));

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload  = mode === 'login' ? { email: form.email, password: form.password } : form;
      const { data } = await axios.post(API + endpoint, payload);
      if (data.success) { setToken(data.token); onAuth(data.user); }
      else setError(data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Connection error. Is the backend running?');
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-root">
      <div className="auth-bg">
        {particles.map(p => (
          <div key={p.id} className="particle" style={{
            left:`${p.x}%`, top:`${p.y}%`,
            width:`${p.size}px`, height:`${p.size}px`,
            opacity: p.opacity,
            animationDuration: `${8/p.speed}s`,
            animationDelay: `${p.id*0.3}s`,
          }}/>
        ))}
        <div className="auth-grid-overlay"/>
      </div>

      <div className="auth-center">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-logo">
            <div className="logo-hex">
              <span>Ω</span>
            </div>
          </div>
          <h1 className="auth-title">ARGADS</h1>
          <p className="auth-tagline">Academic Research Ghost-Authorship Detection System</p>
          <p className="auth-sub">VIT Chennai · BCSE302L Database Systems · DA3</p>
        </div>

        {/* Card */}
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={`auth-tab ${mode==='login'?'active':''}`} onClick={()=>{setMode('login');setError('');}}>
              Sign In
            </button>
            <button className={`auth-tab ${mode==='register'?'active':''}`} onClick={()=>{setMode('register');setError('');}}>
              Register
            </button>
            <div className="auth-tab-indicator" style={{left: mode==='login'?'4px':'calc(50% + 4px)'}}/>
          </div>

          <form onSubmit={submit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}

            {mode === 'register' && (
              <>
                <div className="auth-field">
                  <label>Researcher ID</label>
                  <input placeholder="e.g. 24BCE1234" value={form.researcher_id} onChange={set('researcher_id')} required/>
                </div>
                <div className="auth-field">
                  <label>Full Name</label>
                  <input placeholder="Your full name" value={form.name} onChange={set('name')} required/>
                </div>
                <div className="auth-field">
                  <label>Department</label>
                  <select value={form.department} onChange={set('department')}>
                    <option>Computer Science Engineering</option>
                    <option>Electronics and Communication</option>
                    <option>Information Technology</option>
                    <option>Mechanical Engineering</option>
                    <option>Biomedical Engineering</option>
                    <option>Data Science</option>
                  </select>
                </div>
              </>
            )}

            <div className="auth-field">
              <label>Email Address</label>
              <input type="email" placeholder="your@vit.ac.in" value={form.email} onChange={set('email')} required/>
            </div>

            <div className="auth-field">
              <label>Password</label>
              <div className="pass-wrap">
                <input type={showPass?'text':'password'} placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required minLength={6}/>
                <button type="button" className="pass-toggle" onClick={()=>setShowPass(v=>!v)}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <span className="spin-sm"/> : mode==='login' ? '→ Sign In' : '→ Create Account'}
            </button>
          </form>

          <p className="auth-switch">
            {mode==='login' ? "New to ARGADS? " : "Already registered? "}
            <button onClick={()=>{setMode(mode==='login'?'register':'login');setError('');}}>
              {mode==='login'?'Create account':'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

function Dashboard({ user }) {
  const [scans, setScans] = useState([]);

  useEffect(() => {
    axios.get(API+'/scans', authHdr()).then(r => setScans(r.data.scans||[])).catch(()=>{});
  }, []);

  const stats = [
    { label:'Total Scans', value: user.total_scans, accent:'var(--cyan)' },
    { label:'Flagged Papers', value: scans.filter(s=>s.overall_verdict?.level!=='clean').length, accent:'var(--orange)' },
    { label:'Clean Scans', value: scans.filter(s=>s.overall_verdict?.level==='clean').length, accent:'var(--green)' },
    { label:'Researcher ID', value: user.researcher_id, accent:'var(--purple)', small:true },
  ];

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1>Welcome back, {user.name.split(' ')[0]}</h1>
        <p className="page-sub">{user.researcher_id} · {user.department} · VIT Chennai</p>
      </div>

      <div className="stat-row">
        {stats.map(s => (
          <div key={s.label} className="stat-box" style={{'--acc':s.accent}}>
            <div className="stat-val" style={{fontSize:s.small?'1.1rem':'2rem'}}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-hdr"><span className="panel-title">⏱ Recent Scan History</span></div>
        <div>
          {scans.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔬</div>
              <p>No scans yet. Run your first detection scan!</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Paper Title</th>
                  <th>Top Match</th>
                  <th>Score</th>
                  <th>Verdict</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {scans.slice(0,10).map(s => (
                  <tr key={s.id}>
                    <td style={{maxWidth:'240px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.paper_title}</td>
                    <td style={{maxWidth:'200px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:'0.78rem',color:'var(--text-muted)'}}>{s.top_match_paper}</td>
                    <td><span style={{fontFamily:'JetBrains Mono',color:'var(--cyan)',fontSize:'0.9rem'}}>{s.top_match_score}%</span></td>
                    <td>
                      <span className={`badge badge-${s.overall_verdict?.level||'clean'}`}>
                        {verdictIcon(s.overall_verdict?.level)} {s.overall_verdict?.label||'CLEAN'}
                      </span>
                    </td>
                    <td style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{new Date(s.submitted_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-hdr"><span className="panel-title">⚙ Algorithm Reference</span></div>
        <div className="panel-body">
          <div className="algo-grid">
            {[
              {name:'StyleBERT',weight:'35%',desc:'TF-IDF cosine similarity — detects writing style overlap at the word frequency level.',color:'var(--cyan)'},
              {name:'GPTRadar',weight:'25%',desc:'Bigram + trigram phrase matching — identifies copied sentence fragments and phrases.',color:'var(--purple)'},
              {name:'AuthorNet',weight:'20%',desc:'Keyword network + title-topic overlap — checks thematic and topical similarity.',color:'var(--orange)'},
              {name:'CoAuthorGraph',weight:'20%',desc:'Jaccard token set similarity — measures exact vocabulary overlap between texts.',color:'var(--green)'},
            ].map(a => (
              <div key={a.name} className="algo-card" style={{'--acc':a.color}}>
                <div className="algo-card-top">
                  <span className="algo-card-name">{a.name}</span>
                  <span className="algo-card-weight">{a.weight}</span>
                </div>
                <p className="algo-card-desc">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETECTION PAGE
// ═══════════════════════════════════════════════════════════════════════════════

function DetectionPage({ user }) {
  const [form, setForm] = useState({ paper_title:'', keywords:'', research_text:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const resultRef = useRef(null);

  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const wordCount = form.research_text.trim().split(/\s+/).filter(Boolean).length;

  async function runScan(e) {
    e.preventDefault();
    setError(''); setLoading(true); setResult(null); setShowAll(false);
    try {
      const { data } = await axios.post(API+'/detect', form, authHdr());
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 100);
    } catch (err) {
      setError(err.response?.data?.message || 'Detection failed. Is the backend running?');
    } finally { setLoading(false); }
  }

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1>🔍 Detection Scan</h1>
        <p className="page-sub">Submit your research text to check against 50 published papers in the database</p>
      </div>

      <div className="panel">
        <div className="panel-hdr">
          <span className="panel-title">📋 Submission Form</span>
          <span className="info-chip">Researcher: {user.researcher_id} — {user.name}</span>
        </div>
        <div className="panel-body">
          <form onSubmit={runScan}>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-field">
              <label>Paper Title <span className="req">*</span></label>
              <input className="finput" placeholder="Enter the full title of your research paper" value={form.paper_title} onChange={set('paper_title')} required/>
            </div>

            <div className="form-field">
              <label>Keywords <span className="opt">(optional — comma separated)</span></label>
              <input className="finput" placeholder="e.g. deep learning, NLP, computer vision" value={form.keywords} onChange={set('keywords')}/>
            </div>

            <div className="form-field">
              <label>Research Abstract / Text <span className="req">*</span> — min. 20 words</label>
              <textarea
                className="ftextarea"
                rows={8}
                placeholder="Paste your research abstract or paper text here..."
                value={form.research_text}
                onChange={set('research_text')}
                required
              />
              <div className={`word-count ${wordCount < 20 ? 'low' : 'ok'}`}>
                {wordCount} words {wordCount < 20 ? `— need ${20-wordCount} more` : '✓'}
              </div>
            </div>

            <button type="submit" className="btn-scan" disabled={loading || wordCount < 20}>
              {loading ? (
                <><span className="spin-sm"/> Analysing against 50 papers...</>
              ) : (
                '⚡ Run Copyright Detection Scan'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* RESULTS */}
      {result && (
        <div ref={resultRef} className="fade-in">
          {/* Verdict banner */}
          <div className="verdict-banner" style={{
            '--vc': verdictColor(result.summary.overall_verdict?.level),
            '--vb': verdictBg(result.summary.overall_verdict?.level),
            borderColor: verdictColor(result.summary.overall_verdict?.level),
            background: verdictBg(result.summary.overall_verdict?.level),
          }}>
            <div className="verdict-icon">{verdictIcon(result.summary.overall_verdict?.level)}</div>
            <div>
              <div className="verdict-label">{result.summary.overall_verdict?.label}</div>
              <div className="verdict-score">{result.summary.top_match_score}<span className="verdict-pct">%</span></div>
              <div className="verdict-sub">Highest match: {result.summary.top_match_paper}</div>
              <div className="verdict-meta">
                Checked {result.summary.total_papers_checked} papers · {result.summary.similar_papers_found} with &gt;25% similarity
              </div>
            </div>
          </div>

          {/* Flagged matches */}
          {result.flagged_results.length > 0 && (
            <div className="panel">
              <div className="panel-hdr">
                <span className="panel-title">🚩 Significant Matches ({result.flagged_results.length})</span>
              </div>
              <div className="panel-body">
                {result.flagged_results.map((r,i) => (
                  <MatchCard key={i} r={r} rank={i+1}/>
                ))}
              </div>
            </div>
          )}

          {/* Full results table */}
          <div className="panel">
            <div className="panel-hdr">
              <span className="panel-title">📊 All Papers — Sorted by Similarity</span>
              <button className="btn-ghost" onClick={()=>setShowAll(v=>!v)}>
                {showAll ? 'Show Top 10' : 'Show All 50'}
              </button>
            </div>
            <div style={{overflowX:'auto'}}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Research ID</th>
                    <th>Paper Title</th>
                    <th>StyleBERT</th>
                    <th>GPTRadar</th>
                    <th>AuthorNet</th>
                    <th>CoAuthorGraph</th>
                    <th>Total</th>
                    <th>Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAll ? result.results : result.results.slice(0,10)).map((r,i) => (
                    <tr key={i}>
                      <td style={{color:'var(--text-muted)',fontFamily:'JetBrains Mono'}}>{i+1}</td>
                      <td><span className="id-chip">{r.matched_paper.research_id}</span></td>
                      <td style={{maxWidth:'200px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={r.matched_paper.paper_title}>{r.matched_paper.paper_title}</td>
                      <td><ScoreCell v={r.algorithm_scores.StyleBERT}/></td>
                      <td><ScoreCell v={r.algorithm_scores.GPTRadar}/></td>
                      <td><ScoreCell v={r.algorithm_scores.AuthorNet}/></td>
                      <td><ScoreCell v={r.algorithm_scores.CoAuthorGraph}/></td>
                      <td><strong style={{fontFamily:'JetBrains Mono',color: r.weighted_score>=50?'var(--orange)': r.weighted_score>=25?'var(--yellow)':'var(--text-secondary)'}}>{r.weighted_score}%</strong></td>
                      <td><span className={`badge badge-${r.verdict.level}`}>{r.verdict.label}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreCell({ v }) {
  const c = v>=50?'var(--red)':v>=25?'var(--yellow)':'var(--text-muted)';
  return <span style={{fontFamily:'JetBrains Mono',fontSize:'0.82rem',color:c}}>{v}%</span>;
}

function MatchCard({ r, rank }) {
  const [open, setOpen] = useState(rank===1);
  return (
    <div className="match-card">
      <div className="match-hdr" onClick={()=>setOpen(v=>!v)} style={{cursor:'pointer'}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'0.35rem'}}>
            <span className="rank-badge">#{rank}</span>
            <span className="id-chip">{r.matched_paper.research_id}</span>
            <span className={`badge badge-${r.verdict.level}`}>{r.verdict.label}</span>
          </div>
          <div className="match-title">{r.matched_paper.paper_title}</div>
          <div className="match-meta">{r.matched_paper.author} · {r.matched_paper.journal} · {r.matched_paper.year}</div>
          <div style={{marginTop:'0.3rem',display:'flex',flexWrap:'wrap',gap:'0.25rem'}}>
            {r.matched_paper.keywords.map(k=><span key={k} className="kw-chip">{k}</span>)}
          </div>
        </div>
        <div style={{textAlign:'right',flexShrink:0}}>
          <div style={{fontFamily:'JetBrains Mono',fontSize:'2rem',fontWeight:700,color:verdictColor(r.verdict.level),lineHeight:1}}>{r.weighted_score}%</div>
          <div style={{fontSize:'0.7rem',color:'var(--text-muted)',marginTop:'0.2rem'}}>WEIGHTED TOTAL</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.7rem',color:'var(--text-muted)'}}>{open?'▲ collapse':'▼ expand'}</div>
        </div>
      </div>

      {open && (
        <div className="match-body fade-in">
          {[
            ['StyleBERT','35%',r.algorithm_scores.StyleBERT,'TF-IDF cosine','var(--cyan)'],
            ['GPTRadar','25%',r.algorithm_scores.GPTRadar,'N-gram matching','var(--purple)'],
            ['AuthorNet','20%',r.algorithm_scores.AuthorNet,'Keyword network','var(--orange)'],
            ['CoAuthorGraph','20%',r.algorithm_scores.CoAuthorGraph,'Jaccard similarity','var(--green)'],
          ].map(([name,wt,val,desc,col])=>(
            <div key={name} className="algo-row">
              <div style={{minWidth:'130px'}}>
                <span style={{fontFamily:'JetBrains Mono',fontSize:'0.75rem',color:col}}>{name}</span>
                <span style={{fontSize:'0.65rem',color:'var(--text-muted)',marginLeft:'0.5rem'}}>({wt})</span>
              </div>
              <div className="pbar-wrap">
                <div className="pbar-fill" style={{width:`${val}%`,background:col}}/>
              </div>
              <span style={{fontFamily:'JetBrains Mono',fontSize:'0.8rem',fontWeight:700,minWidth:'48px',textAlign:'right',color:col}}>{val}%</span>
              <span style={{fontSize:'0.68rem',color:'var(--text-muted)',minWidth:'130px'}}>{desc}</span>
            </div>
          ))}
          <div className="weighted-total-row" style={{'--vc':verdictColor(r.verdict.level)}}>
            <span>Weighted Total Score</span>
            <span style={{fontFamily:'JetBrains Mono',fontSize:'1.2rem',fontWeight:900,color:verdictColor(r.verdict.level)}}>{r.weighted_score}%</span>
          </div>
          <div className="formula-box">
            <span style={{color:'var(--text-muted)'}}>Formula: </span>
            <span style={{color:'var(--cyan)'}}>
              ({r.algorithm_scores.StyleBERT}% × 35%) + ({r.algorithm_scores.GPTRadar}% × 25%) + ({r.algorithm_scores.AuthorNet}% × 20%) + ({r.algorithm_scores.CoAuthorGraph}% × 20%)
            </span>
            <span style={{color:'var(--text-muted)'}}> = </span>
            <span style={{color:verdictColor(r.verdict.level),fontWeight:700}}>{r.weighted_score}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAPERS DATABASE PAGE
// ═══════════════════════════════════════════════════════════════════════════════

function PapersPage() {
  const [papers, setPapers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    axios.get(API+'/papers', authHdr())
      .then(r => setPapers(r.data.papers||[]))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, []);

  const filtered = papers.filter(p =>
    p.paper_title.toLowerCase().includes(search.toLowerCase()) ||
    p.author.toLowerCase().includes(search.toLowerCase()) ||
    p.research_id.toLowerCase().includes(search.toLowerCase()) ||
    (p.keywords||[]).some(k=>k.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1>📚 Paper Database</h1>
        <p className="page-sub">{papers.length} published research papers indexed for detection</p>
      </div>

      <div className="search-bar">
        <span className="search-icon">🔎</span>
        <input
          className="search-input"
          placeholder="Search by title, author, ID, or keyword..."
          value={search}
          onChange={e=>setSearch(e.target.value)}
        />
        {search && <button className="search-clear" onClick={()=>setSearch('')}>✕</button>}
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner-lg"/></div>
      ) : (
        <div className="panel">
          <div className="panel-hdr">
            <span className="panel-title">Results: {filtered.length} papers</span>
          </div>
          {filtered.map(p => (
            <div key={p.research_id} className={`paper-row ${selected===p.research_id?'selected':''}`} onClick={()=>setSelected(selected===p.research_id?null:p.research_id)}>
              <div style={{display:'flex',alignItems:'flex-start',gap:'1rem'}}>
                <span className="id-chip" style={{marginTop:'2px',flexShrink:0}}>{p.research_id}</span>
                <div style={{flex:1}}>
                  <div className="paper-title">{p.paper_title}</div>
                  <div className="paper-meta">{p.author} · {p.institution} · {p.journal} · {p.year}</div>
                  <div style={{marginTop:'0.4rem',display:'flex',flexWrap:'wrap',gap:'0.2rem'}}>
                    {(p.keywords||[]).map(k=><span key={k} className="kw-chip">{k}</span>)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length===0 && (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>No papers match your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HISTORY PAGE
// ═══════════════════════════════════════════════════════════════════════════════

function HistoryPage({ user }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(API+'/scans', authHdr())
      .then(r=>setScans(r.data.scans||[]))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, []);

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1>📋 Scan History</h1>
        <p className="page-sub">All detection scans for {user.researcher_id} — {user.name}</p>
      </div>

      {loading ? <div className="empty-state"><div className="spinner-lg"/></div> : (
        scans.length===0 ? (
          <div className="empty-state">
            <div className="empty-icon">🗂</div>
            <p>No scans yet. Head to Detection to run your first scan.</p>
          </div>
        ) : (
          <div className="panel">
            <div className="panel-hdr">
              <span className="panel-title">Total Scans: {scans.length}</span>
            </div>
            <div style={{overflowX:'auto'}}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Paper Title</th>
                    <th>Keywords</th>
                    <th>Top Match Score</th>
                    <th>Top Match Paper</th>
                    <th>Verdict</th>
                    <th>Flagged</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {scans.map((s,i)=>(
                    <tr key={s.id}>
                      <td style={{color:'var(--text-muted)',fontFamily:'JetBrains Mono'}}>{i+1}</td>
                      <td style={{maxWidth:'200px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={s.paper_title}>{s.paper_title}</td>
                      <td style={{fontSize:'0.72rem',color:'var(--text-muted)'}}>{(s.keywords||[]).join(', ')||'—'}</td>
                      <td><span style={{fontFamily:'JetBrains Mono',color:'var(--cyan)',fontWeight:700}}>{s.top_match_score}%</span></td>
                      <td style={{maxWidth:'180px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:'0.78rem',color:'var(--text-muted)'}} title={s.top_match_paper}>{s.top_match_paper}</td>
                      <td><span className={`badge badge-${s.overall_verdict?.level||'clean'}`}>{verdictIcon(s.overall_verdict?.level)} {s.overall_verdict?.label||'CLEAN'}</span></td>
                      <td style={{fontFamily:'JetBrains Mono',color:s.similar_count>0?'var(--orange)':'var(--green)'}}>{s.similar_count}</td>
                      <td style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{new Date(s.submitted_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { setBooting(false); return; }
    axios.get(API+'/auth/me', authHdr())
      .then(r => { if (r.data.success) setUser(r.data.user); })
      .catch(() => clearToken())
      .finally(() => setBooting(false));
  }, []);

  function handleAuth(u) { setUser(u); setTab('dashboard'); }
  function logout() { clearToken(); setUser(null); setTab('dashboard'); }

  if (booting) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'var(--void)'}}>
      <div className="spinner-lg"/>
    </div>
  );

  if (!user) return <AuthPage onAuth={handleAuth}/>;

  const tabs = [
    { id:'dashboard', label:'⌂ Dashboard' },
    { id:'detect',    label:'⚡ Detection' },
    { id:'papers',    label:'📚 Database' },
    { id:'history',   label:'📋 History' },
  ];

  return (
    <div className="app-root">
      <div className="bg-grid"/>

      <nav className="navbar">
        <div className="nav-brand">
          <span className="nav-logo">Ω</span>
          <div>
            <div className="nav-title">ARGADS</div>
            <div className="nav-sub">Ghost-Authorship Detection System</div>
          </div>
        </div>
        <div className="nav-tabs">
          {tabs.map(t=>(
            <button key={t.id} className={`nav-tab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="nav-user">
          <div className="user-avatar">{user.name[0].toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-id">{user.researcher_id}</div>
          </div>
          <button className="logout-btn" onClick={logout} title="Sign out">⎋</button>
        </div>
      </nav>

      <main className="main-content">
        {tab==='dashboard' && <Dashboard user={user}/>}
        {tab==='detect'    && <DetectionPage user={user}/>}
        {tab==='papers'    && <PapersPage/>}
        {tab==='history'   && <HistoryPage user={user}/>}
      </main>
    </div>
  );
}
