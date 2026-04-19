import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = '/api';

const getToken   = () => localStorage.getItem('argads_token');
const setToken   = (t) => localStorage.setItem('argads_token', t);
const clearToken = () => localStorage.removeItem('argads_token');
const authHdr    = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

// ── Brand Logo SVG ─────────────────────────────────────────────────────────────
function BrandMark({ size = 40, dark = false }) {
  const stroke = dark ? '#1a1a1a' : '#f5f0e8';
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="3" width="28" height="36" rx="2" stroke={stroke} strokeWidth="2" fill="none"/>
      <polyline points="28,3 34,3 34,9 28,3" stroke={stroke} strokeWidth="1.5" fill="none"/>
      <line x1="11" y1="15" x2="29" y2="15" stroke={stroke} strokeWidth="1.5"/>
      <line x1="11" y1="21" x2="29" y2="21" stroke={stroke} strokeWidth="1.5"/>
      <line x1="11" y1="27" x2="22" y2="27" stroke={stroke} strokeWidth="1.5"/>
      <circle cx="35" cy="37" r="8" stroke={stroke} strokeWidth="2" fill="none"/>
      <line x1="41" y1="43" x2="45" y2="47" stroke={stroke} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="35" y1="33.5" x2="35" y2="40.5" stroke={stroke} strokeWidth="1" opacity="0.7"/>
      <line x1="31.5" y1="37" x2="38.5" y2="37" stroke={stroke} strokeWidth="1" opacity="0.7"/>
    </svg>
  );
}

