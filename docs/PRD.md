# Product Requirements Document (PRD)

## Product Name

Youtube Analyzer (Chrome / Chromium Extension)

---

## 1. Overview

Youtube Analyzer is a lightweight Chromium browser extension that allows users to input a YouTube video URL and receive a structured, AI-powered analysis of the video’s performance and quality.

The extension integrates with:

* YouTube Data API (for video metadata)
* Groq API (model: openai/gpt-oss-120b) for analysis

The goal of V1 (MVP) is to provide fast, consistent, and structured insights explaining why a video succeeded or failed, along with actionable improvements.

---

## 2. Goals & Objectives

### Primary Goals

* Provide instant analysis of any YouTube video via URL
* Deliver structured and consistent AI-generated insights
* Help creators understand performance drivers (success/failure)
* Suggest actionable improvements

### Success Metrics

* Analysis generated in < 10 seconds
* > 90% successful API responses
* Consistent structured output across videos
* User satisfaction (qualitative feedback)

---

## 3. Target Users

* YouTube content creators
* Social media managers
* Growth hackers / marketers
* Curious viewers analyzing viral content

---

## 4. Core Features (MVP)

### 4.1 Input

* User pastes YouTube video URL
* “Analyze” button triggers workflow

### 4.2 Data Extraction (YouTube Data API)

Fetch the following:

* Title
* Description
* Tags
* View count
* Like count
* Comment count
* Video duration
* Publish date
* Channel name

### 4.3 AI Analysis (Groq)

Send structured JSON to model:

* Model: openai/gpt-oss-120b
* Include all fetched metadata

### 4.4 Structured Output (VERY IMPORTANT)

The AI response MUST follow this strict format:

```
1. Summary
- Short overview of the video and its performance

2. Performance Evaluation
- Views vs expectations
- Engagement (likes/comments ratio)
- Retention assumptions (based on duration)

3. Strengths
- Bullet points

4. Weaknesses
- Bullet points

5. Why It Succeeded / Failed
- Clear reasoning based on data

6. Title Analysis
- Is it clickable?
- Suggestions

7. Thumbnail Assumptions
- Based on performance (even if not visible)

8. SEO Analysis
- Tags effectiveness
- Keyword usage

9. Improvement Suggestions
- Actionable bullet points

10. Final Score
- Score out of 10
- Short justification
```

⚠️ IMPORTANT:

* This structure must be enforced via prompt engineering
* Sections must ALWAYS appear
* No missing sections allowed

---

## 5. User Flow

1. User opens extension popup
2. If previous analysis exists → load from storage automatically
3. Pastes YouTube URL (or URL already populated)
4. Clicks "Analyze"
5. Extension:

   * Clears previous analysis from storage
   * Extracts video ID
   * Calls YouTube Data API
   * Formats response
   * Sends to Groq API
6. Receives AI response
7. Displays structured analysis in UI
8. Saves analysis to chrome.storage.local (persists until new analysis)

---

## 6. Technical Architecture

### 6.1 Frontend (Extension)

* Popup UI (HTML, CSS, JS)
* Input field + button
* Loading state
* Output display (formatted sections)

### 6.2 Backend Logic (Inside Extension or Service Worker)

#### Step 1: Parse Video ID

* Extract from URL

#### Step 2: Fetch YouTube Data

Endpoint:
[https://www.googleapis.com/youtube/v3/videos](https://www.googleapis.com/youtube/v3/videos)

Params:

* part=snippet,statistics,contentDetails
* id=VIDEO_ID
* key=API_KEY

#### Step 3: Format Data

Create JSON payload:

```
{
  "title": "...",
  "description": "...",
  "tags": [],
  "views": 0,
  "likes": 0,
  "comments": 0,
  "duration": "PT10M30S",
  "publishDate": "...",
  "channel": "..."
}
```

#### Step 4: Send to Groq

POST [https://api.groq.com/openai/v1/chat/completions](https://api.groq.com/openai/v1/chat/completions)

Headers:

* Authorization: Bearer API_KEY

Body:

```
{
  "model": "openai/gpt-oss-120b",
  "messages": [
    {
      "role": "system",
      "content": "You are a YouTube growth expert. Always follow the required structured format."
    },
    {
      "role": "user",
      "content": "Analyze this video data: {JSON}"
    }
  ]
}
```

---

## 7. Prompt Engineering (CRITICAL)

Use strict instruction prompt:

```
You MUST follow this structure exactly:
[Insert full structure]

Rules:
- Do NOT skip sections
- Do NOT merge sections
- Use bullet points where requested
- Be concise but insightful
- Base analysis ONLY on provided data
```

---

## 8. Settings Page (Chrome Storage)

Instead of hardcoded `.env` files, API keys are managed via a Settings page that stores keys in Chrome's local storage.

**Why Settings page:**
* User can configure keys without editing code
* Keys persist across browser sessions
* No secrets committed to repository
* Keys validated before save

---

## 9. Persistent Analysis

Analysis persists in `chrome.storage.local` for better UX:

**Storage Keys:**
* `lastVideoId` - The analyzed video ID
* `lastAnalysis` - The analysis text
* `lastAnalyzedAt` - Unix timestamp

**Behavior:**
* After analysis completes → save to storage
* On popup open → check storage and display if exists
* Before new analysis → clear previous from storage
* Persists across popup closes AND browser restarts
* Only cleared when user initiates new analysis

Instead of `.env`, keys are stored in Chrome's local storage via a Settings page.

**Settings Page UI:**
* Two password input fields (API keys hidden by default)
* Validation indicators (green checkmark for valid format)
* Save button with "✓ Settings saved!" feedback
* Links to Google Cloud Console and Groq Console

**Storage:**
* Keys stored in `chrome.storage.local`
* Keys: `youtube_api_key`, `groq_api_key`
* Persists across browser sessions

**Validation Rules:**
* YouTube API key: must start with "AIza", minimum 20 characters
* Groq API key: minimum 20 characters

---

## 10. UI/UX Requirements

### Layout

* Input field (URL)
* Analyze button
* Loading spinner
* Scrollable results panel

### Output Formatting

* Section headers bold
* Bullet points for lists
* Clean spacing

### States

* Idle
* Loading
* Success
* Error

---

## 11. Error Handling

* Invalid URL → show message
* Missing API keys → show "⚙️ Please configure API keys in Settings first"
* API failure → show error message
* No video data → show fallback message
* AI failure → show partial data or retry

---

## 11. Constraints

* Rate limits (YouTube API)
* Groq token limits
* Extension performance

---

## 13. Future Improvements (Post-MVP)

* Thumbnail image analysis (Vision model)
* Competitor comparison
* Channel-level analytics
* Save history
* Export reports (PDF)
* Multi-language support

---

## 14. Non-Goals (V1)

* No user authentication
* No database
* No real-time tracking
* No advanced ML beyond Groq

---

## 15. Risks

* Inconsistent AI output → mitigated via strict prompt
* API quota limits
* Slow response time

---

## 16. Timeline (Suggested)

* Day 1: Extension UI + URL parsing
* Day 2: YouTube API integration
* Day 3: Groq integration + prompt tuning
* Day 4: UI polish + testing

---

## 17. Definition of Done

* User can input URL
* Data fetched successfully
* AI analysis generated
* Output follows strict structure
* No major UI bugs

---

## 18. Summary

This MVP focuses on speed, simplicity, and structured insights. The key differentiator is NOT just analysis, but consistent, actionable, and structured feedback powered by AI.
