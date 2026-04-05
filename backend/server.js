const express  = require('express');
const cors     = require('cors');
const fs       = require('fs');
const path     = require('path');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET     = 'argads_vit_secret_2024';
const PAPERS_PATH    = path.join(__dirname, 'papers.json');
const USERS_PATH     = path.join(__dirname, 'users.json');
const SCANS_PATH     = path.join(__dirname, 'scans.json');

// ── Load / Save helpers ───────────────────────────────────────────────────────
const loadPapers = () => JSON.parse(fs.readFileSync(PAPERS_PATH, 'utf-8'));
const loadUsers  = () => {
  try { return JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8')); } catch { return []; }
};
const saveUsers  = (u) => fs.writeFileSync(USERS_PATH, JSON.stringify(u, null, 2));
const loadScans  = () => {
  try { return JSON.parse(fs.readFileSync(SCANS_PATH, 'utf-8')); } catch { return []; }
};
const saveScans  = (s) => fs.writeFileSync(SCANS_PATH, JSON.stringify(s, null, 2));

// ── Auth middleware ───────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// TEXT PROCESSING UTILITIES
// ════════════════════════════════════════════════════════════════════════════════

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
}

const STOPWORDS = new Set([
  'the','and','for','are','but','not','you','all','can','had','her','was','one',
  'our','out','day','get','has','him','his','how','its','let','may','now','say',
  'she','too','use','way','who','this','that','with','have','from','they','will',
  'been','were','when','what','your','each','which','their','there','about','would',
  'these','other','than','then','some','more','also','into','over','such','very',
  'just','most','both','time','even','well','back','much','must','does','did',
  'could','should','through','between','after','while','where','being','since',
  'during','before','within','without','using','used','show','shows','shown',
  'results','result','based','study','paper','approach','method','methods','model',
  'models','data','system','systems','present','work','propose','proposed',
  'demonstrate','demonstrates','performance','compared','achieve','achieved',
  'achieves','improve','improves','improved','existing','novel','new','we','us',
  'an','a','in','of','to','is','it','as','be','by','at','on','up','or','do',
  'if','no','so','he','me','my','any','per','via','etc','al','et','fig',
]);

function removeStopwords(tokens) { return tokens.filter(t => !STOPWORDS.has(t)); }

function termFrequency(tokens) {
  const tf = {};
  tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
  const total = tokens.length || 1;
  Object.keys(tf).forEach(k => tf[k] /= total);
  return tf;
}

function cosineSimilarity(tf1, tf2) {
  const allTerms = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);
  let dot = 0, mag1 = 0, mag2 = 0;
  allTerms.forEach(t => {
    const a = tf1[t] || 0, b = tf2[t] || 0;
    dot += a*b; mag1 += a*a; mag2 += b*b;
  });
  if (!mag1 || !mag2) return 0;
  return dot / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

