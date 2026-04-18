# Thumbnail Analysis PRD (V1.5)

## Overview

Thumbnail Analysis is an extension feature for YTaz that uses a vision-capable AI model (Groq) to analyze YouTube video thumbnails and predict their performance, especially Click-Through Rate (CTR).

This feature complements metadata-based analysis by adding visual intelligence.

---

## Goal

Provide structured, actionable insights about a video's thumbnail to help understand:
- Why it attracts (or fails to attract) clicks
- How it can be improved

---

## Non-Goals (V1)

- No image editing/generation
- No A/B testing
- No real CTR prediction with historical data
- No backend storage

---

## Input

- Thumbnail URL (from YouTube Data API)
  - Source: `snippet.thumbnails.high.url`

---

## Output (STRICT STRUCTURE)

The AI MUST return exactly the following sections:

```
1. Visual Hook
- What immediately grabs attention?

2. Clarity
- Is the subject clear at a glance?

3. Text Readability
- Is text readable on small screens?
- Font size, contrast, clutter

4. Emotional Appeal
- Does it trigger curiosity, urgency, or emotion?

5. CTR Strengths
- Bullet points

6. CTR Weaknesses
- Bullet points

7. Improvement Suggestions
- Actionable bullet points

8. Thumbnail Score
- Score out of 10
- Short justification
```

---

## Functional Requirements

### 1. Thumbnail Extraction
- Extract thumbnail URL from YouTube API response
- Use highest quality available (`high`)

---

### 2. Vision API Integration
- Use Groq Vision-capable model (e.g. `llama-4-scout`)
- Send:
  - Image URL
  - Structured prompt
- Receive text response

---

### 3. Prompt Enforcement
- Enforce strict section format
- Prevent missing/merged sections
- Ensure consistent output across requests

---

### 4. Integration with Existing Flow

Two possible approaches:

#### Option A (Recommended for V1):
- Add Thumbnail Analysis as **Section 11**
- Do NOT modify existing 10-section format

#### Option B (Future):
- Replace "Thumbnail Assumptions" with real analysis

---

### 5. UI Integration
- Render as a new section in results
- Use same styling as other sections
- Highlight "Thumbnail Score"

---

## Technical Design

### Data Flow

```
User Input URL
      ↓
Extract Video ID
      ↓
Fetch YouTube Data
      ↓
Get Thumbnail URL
      ↓
Parallel Execution:
    → Analyze Metadata (existing)
    → Analyze Thumbnail (new)
      ↓
Merge Results
      ↓
Render UI
```

---

### Performance Requirements

- Thumbnail analysis must add ≤ 5 seconds
- Prefer parallel execution with metadata analysis
- Avoid blocking UI

---

## Prompt Design (Critical)

The prompt MUST:

- Explicitly define all 8 sections
- Use bullet points where required
- Prevent hallucination beyond visible elements
- Focus on:
  - composition
  - contrast
  - subject clarity
  - emotional triggers
  - CTR likelihood

---

## Constraints

- Must work fully client-side
- Uses same Groq API key
- No backend allowed (MVP constraint)
- Image must be passed via URL (no upload)

---

## Error Handling

- Invalid thumbnail URL → fallback message
- Vision API failure → show partial analysis
- Timeout → skip thumbnail section gracefully

---

## Risks

- AI hallucinating unseen details
- Inconsistent scoring
- Slower total response time

Mitigation:
- Strict prompt
- Structured output
- Parallel execution

---

## Future Improvements

- Real CTR prediction using data
- Thumbnail comparison (A/B)
- Detect faces, objects, text automatically
- Suggest redesigned thumbnails (image generation)
- Heatmap-style attention prediction

---

## Definition of Done

- Thumbnail URL successfully extracted
- Vision API returns structured response
- Output matches required format (8 sections)
- Appears correctly in UI
- No major delay introduced
- No breaking changes to existing system

---

## Summary

This feature upgrades YTaz from a metadata analyzer to a **visual + data intelligence tool**, significantly increasing insight quality and perceived value.
