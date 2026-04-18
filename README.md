# 🔍 YouTube Analyzer

AI-powered Chromium extension that analyzes YouTube videos and provides deep insights on performance, SEO, and thumbnail effectiveness.

---

## 🚀 Features

* 📊 **Video Performance Analysis**

  * Views, likes, comments, duration insights
  * Engagement evaluation

* 🧠 **AI-Powered Insights**

  * Structured analysis (10 sections)
  * Clear strengths & weaknesses

* 🖼️ **Thumbnail Analysis (Vision AI)**

  * Visual hook, clarity, emotional appeal
  * CTR strengths & weaknesses
  * Thumbnail score

* 🧾 **Final Summary**

  * Combined score (out of 20)
  * Key takeaways
  * Actionable insights

* ⚙️ **Custom Settings**

  * Toggle full analysis / thumbnail display
  * Save API keys locally

---

## 🧱 Tech Stack

* JavaScript (Vanilla)
* Chrome Extension APIs
* YouTube Data API v3
* Groq API (LLM + Vision Models)
* Marked.js (Markdown rendering)

---

## 📦 Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/YouTube-Analyzer.git
```

2. Open Chrome and go to:

```
chrome://extensions/
```

3. Enable **Developer Mode**

4. Click **Load unpacked**

5. Select:

```
youtube-analyzer-extension/
```

---

## ⚙️ Setup

1. Open the extension
2. Go to ⚙️ Settings
3. Add:

   * YouTube Data API Key
   * Groq API Key

---

## 🧠 How It Works

1. Paste a YouTube video URL
2. The extension:

   * Fetches video data from YouTube API
   * Runs AI analysis (Groq)
   * Analyzes thumbnail using vision model
3. Displays:

   * Full analysis
   * Thumbnail insights
   * Final summary

---

## 📚 Documentation

* Product Requirements → `docs/PRD.md`
* Development Tasks → `docs/TASKS.md`
* Testing → `docs/TEST_CHECKLIST.md`
* Thumbnail Feature → `docs/THUMB_PRD.md`

---

## ⚠️ Notes

* API keys are stored locally using Chrome storage
* No backend is used (client-side only)
* Performance depends on API response time

---

## 🛣️ Future Improvements

* A/B thumbnail comparison
* CTR prediction using real data
* UI enhancements
* Multi-video comparison
* Export reports

---

## 👤 Author

**Yosef Ahmed** (aka Riku Rio)  
GitHub: https://github.com/riku-rio

---

## ⭐ Support

If you like this project, consider giving it a star ⭐