function jaccardSimilarity(tokens1, tokens2) {
  const s1 = new Set(tokens1), s2 = new Set(tokens2);
  let intersection = 0;
  s1.forEach(t => { if (s2.has(t)) intersection++; });
  const union = s1.size + s2.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function getNgrams(tokens, n) {
  const ng = new Set();
  for (let i = 0; i <= tokens.length - n; i++) ng.add(tokens.slice(i,i+n).join('_'));
  return ng;
}

function ngramSimilarity(tokens1, tokens2, n=3) {
  const ng1 = getNgrams(tokens1, n), ng2 = getNgrams(tokens2, n);
  if (!ng1.size || !ng2.size) return 0;
  let overlap = 0;
  ng1.forEach(g => { if (ng2.has(g)) overlap++; });
  return (2 * overlap) / (ng1.size + ng2.size);
}

function keywordOverlap(kw1, kw2) {
  if (!kw1?.length || !kw2?.length) return 0;
  const s1 = new Set(kw1.map(k => k.toLowerCase().trim()));
  const s2 = new Set(kw2.map(k => k.toLowerCase().trim()));
  let matches = 0;
  s1.forEach(k => { if (s2.has(k)) matches++; });
  return (2 * matches) / (s1.size + s2.size);
}

// ════════════════════════════════════════════════════════════════════════════════
// 4 DETECTION ALGORITHMS
// ════════════════════════════════════════════════════════════════════════════════

const WEIGHTS = { StyleBERT: 0.35, GPTRadar: 0.25, AuthorNet: 0.20, CoAuthorGraph: 0.20 };

function runAlgorithms(inputText, stored) {
  const inputTk  = removeStopwords(tokenize(inputText));
  const storedTk = removeStopwords(tokenize(stored.abstract));

  const inputTF  = termFrequency(inputTk);
  const storedTF = termFrequency(storedTk);
  const StyleBERT    = Math.min(cosineSimilarity(inputTF, storedTF) * 2.2, 1);

  const titleTF  = termFrequency(removeStopwords(tokenize(stored.paper_title)));
  const titleCos = cosineSimilarity(inputTF, titleTF);
  const AuthorNet= Math.min(titleCos * 2.5, 1);

  const bigram   = ngramSimilarity(inputTk, storedTk, 2);
  const trigram  = ngramSimilarity(inputTk, storedTk, 3);
  const GPTRadar = Math.min((bigram * 0.5 + trigram * 0.5) * 3.0, 1);

  const CoAuthorGraph = Math.min(jaccardSimilarity(inputTk, storedTk) * 3.5, 1);

  return { StyleBERT, GPTRadar, AuthorNet, CoAuthorGraph };
}

function weightedScore(scores) {
  return Object.keys(WEIGHTS).reduce((s, k) => s + (scores[k]||0) * WEIGHTS[k], 0);
}

function getVerdict(score) {
  if (score >= 0.75) return { label: 'COPYRIGHT CONFIRMED', level: 'critical' };
  if (score >= 0.50) return { label: 'COPYRIGHT SUSPECTED', level: 'high' };
  if (score >= 0.25) return { label: 'LOW SIMILARITY',      level: 'medium' };
  return                    { label: 'CLEAN',               level: 'clean' };
}

// ════════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ════════════════════════════════════════════════════════════════════════════════

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { researcher_id, name, email, password, department } = req.body;
  if (!researcher_id || !name || !email || !password)
    return res.status(400).json({ success: false, message: 'All fields are required.' });

  const users = loadUsers();
  if (users.find(u => u.email === email))
    return res.status(409).json({ success: false, message: 'Email already registered.' });
  if (users.find(u => u.researcher_id === researcher_id))
    return res.status(409).json({ success: false, message: 'Researcher ID already exists.' });

  const hashed = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now().toString(),
    researcher_id,
    name,
    email,
    password: hashed,
    department: department || 'Computer Science Engineering',
    joined: new Date().toISOString(),
    total_scans: 0,
  };
  users.push(newUser);
  saveUsers(users);

  const token = jwt.sign({ id: newUser.id, researcher_id, name, email }, JWT_SECRET, { expiresIn: '24h' });
  const { password: _, ...userPublic } = newUser;
  res.json({ success: true, message: 'Registration successful!', token, user: userPublic });
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password are required.' });

  const users = loadUsers();
  const user  = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

  const token = jwt.sign({ id: user.id, researcher_id: user.researcher_id, name: user.name, email }, JWT_SECRET, { expiresIn: '24h' });
  const { password: _, ...userPublic } = user;
  res.json({ success: true, message: 'Login successful!', token, user: userPublic });
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const users = loadUsers();
  const user  = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const { password: _, ...pub } = user;
  res.json({ success: true, user: pub });
});

// ════════════════════════════════════════════════════════════════════════════════
// PAPER ROUTES
// ════════════════════════════════════════════════════════════════════════════════

app.get('/api/papers', authMiddleware, (req, res) => {
  const papers = loadPapers();
  res.json({ success: true, count: papers.length, papers: papers.map(p => ({ ...p, abstract: undefined })) });
});

app.get('/api/papers/:id', authMiddleware, (req, res) => {
  const paper = loadPapers().find(p => p.research_id === req.params.id);
  if (!paper) return res.status(404).json({ success: false, message: 'Paper not found' });
  res.json({ success: true, paper });
});

// ════════════════════════════════════════════════════════════════════════════════
// DETECTION ROUTE
// ════════════════════════════════════════════════════════════════════════════════

