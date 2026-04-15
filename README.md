# ARGADS — Academic Research Ghost-Authorship Detection System

> **BCSE302L Database Systems · DA3 · VIT Chennai**

ARGADS is a full-stack web application that checks research papers for copyright similarity against a database of 50 published papers using four detection algorithms.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [How to Run the Project](#2-how-to-run-the-project)
3. [Complete User Guide (Step-by-Step)](#3-complete-user-guide)
   - [Step 1: Register an Account](#step-1-register-an-account)
   - [Step 2: Sign In](#step-2-sign-in)
   - [Step 3: Explore the Dashboard](#step-3-explore-the-dashboard)
   - [Step 4: Run a Detection Scan](#step-4-run-a-detection-scan)
   - [Step 5: Reading the Results](#step-5-reading-the-results)
   - [Step 6: Browse the Paper Database](#step-6-browse-the-paper-database)
   - [Step 7: View Scan History & Full Breakdowns](#step-7-view-scan-history--full-breakdowns)
4. [Detection Algorithms Explained](#4-detection-algorithms-explained)
5. [Verdict Levels](#5-verdict-levels)
6. [Project Structure](#6-project-structure)
7. [API Endpoints Reference](#7-api-endpoints-reference)

---

## 1. Project Overview

ARGADS scans your research paper text against 50 published papers and gives a similarity score using a weighted combination of four algorithms. The system assigns a verdict of **CLEAN**, **LOW SIMILARITY**, **COPYRIGHT SUSPECTED**, or **COPYRIGHT CONFIRMED** based on the highest similarity score found.

**Key Features:**
- Secure login/registration with researcher ID
- Two ways to submit text: paste directly or upload a JSON file
- Full per-algorithm breakdown for every paper in the database
- Scan history with clickable rows to re-view any past result
- Paper database browser with keyword and author search

---

## 2. How to Run the Project

You need **Node.js** installed on your computer.

### Backend (runs on port 5000)

```bash
cd backend
npm install
npm start
```

You should see:
```
🔍 ARGADS Backend running on http://localhost:5000
📚 50 research papers loaded
```

### Frontend (runs on port 3000)

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

Then open your browser and go to: **http://localhost:3000**

> **Note:** Both the backend and frontend must be running at the same time. The frontend connects to the backend automatically via the Vite proxy configuration.

---

## 3. Complete User Guide

### Step 1: Register an Account

1. Go to **http://localhost:3000**
2. You will see the ARGADS login screen
3. Click the **"Register"** tab (top right of the form)
4. Fill in the following fields:
   - **Researcher ID** — your student/researcher ID (e.g., `24BCE1234`)
   - **Full Name** — your complete name
   - **Department** — select from the dropdown
   - **Email Address** — use your institutional email (e.g., `name@vit.ac.in`)
   - **Password** — minimum 6 characters
5. Click **"Create Account →"**
6. You will be automatically logged in and taken to the Dashboard

> You only need to register once. After that, use Sign In.

---

### Step 2: Sign In

1. Go to **http://localhost:3000**
2. Ensure you are on the **"Sign In"** tab (default)
3. Enter your registered **Email Address** and **Password**
4. Click **"Sign In →"**
5. You will be taken to the **Overview (Dashboard)**

---

### Step 3: Explore the Dashboard

The Dashboard (Overview tab) shows:

| Section | What it shows |
|---|---|
| **Statistics row** | Total Scans, Flagged Papers, Clean Passes, Your Researcher ID |
| **Recent Scan History** | Last 8 scans with scores and verdicts |
| **Detection Algorithms** | Description of all 4 algorithms and their weights |

If you have no scans yet, a prompt will appear with a **"Run First Scan →"** button.

---

### Step 4: Run a Detection Scan

1. Click **"Detection"** in the top navigation bar
2. You will see the **Detection Analysis** page

#### Fill in the form:

**Paper Title** *(required)*
- Enter the full title of your research paper
- Example: `"Deep Learning Approaches for Natural Language Processing"`

**Research Content** *(required — choose one method)*

**Option A — Paste Text:**
- Click **"✎ Paste Text"** button (selected by default)
- Paste your research abstract or paper text into the text area
- Minimum 20 words required
- A word counter shows your current count and how many more you need

**Option B — Upload JSON:**
- Click **"⊞ Upload JSON"** button
- Click the upload zone to browse for a `.json` file
- The JSON file must contain one of these fields:
  ```json
  { "abstract": "Your paper text here..." }
  ```
  or
  ```json
  { "text": "Your paper text here..." }
  ```
  or
  ```json
  { "content": "Your paper text here..." }
  ```
- Once uploaded, the word count is shown automatically
- Click **"✕ Remove"** to clear and upload a different file

3. Click **"⊕ Run Copyright Detection Scan"**
4. Wait a moment — the system analyses your text against all 50 papers
5. Results appear below the form automatically

---

### Step 5: Reading the Results

After a scan, three sections appear:

#### A. Verdict Banner

This is the most important result. It shows:
- **Verdict label** (e.g., COPYRIGHT CONFIRMED, CLEAN)
- **Highest similarity percentage** — the top match score across all 50 papers
- **Best match paper** — which paper matched most closely
- **Summary** — how many papers had >25% similarity

| Verdict | Score Range | Meaning |
|---|---|---|
| ◎ CLEAN | 0–24% | No significant similarity found |
| ◉ LOW SIMILARITY | 25–49% | Minor overlap, likely not plagiarism |
| ◇ COPYRIGHT SUSPECTED | 50–74% | Notable similarity — review carefully |
| ◈ COPYRIGHT CONFIRMED | 75–100% | High similarity — serious concern |

#### B. Significant Matches

Papers with >25% similarity are listed here as **expandable cards**. The first match is expanded by default. Each card shows:
- Paper title, author, journal, year
- A **progress bar** for each of the 4 algorithms
- The **weighted formula** showing exactly how the final score was calculated

Click any card header to expand or collapse it.

#### C. All Papers Table

All 50 papers sorted by similarity (highest first). Shows individual algorithm scores and the weighted total. Click **"Show All 50"** to see every paper.

---

### Step 6: Browse the Paper Database

1. Click **"Database"** in the navigation bar
2. All 50 papers are listed with their metadata
3. **Search** by title, author, research ID, or keyword using the search bar
4. Results update as you type

---

### Step 7: View Scan History & Full Breakdowns

1. Click **"History"** in the navigation bar
2. All your past scans are listed in a table
3. **Click any row** to open a full-detail modal

The **Scan Detail Modal** shows:
- The full Verdict Banner with similarity score
- All Significant Matches with expandable algorithm breakdowns
- The complete All Papers table with all 50 scores

> **Note:** Full breakdowns are only available for scans run after the system update. Older scans (recorded before this version) will show a notice.

Press **Escape** or click outside the modal to close it.

---

## 4. Detection Algorithms Explained

ARGADS uses four complementary algorithms, each contributing a different percentage to the final weighted score:

| Algorithm | Weight | Method | What it detects |
|---|---|---|---|
| **StyleBERT** | 35% | TF-IDF cosine similarity | Writing style, vocabulary frequency patterns |
| **GPTRadar** | 25% | Bigram + Trigram N-gram matching | Copied phrases and sentence fragments |
| **AuthorNet** | 20% | Title-topic cosine overlap | Thematic and topical similarity |
| **CoAuthorGraph** | 20% | Jaccard token set similarity | Exact word/token overlap |

**Final Score Formula:**
```
Final Score = (StyleBERT × 35%) + (GPTRadar × 25%) + (AuthorNet × 20%) + (CoAuthorGraph × 20%)
```

---

## 5. Verdict Levels

```
Score ≥ 75%  →  ◈ COPYRIGHT CONFIRMED   (critical — red)
Score ≥ 50%  →  ◇ COPYRIGHT SUSPECTED   (high — amber)
Score ≥ 25%  →  ◉ LOW SIMILARITY        (medium — gold)
Score  < 25%  →  ◎ CLEAN                (clean — green)
```

---

## 6. Project Structure

```
project/
├── backend/
│   ├── server.js          # Express API server
│   ├── papers.json        # 50 published research papers database
│   ├── users.json         # Registered users (auto-generated)
│   ├── scans.json         # Scan history with full results (auto-generated)
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx        # Main React application
    │   ├── index.css      # All styles
    │   └── main.jsx       # React entry point
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 7. API Endpoints Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new researcher |
| POST | `/api/auth/login` | No | Login, returns JWT token |
| GET | `/api/auth/me` | Yes | Get current user profile |
| GET | `/api/papers` | Yes | List all 50 papers |
| GET | `/api/papers/:id` | Yes | Get single paper by research_id |
| POST | `/api/detect` | Yes | Run detection scan |
| GET | `/api/scans` | Yes | Get current user's scan history |
| GET | `/api/scans/:id` | Yes | Get single scan with full results |
| GET | `/api/health` | No | Server health check |

**Authentication:** All protected endpoints require a `Bearer <token>` header (handled automatically by the frontend).

---

## Test Credentials

A test account is pre-created for quick evaluation:

| Field | Value |
|---|---|
| Email | `test@vit.ac.in` |
| Password | `test123` |

You can also create a new account using your own details via the **Register** tab.
These credentials are saved and can be reused in the future without any loss in data

---

*ARGADS · VIT Chennai · 2026*
