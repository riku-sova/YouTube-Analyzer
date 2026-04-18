const STORAGE_KEYS = {
  lastVideoId: 'lastVideoId',
  lastAnalysis: 'lastAnalysis',
  lastAnalyzedAt: 'lastAnalyzedAt',
  lastThumbnail: 'lastThumbnail',
  lastThumbnailAnalysis: 'lastThumbnailAnalysis',
  lastVideoUrl: 'lastVideoUrl',
  lastFinalSummary: 'lastFinalSummary',
  showFullAnalysis: 'showFullAnalysis',
  showThumbnail: 'showThumbnail'
};

let currentVideoId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const videoUrlInput = document.getElementById('videoUrl');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const errorMessage = document.getElementById('errorMessage');
  const resultsContainer = document.getElementById('results');
  const analysisContent = document.getElementById('analysisContent');

  const saved = await loadSavedAnalysis();
  if (saved) {
    videoUrlInput.value = saved.videoUrl || `https://www.youtube.com/watch?v=${saved.videoId}`;
    const showThumb = saved.showThumbnail !== false;
    const showFull = saved.showFullAnalysis !== false;
    
    if (showThumb && saved.thumbnail) {
      showThumbnailOnly(saved.thumbnail, saved.videoId);
    }
    if (showFull) {
      showResults(saved.analysis);
      if (saved.thumbnailAnalysis) {
        showThumbnailResults(saved.thumbnailAnalysis);
      }
    }
    if (saved.finalSummary) {
      showFinalSummary(saved.finalSummary);
    }
  }

  analyzeBtn.addEventListener('click', handleAnalyze);
  videoUrlInput.addEventListener('blur', handleLiveValidation);
  videoUrlInput.addEventListener('input', () => {
    if (!videoUrlInput.classList.contains('valid') && !videoUrlInput.classList.contains('invalid')) return;
    videoUrlInput.classList.remove('valid', 'invalid');
    hideError();
  });

  function handleLiveValidation() {
    const url = videoUrlInput.value.trim();
    if (!url) return;
    const cleanedUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
    const videoId = extractVideoId(cleanedUrl);
    if (videoId) {
      videoUrlInput.classList.add('valid');
      videoUrlInput.classList.remove('invalid');
    } else {
      videoUrlInput.classList.add('invalid');
      videoUrlInput.classList.remove('valid');
    }
  }

  async function loadSavedAnalysis() {
    return new Promise((resolve) => {
      chrome.storage.local.get([
        STORAGE_KEYS.lastVideoId,
        STORAGE_KEYS.lastAnalysis,
        STORAGE_KEYS.lastAnalyzedAt,
        STORAGE_KEYS.lastThumbnail,
        STORAGE_KEYS.lastThumbnailAnalysis,
        STORAGE_KEYS.lastVideoUrl,
        STORAGE_KEYS.lastFinalSummary,
        STORAGE_KEYS.showFullAnalysis,
        STORAGE_KEYS.showThumbnail
      ], (result) => {
        if (result[STORAGE_KEYS.lastAnalysis]) {
          resolve({
            videoId: result[STORAGE_KEYS.lastVideoId],
            analysis: result[STORAGE_KEYS.lastAnalysis],
            thumbnail: result[STORAGE_KEYS.lastThumbnail],
            thumbnailAnalysis: result[STORAGE_KEYS.lastThumbnailAnalysis],
            videoUrl: result[STORAGE_KEYS.lastVideoUrl],
            finalSummary: result[STORAGE_KEYS.lastFinalSummary],
            showFullAnalysis: result[STORAGE_KEYS.showFullAnalysis],
            showThumbnail: result[STORAGE_KEYS.showThumbnail]
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  async function handleAnalyze() {
    const url = videoUrlInput.value.trim();

    if (!url) {
      showError('Please enter a YouTube URL');
      return;
    }

    const cleanedUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
    const videoId = extractVideoId(cleanedUrl);

    if (!videoId) {
      if (url.length < 20) {
        showError('Invalid URL. Try: youtube.com/watch?v=VIDEO_ID or youtu.be/VIDEO_ID');
      } else {
        showError('Invalid YouTube URL format. Use a valid YouTube video link.');
      }
      return;
    }

    chrome.storage.local.remove([
      STORAGE_KEYS.lastVideoId,
      STORAGE_KEYS.lastAnalysis,
      STORAGE_KEYS.lastAnalyzedAt
    ]);

    hideError();
    videoUrlInput.classList.remove('valid', 'invalid');

    const youtubeKey = await getApiKey('youtube');
    const groqKey = await getApiKey('groq');

    if (!youtubeKey || !groqKey) {
      showError('⚙️ Please configure API keys in Settings first');
      return;
    }

    const startTime = performance.now();
    showLoading(true);
    analyzeBtn.disabled = true;

    try {
      const ytStart = performance.now();
      const videoData = await fetchYouTubeData(videoId);
      const ytEnd = performance.now();
      console.log(`[PERF] YouTube API: ${(ytEnd - ytStart).toFixed(0)}ms`);

      const aiStart = performance.now();
      const mainAnalysis = await analyzeWithAI(videoData);

      let thumbAnalysis = null;
      try {
        thumbAnalysis = await analyzeThumbnail(videoData.thumbnail);
      } catch (thumbErr) {
        console.error('[ERROR] Thumbnail analysis failed:', thumbErr);
      }
      const aiEnd = performance.now();
      console.log(`[PERF] Groq API (sequential): ${(aiEnd - aiStart).toFixed(0)}ms`);

      const finalStart = performance.now();
      const finalSummary = await generateFinalSummary(mainAnalysis, thumbAnalysis || 'Thumbnail analysis unavailable', videoData);
      const finalEnd = performance.now();
      console.log(`[PERF] Final Summary (120b): ${(finalEnd - finalStart).toFixed(0)}ms`);

      const totalEnd = performance.now();
      console.log(`[PERF] Total: ${(totalEnd - startTime).toFixed(0)}ms`);

      const showFull = await getShowFullAnalysis();
      const showThumb = await getShowThumbnail();
      
      if (showThumb) {
        showThumbnailOnly(videoData.thumbnail, videoId);
      }
      if (showFull) {
        showResults(mainAnalysis);
        if (thumbAnalysis) {
          showThumbnailResults(thumbAnalysis);
        } else {
          showThumbnailFallback();
        }
      }
      
      showFinalSummary(finalSummary);
    } catch (error) {
      showError(error.message);
    } finally {
      showLoading(false);
      analyzeBtn.disabled = false;
    }
  }

  function extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  async function fetchYouTubeData(videoId) {
    const apiKey = await getApiKey('youtube');
    const endpoint = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${apiKey}`;

    console.log('Fetching YouTube data for:', videoId);
    console.log('Endpoint:', endpoint);

    try {
      const response = await fetch(endpoint);
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('YouTube API error:', errorText);
        throw new Error(`YouTube API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('YouTube API response:', data);

      if (!data.items || data.items.length === 0) {
        throw new Error('Video not found - check if video ID is correct');
      }

      const item = data.items[0];
      const thumbnails = item.snippet.thumbnails;
      const thumbnail = 
        thumbnails.high?.url || 
        thumbnails.medium?.url || 
        thumbnails.default?.url;
      
      return {
        title: item.snippet.title,
        description: item.snippet.description,
        tags: item.snippet.tags || [],
        views: parseInt(item.statistics.viewCount, 10),
        likes: parseInt(item.statistics.likeCount, 10),
        comments: parseInt(item.statistics.commentCount, 10),
        duration: item.contentDetails.duration,
        publishDate: item.snippet.publishedAt,
        channel: item.snippet.channelTitle,
        thumbnail: thumbnail
      };
    } catch (err) {
      console.error('fetchYouTubeData error:', err);
      throw err;
    }
  }

  async function analyzeWithAI(videoData) {
    const apiKey = await getApiKey('groq');
    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

    const prompt = buildAnalysisPrompt(videoData);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          {
            role: 'system',
            content: 'You are a YouTube growth expert. Analyze video data and provide structured insights following the exact format specified. Always include all 10 sections with clear headers.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API error:', errorData);
      const errorMsg = errorData.error?.message || `Groq API error: ${response.status}`;
      throw new Error(errorMsg);
    }

    const data = await response.json();
    console.log('Groq API response:', data);

    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid AI response format - no choices returned');
    }

    const content = data.choices[0].message.content;
    if (!content || content.trim() === '') {
      throw new Error('AI returned empty response - try again');
    }

    return content;
  }

  async function generateFinalSummary(videoAnalysis, thumbnailAnalysis, videoData) {
    const apiKey = await getApiKey('groq');
    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

    const prompt = buildFinalSummaryPrompt(videoAnalysis, thumbnailAnalysis, videoData);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: 'You are a YouTube growth expert. Analyze both video and thumbnail analyses and provide a FINAL SUMMARY with combined score, key takeaways, and verdict. Use markdown formatting with headings.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content || content.trim() === '') {
      throw new Error('AI returned empty final summary');
    }

    return content;
  }

  function buildFinalSummaryPrompt(videoAnalysis, thumbnailAnalysis, videoData) {
    return `Based on the following Video Analysis and Thumbnail Analysis, provide a FINAL SUMMARY.

## Video Data
- Title: ${videoData.title}
- Channel: ${videoData.channel}
- Views: ${videoData.views.toLocaleString()}
- Likes: ${videoData.likes.toLocaleString()}
- Comments: ${videoData.comments.toLocaleString()}
- Duration: ${formatDuration(videoData.duration)}

## Video Analysis (10 sections)
${videoAnalysis}

## Thumbnail Analysis (8 sections)
${thumbnailAnalysis}

IMPORTANT: Create a FINAL SUMMARY with this EXACT structure using markdown:

## Combined Final Score
- Give ONE honest score from 0 to 20 based on YOUR assessment of the TOTAL video
- This is YOUR score - consider performance, title, thumbnail, content potential, SEO
- DO NOT calculate it as Video Score + Thumbnail Score addition
- Just give what YOU think this video deserves overall
- Brief justification (1-2 sentences)

## Key Takeaways
- Bullet points of the most important insights from both analyses

## Final Verdict
- Success/Failure prediction with clear reasoning
- What worked and what didn't

## Additional Insights
- Any other observations, suggestions, or notes you want to share
- What the creator should focus on next

Rules:
- Do NOT skip any section
- Do NOT merge sections
- Use markdown headings (##) for each section
- Be concise but insightful
- Base your verdict on the data provided`;
  }

  async function getShowFullAnalysis() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.showFullAnalysis], (result) => {
        resolve(result[STORAGE_KEYS.showFullAnalysis] !== false);
      });
    });
  }

  async function getShowThumbnail() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.showThumbnail], (result) => {
        resolve(result[STORAGE_KEYS.showThumbnail] !== false);
      });
    });
  }

  async function analyzeThumbnail(thumbnailUrl) {
    const apiKey = await getApiKey('groq');
    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are a YouTube thumbnail expert. Analyze the thumbnail image and provide structured insights following the exact format specified. Always include all 8 sections with clear headers.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: thumbnailUrl }
              }
            ]
          },
          {
            role: 'user',
            content: buildThumbnailPrompt()
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content || content.trim() === '') {
      throw new Error('AI returned empty thumbnail response');
    }

    return content;
  }

  function buildAnalysisPrompt(videoData) {
    const duration = formatDuration(videoData.duration);
    const formattedData = {
      title: videoData.title,
      description: videoData.description,
      tags: videoData.tags,
      views: videoData.views,
      likes: videoData.likes,
      comments: videoData.comments,
      duration: duration,
      publishDate: videoData.publishDate,
      channel: videoData.channel,
      thumbnail: videoData.thumbnail
    };

    return `Analyze this YouTube video and provide a structured response. Use ONLY the data provided.

Video Data:
${JSON.stringify(formattedData, null, 2)}

IMPORTANT: You MUST follow this exact structure:

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
- Based on performance

8. SEO Analysis
- Tags effectiveness
- Keyword usage

9. Improvement Suggestions
- Actionable bullet points

10. Final Score
- Score out of 10
- Short justification

Rules:
- Do NOT skip sections
- Do NOT merge sections
- Use bullet points where requested
- Be concise but insightful
- Base analysis ONLY on provided data`;
  }

  function buildThumbnailPrompt() {
    return `Analyze this YouTube thumbnail and provide a structured response using MARKDOWN FORMAT.

IMPORTANT: Use this exact structure with markdown headings:

## 1. Visual Hook
- What immediately grabs attention?

## 2. Clarity
- Is the subject clear at a glance?

## 3. Text Readability
- Is text readable on small screens?
- Font size, contrast, clutter

## 4. Emotional Appeal
- Does it trigger curiosity, urgency, or emotion?

## 5. CTR Strengths
- Use bullet points for each strength
- Keep each point concise

## 6. CTR Weaknesses
- Use bullet points for each weakness
- Keep each point concise

## 7. Improvement Suggestions
- Use bullet points for each suggestion
- Make them actionable

## 8. Thumbnail Score
- Score out of 10
- Short justification (1-2 sentences)

Rules:
- Do NOT skip sections
- Do NOT merge sections
- ALWAYS use markdown headings (##) for each section number
- ALWAYS use bullet points (-) for list sections (5, 6, 7)
- Write in full sentences for non-list sections (1, 2, 3, 4, 8)
- Analyze ONLY what is visible in the image`;
  }

  function formatDuration(isoDuration) {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return isoDuration;

    const hours = parseInt(match[1] || 0, 10);
    const minutes = parseInt(match[2] || 0, 10);
    const seconds = parseInt(match[3] || 0, 10);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  async function getApiKey(service) {
    return new Promise((resolve) => {
      chrome.storage.local.get([`${service}_api_key`], (result) => {
        resolve(result[`${service}_api_key`] || '');
      });
    });
  }

  function showLoading(isLoading) {
    if (isLoading) {
      loadingIndicator.classList.remove('hidden');
      resultsContainer.classList.add('hidden');
      document.getElementById('thumbnailSection').classList.add('hidden');
      document.getElementById('thumbnailAnalysisSection').classList.add('hidden');
      document.getElementById('finalSummarySection').classList.add('hidden');
      errorMessage.classList.add('hidden');
    } else {
      loadingIndicator.classList.add('hidden');
    }
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    resultsContainer.classList.add('hidden');
    document.getElementById('thumbnailSection').classList.add('hidden');
    document.getElementById('thumbnailAnalysisSection').classList.add('hidden');
    document.getElementById('finalSummarySection').classList.add('hidden');
  }

  function hideError() {
    errorMessage.classList.add('hidden');
  }

  function showResults(analysis) {
    const html = marked.parse(analysis);
    analysisContent.innerHTML = html;
    resultsContainer.classList.remove('hidden');

    chrome.storage.local.set({
      [STORAGE_KEYS.showFullAnalysis]: true
    });
  }

  function showThumbnailOnly(thumbnail, videoId) {
    document.getElementById('thumbnailDisplay').src = thumbnail;
    document.getElementById('thumbnailLink').href = `https://www.youtube.com/watch?v=${videoId}`;
    document.getElementById('thumbnailSection').classList.remove('hidden');

    chrome.storage.local.set({
      [STORAGE_KEYS.lastThumbnail]: thumbnail,
      [STORAGE_KEYS.lastVideoId]: videoId,
      [STORAGE_KEYS.showThumbnail]: true
    });
  }

  function showThumbnailResults(analysis) {
    const html = marked.parse(analysis);
    const contentEl = document.getElementById('thumbnailAnalysisContent');
    contentEl.innerHTML = html;
    
    const sections = contentEl.querySelectorAll('section');
    for (const section of sections) {
      const h2 = section.querySelector('h2');
      if (h2 && h2.textContent.includes('Thumbnail Score')) {
        const p = section.querySelector('p');
        if (p) {
          p.classList.add('thumbnail-score');
        }
        break;
      }
    }
    document.getElementById('thumbnailAnalysisSection').classList.remove('hidden');

    chrome.storage.local.set({
      [STORAGE_KEYS.lastThumbnailAnalysis]: analysis,
      [STORAGE_KEYS.showFullAnalysis]: true
    });
  }

  function showThumbnailFallback() {
    const contentEl = document.getElementById('thumbnailAnalysisContent');
    contentEl.innerHTML = '<p style="color: #888; font-style: italic;">Thumbnail analysis unavailable</p>';
    document.getElementById('thumbnailAnalysisSection').classList.remove('hidden');
  }

  async function showFinalSummary(analysis) {
    const html = marked.parse(analysis);
    const contentEl = document.getElementById('finalSummaryContent');
    contentEl.innerHTML = html;
    
    const sections = contentEl.querySelectorAll('section');
    for (const section of sections) {
      const h2 = section.querySelector('h2');
      if (h2 && h2.textContent.includes('Combined Final Score')) {
        const p = section.querySelector('p');
        if (p) {
          p.classList.add('final-score');
        }
        break;
      }
    }
    document.getElementById('finalSummarySection').classList.remove('hidden');

    const showFull = await getShowFullAnalysis();
    const showThumb = await getShowThumbnail();
    chrome.storage.local.set({
      [STORAGE_KEYS.lastFinalSummary]: analysis,
      [STORAGE_KEYS.showFullAnalysis]: showFull,
      [STORAGE_KEYS.showThumbnail]: showThumb
    });
  }
});