app.post('/api/detect', authMiddleware, (req, res) => {
  const { paper_title, research_text } = req.body;

  if (!paper_title || !research_text)
    return res.status(400).json({ success: false, message: 'paper_title and research_text are required.' });
  if (research_text.trim().split(/\s+/).length < 20)
    return res.status(400).json({ success: false, message: 'research_text must be at least 20 words.' });

  const papers = loadPapers();

  const results = papers.map(stored => {
    const scores = runAlgorithms(research_text, stored);
    const ws = weightedScore(scores);
    return {
      matched_paper: {
        research_id:  stored.research_id,
        paper_title:  stored.paper_title,
        author:       stored.author,
        institution:  stored.institution,
        journal:      stored.journal,
        year:         stored.year,
        keywords:     stored.keywords,
      },
      algorithm_scores: {
        StyleBERT:     +(scores.StyleBERT     * 100).toFixed(2),
        GPTRadar:      +(scores.GPTRadar      * 100).toFixed(2),
        AuthorNet:     +(scores.AuthorNet     * 100).toFixed(2),
        CoAuthorGraph: +(scores.CoAuthorGraph * 100).toFixed(2),
      },
      algorithm_weights: { StyleBERT:'35%', GPTRadar:'25%', AuthorNet:'20%', CoAuthorGraph:'20%' },
      weighted_score: +(ws * 100).toFixed(2),
      verdict:        getVerdict(ws),
    };
  });

  results.sort((a,b) => b.weighted_score - a.weighted_score);

  const flagged = results.filter(r => r.weighted_score >= 25);
  const topMatch = results[0];

  // Save scan history
  const scans = loadScans();
  const scan = {
    id: Date.now().toString(),
    user_id:     req.user.id,
    researcher_id: req.user.researcher_id,
    researcher_name: req.user.name,
    paper_title,
    submitted_at: new Date().toISOString(),
    top_match_score: topMatch.weighted_score,
    top_match_paper: topMatch.matched_paper.paper_title,
    overall_verdict: topMatch.verdict,
    similar_count: flagged.length,
    full_results: results,
    flagged_results: flagged,
    summary: { total_papers_checked: papers.length, similar_papers_found: flagged.length, top_match_score: topMatch.weighted_score, top_match_paper: topMatch.matched_paper.paper_title, overall_verdict: topMatch.verdict },
  };
  scans.push(scan);
  saveScans(scans);

  // Update user scan count
  const users = loadUsers();
  const uIdx = users.findIndex(u => u.id === req.user.id);
  if (uIdx !== -1) { users[uIdx].total_scans++; saveUsers(users); }

  res.json({
    success: true,
    submission: { researcher_id: req.user.researcher_id, researcher_name: req.user.name, paper_title, submitted_at: scan.submitted_at },
    summary: { total_papers_checked: papers.length, similar_papers_found: flagged.length, top_match_score: topMatch.weighted_score, top_match_paper: topMatch.matched_paper.paper_title, overall_verdict: topMatch.verdict },
    algorithm_weights: WEIGHTS,
    results,
    flagged_results: flagged,
  });
});

// GET /api/scans — user's scan history
app.get('/api/scans', authMiddleware, (req, res) => {
  const scans = loadScans().filter(s => s.user_id === req.user.id).reverse();
  res.json({ success: true, scans });
});

// GET /api/scans/:id — single scan with full results
app.get('/api/scans/:id', authMiddleware, (req, res) => {
  const scan = loadScans().find(s => s.id === req.params.id && s.user_id === req.user.id);
  if (!scan) return res.status(404).json({ success: false, message: 'Scan not found' });
  res.json({ success: true, scan });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', papers_loaded: loadPapers().length, timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🔍 ARGADS Backend running on http://localhost:${PORT}`);
  console.log(`📚 ${loadPapers().length} research papers loaded`);
  console.log(`\nEndpoints:`);
  console.log(`  POST /api/auth/register  — register`);
  console.log(`  POST /api/auth/login     — login`);
  console.log(`  GET  /api/papers         — list all papers`);
  console.log(`  POST /api/detect         — run detection`);
  console.log(`  GET  /api/scans          — scan history\n`);
});