// ── Verdict helpers ────────────────────────────────────────────────────────────
function verdictColor(level) {
  return { critical:'var(--red)', high:'var(--amber)', medium:'var(--gold)', clean:'var(--sage)' }[level] || 'var(--ink-light)';
}
function verdictBg(level) {
  return { critical:'rgba(180,30,30,0.07)', high:'rgba(200,100,20,0.07)', medium:'rgba(180,150,20,0.07)', clean:'rgba(50,120,60,0.07)' }[level] || 'rgba(80,80,80,0.05)';
}
function verdictIcon(level) {
  return { critical:'◈', high:'◇', medium:'◉', clean:'◎' }[level] || '○';
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ researcher_id:'', name:'', email:'', password:'', department:'Computer Science Engineering' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showPass, setShowPass] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault(); setError(''); setLoading(true);
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
      <div className="auth-left-panel">
        <div className="auth-left-content">
          <div className="auth-brand-mark">
            <BrandMark size={56} dark={false}/>
          </div>
          <h1 className="auth-hero-title">ARGADS</h1>
          <p className="auth-hero-sub">Academic Research Ghost-Authorship<br/>Detection System</p>
          <div className="auth-divider"/>
          <p className="auth-hero-body">
            Protecting scholarly integrity through rigorous computational analysis. Detect similarities, trace authorship, and uphold the ethics of research.
          </p>
          <div className="auth-tags">
            <span className="auth-tag">TF-IDF Analysis</span>
            <span className="auth-tag">N-gram Matching</span>
            <span className="auth-tag">Jaccard Similarity</span>
            <span className="auth-tag">50-Paper Database</span>
          </div>
          <p className="auth-inst">VIT Chennai · BCSE302L Database Systems · DA3</p>
        </div>
      </div>

      <div className="auth-right-panel">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
            <p>{mode === 'login' ? 'Welcome back, researcher.' : 'Join the detection network.'}</p>
          </div>

          <div className="auth-tabs">
            <button className={`auth-tab ${mode==='login'?'active':''}`} onClick={()=>{setMode('login');setError('');}}>Sign In</button>
            <button className={`auth-tab ${mode==='register'?'active':''}`} onClick={()=>{setMode('register');setError('');}}>Register</button>
          </div>

          <form onSubmit={submit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}
            {mode === 'register' && (<>
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
            </>)}
            <div className="auth-field">
              <label>Email Address</label>
              <input type="email" placeholder="your@vit.ac.in" value={form.email} onChange={set('email')} required/>
            </div>
            <div className="auth-field">
              <label>Password</label>
              <div className="pass-wrap">
                <input type={showPass?'text':'password'} placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required minLength={6}/>
                <button type="button" className="pass-toggle" onClick={()=>setShowPass(v=>!v)}>{showPass?'Hide':'Show'}</button>
              </div>
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <span className="spin-sm"/> : mode==='login' ? 'Sign In →' : 'Create Account →'}
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
function Dashboard({ user, onNavigate }) {
  const [scans, setScans] = useState([]);

  useEffect(() => {
    axios.get(API+'/scans', authHdr()).then(r=>setScans(r.data.scans||[])).catch(()=>{});
  }, []);

  const stats = [
    { label:'Total Scans',    value: user.total_scans,     accent:'var(--ink)', icon:'∑' },
    { label:'Flagged Papers', value: scans.filter(s=>s.overall_verdict?.level!=='clean').length, accent:'var(--red)', icon:'◈' },
    { label:'Clean Passes',   value: scans.filter(s=>s.overall_verdict?.level==='clean').length, accent:'var(--sage)', icon:'◎' },
    { label:'Researcher ID',  value: user.researcher_id,   accent:'var(--amber)', icon:'⊙', small:true },
  ];

  return (
    <div className="page fade-in">
      <div className="page-header">
        <span className="page-eyebrow">OVERVIEW</span>
        <h1>Welcome, {user.name.split(' ')[0]}</h1>
        <p className="page-sub">{user.researcher_id} · {user.department}</p>
      </div>

      <div className="stat-row">
        {stats.map(s=>(
          <div key={s.label} className="stat-box" style={{'--acc':s.accent}}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-val" style={{fontSize:s.small?'1rem':'2.4rem'}}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-hdr">
          <span className="panel-title">Recent Scan History</span>
          <button className="btn-text" onClick={()=>onNavigate('history')}>View all →</button>
        </div>
        {scans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><BrandMark size={48} dark={true}/></div>
            <p>No scans yet. Head to Detection to run your first analysis.</p>
            <button className="btn-primary" onClick={()=>onNavigate('detect')} style={{marginTop:'1.5rem'}}>Run First Scan →</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Paper Title</th><th>Top Match</th><th>Score</th><th>Verdict</th><th>Date</th></tr>
            </thead>
            <tbody>
              {scans.slice(0,8).map(s=>(
                <tr key={s.id}>
                  <td className="td-title">{s.paper_title}</td>
                  <td className="td-muted td-sm">{s.top_match_paper}</td>
                  <td><span className="score-chip">{s.top_match_score}%</span></td>
                  <td><span className={`badge badge-${s.overall_verdict?.level||'clean'}`}>{verdictIcon(s.overall_verdict?.level)} {s.overall_verdict?.label||'CLEAN'}</span></td>
                  <td className="td-muted td-sm">{new Date(s.submitted_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel">
        <div className="panel-hdr"><span className="panel-title">Detection Algorithms</span></div>
        <div className="panel-body">
          <div className="algo-grid">
            {[
              {name:'StyleBERT',weight:'35%',desc:'TF-IDF cosine similarity — detects writing style and vocabulary overlap.',color:'var(--ink)'},
              {name:'GPTRadar',weight:'25%',desc:'Bigram & trigram phrase matching — identifies copied sentence fragments.',color:'var(--amber)'},
              {name:'AuthorNet',weight:'20%',desc:'Title-topic cosine overlap — checks thematic and conceptual similarity.',color:'var(--red)'},
              {name:'CoAuthorGraph',weight:'20%',desc:'Jaccard token set similarity — measures exact vocabulary intersection.',color:'var(--sage)'},
            ].map(a=>(
              <div key={a.name} className="algo-card" style={{'--acc':a.color}}>
                <div className="algo-card-top">
                  <span className="algo-name">{a.name}</span>
                  <span className="algo-weight">{a.weight}</span>
                </div>
                <p className="algo-desc">{a.desc}</p>
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
  const [form, setForm]           = useState({ paper_title:'', research_text:'' });
  const [inputMode, setInputMode] = useState('text');
  const [jsonFile, setJsonFile]   = useState(null);
  const [jsonFileName, setJsonFileName] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [result, setResult]       = useState(null);
  const [showAll, setShowAll]     = useState(false);
  const resultRef    = useRef(null);
  const fileInputRef = useRef(null);

  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  // ✅ FIX 1: Reset the opposite mode's state when switching modes
  // Previously switching modes left stale state which caused activeWC to
  // compute incorrectly and the button to stay disabled unexpectedly.
  function switchMode(mode) {
    setInputMode(mode);
    setError('');
    if (mode === 'text') {
      // Switching to paste mode — clear JSON state
      setJsonFile(null);
      setJsonFileName('');
      setJsonError('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      // Switching to JSON mode — clear paste text state
      setForm(f => ({ ...f, research_text: '' }));
    }
  }

  function handleJsonUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setJsonError('');
    if (!file.name.endsWith('.json')) { setJsonError('Please upload a valid .json file.'); return; }
    setJsonFileName(file.name);
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = JSON.parse(evt.target.result);
        const text = parsed.abstract || parsed.text || parsed.research_text || parsed.content;
        if (!text || typeof text !== 'string') {
          setJsonError('JSON must contain an "abstract", "text", "research_text", or "content" field.');
          setJsonFile(null); setJsonFileName('');
        } else {
          setJsonFile(text);
        }
      } catch { setJsonError('Invalid JSON file.'); setJsonFile(null); setJsonFileName(''); }
    };
    reader.readAsText(file);
  }

  function clearJson() {
    setJsonFile(null); setJsonFileName(''); setJsonError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const activeText = inputMode === 'json' ? (jsonFile || '') : form.research_text;
  const activeWC   = activeText.trim().split(/\s+/).filter(Boolean).length;
  const canSubmit  = !loading && form.paper_title.trim() && activeWC >= 20;

  // ✅ FIX 2: Build a human-readable reason why the button is disabled
  // This tells the user exactly what is still missing.
  function getDisabledReason() {
    if (loading) return null;
    const reasons = [];
    if (!form.paper_title.trim()) reasons.push('enter a paper title');
    if (inputMode === 'json' && !jsonFile) reasons.push('upload a JSON file');
    if (inputMode === 'text' && activeWC < 20) reasons.push(`add ${20 - activeWC} more word${20 - activeWC !== 1 ? 's' : ''}`);
    if (reasons.length === 0) return null;
    return '⚠ To run a scan: ' + reasons.join(', then ') + '.';
  }
  const disabledReason = getDisabledReason();

  async function runScan(e) {
    e.preventDefault(); setError(''); setLoading(true); setResult(null); setShowAll(false);
    const researchText = inputMode === 'json' ? (jsonFile || '') : form.research_text;
    if (!researchText.trim()) {
      setError(inputMode === 'json' ? 'Please upload a valid JSON file.' : 'Research text is required.');
      setLoading(false); return;
    }
    if (researchText.trim().split(/\s+/).filter(Boolean).length < 20) {
      setError('Research text must be at least 20 words.');
      setLoading(false); return;
    }
    try {
      const { data } = await axios.post(API+'/detect', { paper_title: form.paper_title, research_text: researchText }, authHdr());
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 100);
    } catch(err) { setError(err.response?.data?.message || 'Detection failed.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="page fade-in">
      <div className="page-header">
        <span className="page-eyebrow">SCAN</span>
        <h1>Detection Analysis</h1>
        <p className="page-sub">Submit your research text to check against 50 published papers</p>
      </div>

      <div className="panel">
        <div className="panel-hdr">
          <span className="panel-title">Submission Form</span>
          <span className="info-chip">{user.researcher_id} — {user.name}</span>
        </div>
        <div className="panel-body">
          <form onSubmit={runScan}>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-field">
              <label>Paper Title <span className="req">*</span></label>
              <input
                className="finput"
                placeholder="Enter the full title of your research paper"
                value={form.paper_title}
                onChange={set('paper_title')}
                required
              />
            </div>

            <div className="form-field">
              <label>Research Content <span className="req">*</span></label>
              {/* ✅ FIX 1: Use switchMode() instead of setInputMode() directly */}
              <div className="mode-toggle">
                <button type="button" className={`mode-btn ${inputMode==='text'?'active':''}`} onClick={()=>switchMode('text')}>✎ Paste Text</button>
                <button type="button" className={`mode-btn ${inputMode==='json'?'active':''}`} onClick={()=>switchMode('json')}>⊞ Upload JSON</button>
              </div>
            </div>

            {inputMode === 'text' && (
              <div className="form-field">
                <textarea
                  className="ftextarea"
                  rows={8}
                  placeholder="Paste your research abstract or paper text here… (minimum 20 words)"
                  value={form.research_text}
                  onChange={set('research_text')}
                />
                <div className={`word-count ${activeWC < 20 ? 'low' : 'ok'}`}>
                  {activeWC} words {activeWC < 20 ? `— need ${20 - activeWC} more` : '✓'}
                </div>
              </div>
            )}

            {inputMode === 'json' && (
              <div className="form-field">
                <p className="field-hint">Upload a <code>.json</code> file with an <code>"abstract"</code>, <code>"text"</code>, or <code>"content"</code> field.</p>

                {/* ✅ FIX 3: Only trigger file picker click when no file is loaded yet.
                    Previously the entire drop-zone (including the filled state) would
                    re-open the file dialog on every click, making it impossible to
                    interact normally after a file was uploaded. */}
                <div
                  className="drop-zone"
                  onClick={() => { if (!jsonFile) fileInputRef.current?.click(); }}
                  style={{ cursor: jsonFile ? 'default' : 'pointer' }}
                >
                  {jsonFile ? (
                    <div className="drop-zone-filled">
                      <BrandMark size={28} dark={true}/>
                      <div>
                        <div className="drop-filename">{jsonFileName}</div>
                        <div className="drop-words">{activeWC} words extracted ✓</div>
                      </div>
                      {/* ✅ FIX 4: "Change file" button lets user pick a different file
                          without having to remove first. */}
                      <div style={{ display:'flex', gap:'0.5rem' }}>
                        <button
                          type="button"
                          className="drop-clear"
                          style={{ background:'var(--ink-light)', color:'var(--cream)' }}
                          onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        >
                          ⊞ Change
                        </button>
                        <button
                          type="button"
                          className="drop-clear"
                          onClick={e => { e.stopPropagation(); clearJson(); }}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="drop-prompt">
                      <div className="drop-icon">⊞</div>
                      <p>Click to browse JSON file</p>
                      <span>.json files only</span>
                    </div>
                  )}
                </div>

                <input ref={fileInputRef} type="file" accept=".json" style={{ display:'none' }} onChange={handleJsonUpload}/>
                {jsonError && <p className="field-error">{jsonError}</p>}
                {jsonFile && (
                  <div className={`word-count ${activeWC < 20 ? 'low' : 'ok'}`}>
                    {activeWC} words {activeWC < 20 ? `— need ${20 - activeWC} more` : '✓'}
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="btn-scan" disabled={!canSubmit}>
              {loading
                ? <><span className="spin-sm"/> Analysing against 50 papers…</>
                : '⊕ Run Copyright Detection Scan'}
            </button>

            {/* ✅ FIX 2: Show exactly why the button is disabled so the user
                knows what they still need to fill in. */}
            {disabledReason && (
              <p style={{
                marginTop: '0.6rem',
                fontSize: '0.82rem',
                color: 'var(--amber)',
                fontWeight: 500,
              }}>
                {disabledReason}
              </p>
            )}
          </form>
        </div>
      </div>

      {result && (
        <div ref={resultRef} className="fade-in">
          <VerdictBanner summary={result.summary}/>
          {result.flagged_results?.length > 0 && (
            <div className="panel">
              <div className="panel-hdr"><span className="panel-title">◈ Significant Matches ({result.flagged_results.length})</span></div>
              <div className="panel-body">
                {result.flagged_results.map((r,i) => <MatchCard key={i} r={r} rank={i+1}/>)}
              </div>
            </div>
          )}
          <div className="panel">
            <div className="panel-hdr">
              <span className="panel-title">All Papers — Sorted by Similarity</span>
              <button className="btn-ghost" onClick={()=>setShowAll(v=>!v)}>{showAll?'Show Top 10':'Show All 50'}</button>
            </div>
            <div style={{overflowX:'auto'}}>
              <AllResultsTable results={showAll ? result.results : result.results.slice(0,10)}/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED RESULT COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════
function VerdictBanner({ summary }) {
  return (
    <div className="verdict-banner" style={{
      '--vc': verdictColor(summary.overall_verdict?.level),
      borderColor: verdictColor(summary.overall_verdict?.level),
      background: verdictBg(summary.overall_verdict?.level),
    }}>
      <div className="verdict-icon-lg">{verdictIcon(summary.overall_verdict?.level)}</div>
      <div className="verdict-info">
        <div className="verdict-label">{summary.overall_verdict?.label}</div>
        <div className="verdict-score-line">
          <span className="verdict-score">{summary.top_match_score}</span>
          <span className="verdict-pct">%</span>
          <span className="verdict-score-label">highest similarity match</span>
        </div>
        <div className="verdict-sub">Best match: <em>{summary.top_match_paper}</em></div>
        <div className="verdict-meta">Checked {summary.total_papers_checked} papers · {summary.similar_papers_found} with &gt;25% similarity</div>
      </div>
    </div>
  );
}

function AllResultsTable({ results }) {
  return (
    <table className="data-table">
      <thead>
        <tr><th>#</th><th>ID</th><th>Paper Title</th><th>StyleBERT</th><th>GPTRadar</th><th>AuthorNet</th><th>CoAuthorGraph</th><th>Total</th><th>Verdict</th></tr>
      </thead>
      <tbody>
        {results.map((r,i) => (
          <tr key={i}>
            <td className="td-muted mono">{i+1}</td>
            <td><span className="id-chip">{r.matched_paper.research_id}</span></td>
            <td className="td-title">{r.matched_paper.paper_title}</td>
            <td><ScoreCell v={r.algorithm_scores.StyleBERT}/></td>
            <td><ScoreCell v={r.algorithm_scores.GPTRadar}/></td>
            <td><ScoreCell v={r.algorithm_scores.AuthorNet}/></td>
            <td><ScoreCell v={r.algorithm_scores.CoAuthorGraph}/></td>
            <td><strong className={`score-total ${r.weighted_score>=50?'high':r.weighted_score>=25?'med':''}`}>{r.weighted_score}%</strong></td>
            <td><span className={`badge badge-${r.verdict.level}`}>{verdictIcon(r.verdict.level)} {r.verdict.label}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ScoreCell({ v }) {
  const c = v>=50?'var(--red)':v>=25?'var(--gold)':'var(--ink-light)';
  return <span className="mono" style={{fontSize:'0.82rem',color:c}}>{v}%</span>;
}

function MatchCard({ r, rank }) {
  const [open, setOpen] = useState(rank===1);
  return (
    <div className="match-card">
      <div className="match-hdr" onClick={()=>setOpen(v=>!v)}>
        <div className="match-hdr-left">
          <div className="match-rank-row">
            <span className="rank-badge">#{rank}</span>
            <span className="id-chip">{r.matched_paper.research_id}</span>
            <span className={`badge badge-${r.verdict.level}`}>{verdictIcon(r.verdict.level)} {r.verdict.label}</span>
          </div>
          <div className="match-title">{r.matched_paper.paper_title}</div>
          <div className="match-meta">{r.matched_paper.author} · {r.matched_paper.journal} · {r.matched_paper.year}</div>
          <div className="kw-row">{r.matched_paper.keywords?.map(k=><span key={k} className="kw-chip">{k}</span>)}</div>
        </div>
        <div className="match-hdr-right">
          <div className="match-big-score" style={{color:verdictColor(r.verdict.level)}}>{r.weighted_score}%</div>
          <div className="match-big-label">WEIGHTED TOTAL</div>
          <div className="match-toggle">{open?'▲ collapse':'▼ expand'}</div>
        </div>
      </div>
      {open && (
        <div className="match-body fade-in">
          {[
            ['StyleBERT','35%',r.algorithm_scores.StyleBERT,'TF-IDF cosine','var(--ink)'],
            ['GPTRadar','25%',r.algorithm_scores.GPTRadar,'N-gram matching','var(--amber)'],
            ['AuthorNet','20%',r.algorithm_scores.AuthorNet,'Title similarity','var(--red)'],
            ['CoAuthorGraph','20%',r.algorithm_scores.CoAuthorGraph,'Jaccard similarity','var(--sage)'],
          ].map(([name,wt,val,desc,col]) => (
            <div key={name} className="algo-row">
              <div className="algo-row-name"><span style={{color:col,fontWeight:600}}>{name}</span><span className="algo-row-wt">({wt})</span></div>
              <div className="pbar-wrap"><div className="pbar-fill" style={{width:`${val}%`,background:col}}/></div>
              <span className="algo-row-val mono" style={{color:col}}>{val}%</span>
              <span className="algo-row-desc">{desc}</span>
            </div>
          ))}
          <div className="formula-row">
            <span className="formula-label">Formula:</span>
            <span className="formula-expr">({r.algorithm_scores.StyleBERT}%×35%) + ({r.algorithm_scores.GPTRadar}%×25%) + ({r.algorithm_scores.AuthorNet}%×20%) + ({r.algorithm_scores.CoAuthorGraph}%×20%)</span>
            <span> = </span>
            <strong style={{color:verdictColor(r.verdict.level)}}>{r.weighted_score}%</strong>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAPERS DATABASE
// ═══════════════════════════════════════════════════════════════════════════════
function PapersPage() {
  const [papers, setPapers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(API+'/papers', authHdr()).then(r=>setPapers(r.data.papers||[])).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const filtered = papers.filter(p=>
    p.paper_title.toLowerCase().includes(search.toLowerCase()) ||
    p.author.toLowerCase().includes(search.toLowerCase()) ||
    p.research_id.toLowerCase().includes(search.toLowerCase()) ||
    (p.keywords||[]).some(k=>k.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page fade-in">
      <div className="page-header">
        <span className="page-eyebrow">DATABASE</span>
        <h1>Paper Index</h1>
        <p className="page-sub">{papers.length} published research papers indexed for detection</p>
      </div>
      <div className="search-bar">
        <span className="search-icon">⊙</span>
        <input className="search-input" placeholder="Search by title, author, ID, or keyword…" value={search} onChange={e=>setSearch(e.target.value)}/>
        {search && <button className="search-clear" onClick={()=>setSearch('')}>✕</button>}
      </div>
      {loading ? <div className="empty-state"><div className="spinner-lg"/></div> : (
        <div className="panel">
          <div className="panel-hdr"><span className="panel-title">Results: {filtered.length} papers</span></div>
          {filtered.map(p=>(
            <div key={p.research_id} className="paper-row">
              <span className="id-chip" style={{flexShrink:0,marginTop:'2px'}}>{p.research_id}</span>
              <div style={{flex:1}}>
                <div className="paper-title">{p.paper_title}</div>
                <div className="paper-meta">{p.author} · {p.institution} · {p.journal} · {p.year}</div>
                <div className="kw-row" style={{marginTop:'0.4rem'}}>{(p.keywords||[]).map(k=><span key={k} className="kw-chip">{k}</span>)}</div>
              </div>
            </div>
          ))}
          {filtered.length===0 && <div className="empty-state"><p>No papers match your search.</p></div>}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCAN DETAIL MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function ScanDetailModal({ scanId, onClose }) {
  const [scan, setScan]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    axios.get(API+'/scans/'+scanId, authHdr()).then(r=>setScan(r.data.scan)).catch(()=>{}).finally(()=>setLoading(false));
  }, [scanId]);

  useEffect(() => {
    const h = e => { if (e.key==='Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="modal-panel fade-in">
        <div className="modal-header">
          <div style={{flex:1,minWidth:0}}>
            <span className="page-eyebrow">SCAN DETAIL</span>
            <h2 className="modal-title">{scan?.paper_title||'Loading…'}</h2>
            {scan && <p className="modal-meta">{new Date(scan.submitted_at).toLocaleString()} · {scan.researcher_id} · {scan.researcher_name}</p>}
          </div>
          <button className="modal-close" onClick={onClose}>✕ Close</button>
        </div>

        <div className="modal-body">
          {loading && <div className="empty-state"><div className="spinner-lg"/></div>}

          {!loading && !scan && (
            <div className="alert alert-error">Could not load scan details. This scan may have been recorded before full-result storage was added.</div>
          )}

          {scan && scan.summary && (
            <>
              <VerdictBanner summary={scan.summary}/>

              {scan.flagged_results?.length > 0 && (
                <div className="panel" style={{marginTop:'1.5rem'}}>
                  <div className="panel-hdr"><span className="panel-title">◈ Significant Matches ({scan.flagged_results.length})</span></div>
                  <div className="panel-body">
                    {scan.flagged_results.map((r,i) => <MatchCard key={i} r={r} rank={i+1}/>)}
                  </div>
                </div>
              )}

              {scan.full_results?.length > 0 && (
                <div className="panel" style={{marginTop:'1.5rem'}}>
                  <div className="panel-hdr">
                    <span className="panel-title">All Papers — Sorted by Similarity</span>
                    <button className="btn-ghost" onClick={()=>setShowAll(v=>!v)}>{showAll?'Show Top 10':'Show All 50'}</button>
                  </div>
                  <div style={{overflowX:'auto'}}>
                    <AllResultsTable results={showAll ? scan.full_results : scan.full_results.slice(0,10)}/>
                  </div>
                </div>
              )}

              {!scan.full_results && (
                <div className="alert alert-info" style={{marginTop:'1.5rem'}}>
                  Full per-paper breakdown not available for this scan. Future scans will include complete results.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HISTORY PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function HistoryPage({ user }) {
  const [scans, setScans]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [detailId, setDetailId] = useState(null);

  useEffect(() => {
    axios.get(API+'/scans', authHdr()).then(r=>setScans(r.data.scans||[])).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  return (
    <div className="page fade-in">
      <div className="page-header">
        <span className="page-eyebrow">RECORDS</span>
        <h1>Scan History</h1>
        <p className="page-sub">All detection scans for {user.researcher_id} · <em>Click any row to see the full similarity breakdown</em></p>
      </div>

      {loading ? <div className="empty-state"><div className="spinner-lg"/></div> : (
        scans.length===0 ? (
          <div className="empty-state">
            <div className="empty-icon"><BrandMark size={48} dark={true}/></div>
            <p>No scans yet. Head to Detection to run your first analysis.</p>
          </div>
        ) : (
          <div className="panel">
            <div className="panel-hdr">
              <span className="panel-title">Total Scans: {scans.length}</span>
              <span className="info-chip">↓ Click any row to view full breakdown</span>
            </div>
            <div style={{overflowX:'auto'}}>
              <table className="data-table">
                <thead>
                  <tr><th>#</th><th>Paper Title</th><th>Top Match Score</th><th>Top Match Paper</th><th>Verdict</th><th>Flagged</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {scans.map((s,i) => (
                    <tr key={s.id} className="clickable-row" onClick={()=>setDetailId(s.id)} title="Click to view full results">
                      <td className="td-muted mono">{i+1}</td>
                      <td className="td-title">{s.paper_title}</td>
                      <td><span className="score-chip">{s.top_match_score}%</span></td>
                      <td className="td-muted td-sm">{s.top_match_paper}</td>
                      <td><span className={`badge badge-${s.overall_verdict?.level||'clean'}`}>{verdictIcon(s.overall_verdict?.level)} {s.overall_verdict?.label||'CLEAN'}</span></td>
                      <td className={`mono ${s.similar_count>0?'text-amber':'text-sage'}`}>{s.similar_count}</td>
                      <td className="td-muted td-sm">{new Date(s.submitted_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {detailId && <ScanDetailModal scanId={detailId} onClose={()=>setDetailId(null)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser]       = useState(null);
  const [tab, setTab]         = useState('dashboard');
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { setBooting(false); return; }
    axios.get(API+'/auth/me', authHdr()).then(r=>{ if(r.data.success) setUser(r.data.user); }).catch(()=>clearToken()).finally(()=>setBooting(false));
  }, []);

  function handleAuth(u) { setUser(u); setTab('dashboard'); }
  function logout() { clearToken(); setUser(null); setTab('dashboard'); }

  if (booting) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'var(--cream)'}}>
      <div className="spinner-lg"/>
    </div>
  );

  if (!user) return <AuthPage onAuth={handleAuth}/>;

  const tabs = [
    {id:'dashboard', label:'Overview'},
    {id:'detect',    label:'Detection'},
    {id:'papers',    label:'Database'},
    {id:'history',   label:'History'},
  ];

  return (
    <div className="app-root">
      <nav className="navbar">
        <div className="nav-brand">
          <BrandMark size={34} dark={true}/>
          <div>
            <div className="nav-title">ARGADS</div>
            <div className="nav-sub">Ghost-Authorship Detection</div>
          </div>
        </div>
        <div className="nav-tabs">
          {tabs.map(t => (
            <button key={t.id} className={`nav-tab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>{t.label}</button>
          ))}
        </div>
        <div className="nav-user">
          <div className="user-avatar">{user.name[0].toUpperCase()}</div>
          <div>
            <div className="user-name">{user.name}</div>
            <div className="user-id">{user.researcher_id}</div>
          </div>
          <button className="logout-btn" onClick={logout}>Sign out</button>
        </div>
      </nav>

      <main className="main-content">
        {tab==='dashboard' && <Dashboard user={user} onNavigate={setTab}/>}
        {tab==='detect'    && <DetectionPage user={user}/>}
        {tab==='papers'    && <PapersPage/>}
        {tab==='history'   && <HistoryPage user={user}/>}
      </main>
    </div>
  );
}