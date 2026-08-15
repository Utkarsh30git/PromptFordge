# PromptForge

An AI-powered prompt engineering and benchmarking platform that helps users create, analyze, optimize, version, run, and compare prompts using real AI performance metrics.

---

## Features

- Google Authentication
- Prompt Workspace
- Prompt Variables
- Prompt Version Control
- Version History and Restore
- AI Prompt Analysis
- AI Prompt Optimization
- AI-Powered Prompt Execution
- Prompt A/B Benchmarking
- Response Quality Evaluation
- Real Latency, Token and Cost Tracking
- Prompt Library
- Collections
- Favorites
- Search, Filtering and Sorting
- Analytics Dashboard
- User Settings and Profile
- Preset Avatars
- Credit-Based AI Usage
- User Authorization and Protected Resources
- Rate Limiting
- Input Validation
- MongoDB Atlas Integration
- OpenAI API Integration

---

## Tech Stack

### Frontend

- React.js
- Vite
- React Router
- Zustand
- Axios
- Framer Motion
- CSS

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Google Identity Services

### AI

- OpenAI API
- AI Prompt Optimization
- AI Prompt Quality Analysis
- LLM-based Response Evaluation

---

## Project Structure

```
PromptForge
│
├── client
│   ├── src
│   ├── public
│   └── package.json
│
├── server
│   ├── controllers
│   ├── routes
│   ├── models
│   ├── services
│   ├── middleware
│   ├── config
│   ├── utils
│   └── package.json
│
└── README.md
```

---

## Core Workflow

```text
Create Prompt
      ↓
Analyze
      ↓
Optimize
      ↓
Save Version
      ↓
Run Prompt
      ↓
Measure Performance
      ↓
Compare Versions
      ↓
Improve Prompt
```

---

## Prompt Variables

PromptForge supports reusable prompt templates using dynamic variables.

Example:

```text
You are interviewing a {{role}} candidate.

Generate {{count}} questions focused on {{technology}}.

The candidate has {{experience}} years of experience.
```

Variable values are provided during execution while the original prompt template remains unchanged.

---

## Prompt Versioning

PromptForge allows users to maintain multiple versions of the same prompt.

```text
v1
 ↓
v2
 ↓
v3
 ↓
v4
```

Users can view, preview, restore, and compare previous versions without losing their prompt history.

---

## Prompt Analysis

PromptForge analyzes prompts across different dimensions including:

- Clarity
- Specificity
- Context
- Structure
- Output Definition

The system provides an overall quality score along with actionable suggestions for improving the prompt.

---

## Prompt Optimization

Users can optimize an existing prompt using AI while preserving the original intent.

```text
Original Prompt
      ↓
Optimize
      ↓
Review
      ↓
Use Optimized Prompt
      ↓
Save New Version
```

---

## Prompt Benchmarking

PromptForge allows users to compare two prompt versions using the same test input.

```text
Prompt A ──────┐
               ├── Same Input → AI
Prompt B ──────┘
                    ↓
             Response A
             Response B
                    ↓
       Quality + Latency + Tokens + Cost
                    ↓
                  Winner
```

The comparison evaluates response quality, latency, token usage, estimated cost, and determines the stronger prompt version.

---

## Analytics

The analytics dashboard provides insights into prompt usage and performance.

- Total Prompt Runs
- Token Usage
- Estimated API Cost
- Average Latency
- Average Quality
- Prompt Performance
- Comparison Results
- Model Usage
- Recent Activity

---

## Prompt Library

The Prompt Library helps users manage and organize their prompts.

- Search Prompts
- Favorite Prompts
- Filter Prompts
- Sort Prompts
- Organize Prompts into Collections
- Open Prompts Directly in Workspace
- Manage Prompt Versions

---

## Authentication and Security

- Google Authentication
- JWT Authentication
- HTTP-only Cookies
- Protected Routes
- User Ownership Checks
- Backend Input Validation
- Rate Limiting
- Atomic Credit Handling
- Secure Error Handling
- Server-side OpenAI API Key Management
- Environment-based CORS Configuration

---

### Install Frontend

```bash
cd client
npm install
```

### Install Backend

```bash
cd ../server
npm install
```

---

## Run the Project

### Start Backend

```bash
cd server
npm run dev
```

### Start Frontend

Open another terminal:

```bash
cd client
npm run dev
```

Open the application

## Author

**Utkarsh Singh**

GitHub: https://github.com/Utkarsh30git



If you found this project useful, consider giving it a star!