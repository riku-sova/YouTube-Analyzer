# Test Checklist - Milestone 8: Final Testing

## 8.1 Functional Testing

### URL Format Tests

| # | URL Format | Example | Expected |
|---|------------|---------|----------|
| 1 | Standard watch | `https://www.youtube.com/watch?v=dQw4w9WgXcQ` | ✅ Extracts ID |
| 2 | Without https | `youtube.com/watch?v=dQw4w9WgXcQ` | ✅ Extracts ID |
| 3 | With www | `www.youtube.com/watch?v=dQw4w9WgXcQ` | ✅ Extracts ID |
| 4 | youtu.be | `https://youtu.be/dQw4w9WgXcQ` | ✅ Extracts ID |
| 5 | YouTube Shorts | `https://www.youtube.com/shorts/dQw4w9WgXcQ` | ✅ Extracts ID |
| 6 | Embed | `https://www.youtube.com/embed/dQw4w9WgXcQ` | ✅ Extracts ID |
| 7 | With timestamp | `youtube.com/watch?v=dQw4w9WgXcQ&t=120` | ✅ Extracts ID |
| 8 | With playlist | `youtube.com/watch?v=dQw4w9WgXcQ&list=PLxxx` | ✅ Extracts ID |

### Edge Case Tests

| # | Scenario | Input | Expected Error |
|---|----------|-------|----------------|
| 1 | Empty input | (empty) | "Please enter a YouTube URL" |
| 2 | Random text | "hello world" | "Invalid URL. Try: youtube.com/watch?v=VIDEO_ID..." |
| 3 | Non-YouTube URL | "https://vimeo.com/123456" | "Invalid YouTube URL format..." |
| 4 | Invalid video ID | "youtube.com/watch?v=INVALID" | "Video not found" |
| 5 | No API keys configured | (keys not set) | "⚙️ Please configure API keys in Settings first" |
| 6 | Wrong YouTube API key | (invalid key) | "YouTube API error: 400..." |
| 7 | Wrong Groq API key | (invalid key) | "Groq API error: 401..." |

### Validation Flow Tests

| # | Test | Expected |
|---|------|----------|
| 1 | Enter valid URL, blur | Green border (valid class) |
| 2 | Enter invalid URL, blur | Red border (invalid class) |
| 3 | Analyze video | Previous analysis cleared from storage |
| 4 | Open popup with saved analysis | Previous results displayed |
| 5 | Click analyze (no URL) | Error: "Please enter a YouTube URL" |

---

## 8.2 Performance Testing

| Metric | Target | Test Method |
|--------|--------|-------------|
| YouTube API call | < 3s | Console logs `[PERF] YouTube API: Xms` |
| Groq API call | < 7s | Console logs `[PERF] Groq API: Xms` |
| Total time | < 10s | Console logs `[PERF] Total: Xms` |

**Test Videos:**
- Short video (< 5 min): `dQw4w9WgXcQ`
- Medium video (5-15 min): Use any
- Long video (> 15 min): Use any

---

## Manual Test Execution

1. Load extension in Chrome (Developer mode → Load unpacked)
2. Open popup, test each URL format
3. Test edge cases with invalid inputs
4. Check console for `[PERF]` timing logs
5. Verify no JavaScript errors in console
