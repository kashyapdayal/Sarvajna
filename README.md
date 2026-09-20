# Sarvajña — The Ultimate Exam Passer

> **An AI-directed cognitive rescue system for students who have hours left, not weeks.**

## Overview

**Sarvajña** is an adaptive AI learning system designed for high-stakes, last-minute exam preparation.

Instead of giving every student the same content, Sarvajña analyzes their **Content grasping power, knowledge, available time, target score, and exam evidence** to decide what they should learn next.

**Don't study everything. Study what matters.**

## Problem Statement

When exams are near, students often:

* Waste time studying low-value topics
* Re-read instead of actively recalling
* Don't know what to prioritize
* Overestimate their understanding
* Sacrifice sleep for more study time

The real problem isn't lack of content — it's **making the right learning decisions under extreme time constraints**.

## Solution

Sarvajña turns last-minute preparation into an adaptive optimization loop:

**Analyze → Prioritize → Learn → Retrieve → Diagnose → Reinforce → Sleep**

It continuously adapts the learning path based on student performance and remaining time.

## Features

*  **Real-time Grasping Index** — measures actual understanding
*  **Mark-Density Prioritization** — finds the highest-value topics
*  **Adaptive Explanations** — adjusts complexity to the learner
*  **Active Retrieval** — MCQs, flashcards, PYQs & written answers
*  **AI Answer Evaluation** — analyzes written answers and missing concepts
*  **PYQ Intelligence** — identifies recurring concepts and patterns
*  **Micro-Spacing Queue** — automatically re-tests weak concepts
*  **Multilingual Simplification** — simplifies difficult concepts
*  **Sleep-Protected Scheduling** — prioritizes retention over burnout
*  **Emergency Survival Sheet** — final high-yield revision

## Tech Stack

**Frontend**

* Next.js
* React
* TypeScript
* CSS
* Web Audio API

**Backend**

* Next.js App Router
* API Routes
* Background ingestion worker

**Database**

* Supabase
* PostgreSQL
* Supabase Auth
* Row-Level Security

**AI**

* OpenAI-compatible API
* OpenAI / Gemini / Groq / Ollama
* AI curriculum synthesis
* Answer evaluation
* Adaptive learning
* Multilingual simplification

**Other**

* Zod
* Mermaid
* Git / GitHub
* PDF / TXT / Markdown ingestion

## Codex / OpenAI Usage

OpenAI/Codex was used throughout development for:

* Product ideation and feature design
* Architecture planning
* React / Next.js development
* TypeScript and API implementation
* Debugging
* AI workflow design
* UI/UX iteration
* Documentation

OpenAI is also part of the **actual Sarvajña learning engine**, powering curriculum synthesis, explanations, evaluation, simplification, and adaptive feedback.

## Screenshots

Add screenshots to:

```text
docs/screenshots/
├── dashboard.png
├── portion-selection.png
├── evidence-board.png
├── active-practice.png
├── grasping-telemetry.png
└── survival-sheet.png
```

Example:

![Sarvajña Dashboard](docs/screenshots/dashboard.png)

![Evidence Board](docs/screenshots/evidence-board.png)

![Active Practice](docs/screenshots/active-practice.png)

## Setup

### Requirements

* Node.js 18.17+ / 20+
* npm 9+ or pnpm
* AI API key
* Supabase account *(optional for demo/mock mode)*

### Installation

```bash
git clone https://github.com/kashyapdayal/Sarvajna.git
cd Sarvajna
npm install
```

Create your environment file:

```bash
cp .env.example .env.local
```

Configure your AI/Supabase credentials, then run:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Demo

### Live Demo

**Coming soon**

`https://your-deployment-url.example`

### Demo / Pitch Video

**Coming soon**

`https://your-video-link.example`

## What Makes Sarvajña Different?

Most AI learning tools ask:

> **"What do you want to learn?"**
> **"They have predefined general teaching method for last minute preparations, so  they wont consider individual preparation."** 

Sarvajña asks:

> **"What can you realistically learn, retrieve, and retain before your exam?"**

It isn't another AI note generator.

**It's an adaptive decision engine for the final hours before an exam.**

## Roadmap

* Personalized long-term learning paths
* Advanced exam-pattern analytics
* Offline emergency study mode
* Native mobile application
* More languages
* University/instructor dashboards
* Improved Learning Twin

---

### Philosophy

> **You don't need more content.**
>
> **You need better decisions about what to learn, proof that you can retrieve it, and enough sleep to remember it.**

**Sarvajña — Turn the last few hours into the right hours.**
