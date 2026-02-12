// --- Layer 1: Sensor Layer (Perception) ---

class ViewportDOMObserver {
  static getVisibleText() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const rect = node.parentElement.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.left >= 0 &&
          rect.bottom <= window.innerHeight &&
          rect.right <= window.innerWidth;
        return isVisible ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    let text = "";
    while (walker.nextNode()) text += walker.currentNode.textContent + " ";
    return text.trim().substring(0, 2000); // Constraint
  }

  static getDOMStructure() {
    // Return a simplified structural map of the visible viewport
    return {
      type: 'structural-map',
      elements: Array.from(document.querySelectorAll('h1, h2, h3, p, a, button'))
        .filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.top >= 0 && rect.bottom <= window.innerHeight;
        })
        .map(el => ({ tag: el.tagName, text: el.innerText.substring(0, 50) }))
    };
  }
}

class MediaSensor {
  static captureMetadata() {
    const videos = Array.from(document.querySelectorAll('video'));
    return videos.map(v => ({
      src: v.src,
      currentTime: v.currentTime,
      duration: v.duration,
      paused: v.paused,
      muted: v.muted,
      playbackRate: v.playbackRate
    }));
  }
}

class InteractionSensor {
  constructor() {
    this.signals = {
      scrollDepth: 0,
      lastInteraction: null,
      dwellTimes: {}, // tag -> ms
      focusChanges: []
    };
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('scroll', () => {
      this.signals.scrollDepth = Math.max(this.signals.scrollDepth, window.scrollY);
    }, { passive: true });

    document.addEventListener('mouseover', (e) => {
      this.signals.lastInteraction = { type: 'hover', tag: e.target.tagName, time: Date.now() };
    });

    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection().toString();
      if (selection) this.signals.lastInteraction = { type: 'selection', length: selection.length, time: Date.now() };
    });
  }

  getSignals() {
    return { ...this.signals, timestamp: Date.now() };
  }
}

class ContentAnalyzer {
  constructor() {
    this.interactionSensor = new InteractionSensor();
    this.initialize();
  }

  async initialize() {
    console.log('AI Contextual Search content script initialized');

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });

    // Inject styles for the overlay
    this.injectStyles();

    // Inject analysis overlay
    this.injectOverlay();

    // Set up video observers
    this.setupVideoObservers();
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap');

      #ai-contextual-overlay {
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 2147483647;
        width: 380px;
        max-height: 80vh;
        background: rgba(17, 24, 39, 0.75);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 24px;
        color: #f9fafb;
        font-family: 'Outfit', 'Inter', sans-serif;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
        display: none;
        flex-direction: column;
        gap: 16px;
        animation: ai-slide-in 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
        overflow-y: auto;
      }

      @keyframes ai-slide-in {
        from { transform: translateX(400px) scale(0.9); opacity: 0; }
        to { transform: translateX(0) scale(1); opacity: 1; }
      }

      .ai-overlay-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 12px;
      }

      .ai-overlay-title {
        font-size: 18px;
        font-weight: 800;
        background: linear-gradient(to right, #22d3ee, #818cf8);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .ai-close-btn {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: #fff;
        width: 28px;
        height: 28px;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: 0.2s;
      }

      .ai-close-btn:hover { background: rgba(244, 63, 94, 0.2); color: #f43f5e; }

      .ai-entity-chip {
        display: inline-flex;
        align-items: center;
        padding: 6px 12px;
        background: rgba(99, 102, 241, 0.15);
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        color: #a5b4fc;
        cursor: pointer;
        transition: all 0.2s;
        margin: 4px;
      }

      .ai-entity-chip:hover {
        background: rgba(99, 102, 241, 0.3);
        transform: translateY(-2px);
        border-color: #818cf8;
      }

      .ai-source-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 14px;
        padding: 14px;
        margin-bottom: 12px;
        transition: 0.2s;
      }

      .ai-source-card:hover { background: rgba(255, 255, 255, 0.06); border-color: rgba(34, 211, 238, 0.3); }

      .ai-source-title { font-weight: 700; font-size: 14px; color: #fff; margin-bottom: 4px; }
      .ai-source-snippet { font-size: 13px; color: #9ca3af; line-height: 1.5; }

      .ai-analysis-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        background: rgba(17, 24, 39, 0.8);
        backdrop-filter: blur(8px);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 8px 16px;
        border-radius: 12px;
        cursor: pointer;
        z-index: 1000;
        font-family: 'Outfit', sans-serif;
        font-weight: 600;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      }

      .ai-analysis-btn:hover {
        background: #4f46e5;
        border-color: #6366f1;
        transform: scale(1.05);
      }
    `;
    document.head.appendChild(style);
  }

  injectOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'ai-contextual-overlay';
    document.body.appendChild(overlay);
  }

  setupVideoObservers() {
    // Watch for video elements on the page
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeName === 'VIDEO') this.setupVideoAnalysis(node);
            else if (node.querySelector && node.querySelector('video')) {
              node.querySelectorAll('video').forEach(v => this.setupVideoAnalysis(v));
            }
          });
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Also check existing videos
    document.querySelectorAll('video').forEach(video => this.setupVideoAnalysis(video));
  }

  setupVideoAnalysis(videoElement) {
    // Add analysis button to video controls
    if (videoElement.parentNode.querySelector('.ai-analysis-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'ai-analysis-btn';
    btn.innerHTML = '✨ AI Insight';

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.analyzeVideo(videoElement);
    });

    if (getComputedStyle(videoElement.parentNode).position === 'static') {
      videoElement.parentNode.style.position = 'relative';
    }
    videoElement.parentNode.appendChild(btn);
  }

  async analyzeVideo(videoElement) {
    try {
      // Capture current frame
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      const frameData = canvas.toDataURL('image/jpeg', 0.8);

      // Send to background for processing
      const response = await chrome.runtime.sendMessage({
        action: 'processContent',
        content: frameData,
        type: 'video-frame'
      });

      this.showAnalysisResults(response);
    } catch (error) {
      console.error('Error:', error);
      this.showError('Analysis unavailable');
    }
  }

  showAnalysisResults(analysis) {
    const overlay = document.getElementById('ai-contextual-overlay');
    overlay.innerHTML = `
      <div class="ai-overlay-header">
        <div class="ai-overlay-title">AI Scene Insights</div>
        <button class="ai-close-btn">✕</button>
      </div>
      <div>
        <p style="font-size: 13px; color: #9ca3af; margin-bottom: 12px;">Detected in current scene:</p>
        <div id="ai-entities-container"></div>
      </div>
      ${analysis.summary ? `
        <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 14px; padding: 14px;">
          <p style="font-size: 13px; line-height: 1.6;">${analysis.summary}</p>
        </div>
      ` : ''}
    `;

    const container = overlay.querySelector('#ai-entities-container');
    if (analysis.entities && analysis.entities.length > 0) {
      analysis.entities.forEach(entity => {
        const chip = document.createElement('div');
        chip.className = 'ai-entity-chip';
        chip.textContent = entity.text;
        chip.addEventListener('click', () => this.searchEntity(entity.text));
        container.appendChild(chip);
      });
    }

    overlay.querySelector('.ai-close-btn').addEventListener('click', () => {
      overlay.style.display = 'none';
    });

    overlay.style.display = 'flex';
  }

  async searchEntity(entity) {
    const overlay = document.getElementById('ai-contextual-overlay');
    const container = overlay.querySelector('#ai-entities-container');
    const originalContent = container.innerHTML;
    container.innerHTML = '<p style="font-size: 12px; color: #6366f1;">Searching intelligence sources...</p>';

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'processContent',
        content: entity,
        type: 'entity-search'
      });

      this.showSearchResults(response, entity);
    } catch (error) {
      container.innerHTML = originalContent;
      this.showError('Search failed');
    }
  }

  showSearchResults(results, query) {
    const overlay = document.getElementById('ai-contextual-overlay');

    let sourcesHtml = '';
    if (results.sources && results.sources.length > 0) {
      results.sources.forEach(source => {
        sourcesHtml += `
          <div class="ai-source-card">
            <div class="ai-source-title">${source.title || 'Source'}</div>
            <div class="ai-source-snippet">${source.snippet || 'No context available.'}</div>
          </div>
        `;
      });
    } else {
      sourcesHtml = '<p style="font-size: 13px; color: #9ca3af;">No specific sources found.</p>';
    }

    overlay.innerHTML = `
      <div class="ai-overlay-header">
        <div class="ai-overlay-title">Intel: ${query}</div>
        <button class="ai-close-btn">✕</button>
      </div>
      <div style="flex: 1; overflow-y: auto;">
        ${sourcesHtml}
      </div>
      <button id="ai-back-btn" style="background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 8px; border-radius: 10px; cursor: pointer; font-size: 13px;">← Back to Insights</button>
    `;

    overlay.querySelector('.ai-close-btn').addEventListener('click', () => {
      overlay.style.display = 'none';
    });

    overlay.querySelector('#ai-back-btn').addEventListener('click', () => {
      // For simplicity, we just close and re-trigger analysis or hide. 
      // In a real app we'd keep state.
      overlay.style.display = 'none';
    });

    overlay.style.display = 'flex';
  }

  showError(message) {
    const overlay = document.getElementById('ai-contextual-overlay');
    overlay.innerHTML = `<div style="color: #f43f5e; font-weight: 600; text-align: center; padding: 12px;">${message}</div>`;
    overlay.style.display = 'flex';
    setTimeout(() => { overlay.style.display = 'none'; }, 4000);
  }

  // Layer 1: Sensor Layer Perception
  collectPageContext() {
    return {
      sensor_data: {
        viewport_text: ViewportDOMObserver.getVisibleText(),
        structure: ViewportDOMObserver.getDOMStructure(),
        media: MediaSensor.captureMetadata(),
        interactions: this.interactionSensor.getSignals()
      },
      metadata: {
        title: document.title,
        url: window.location.href,
        timestamp: new Date().toISOString()
      },
      anonymized: true,
      short_lived: true
    };
  }

  async handleAnalyzePage() {
    this.showLoading('Analyzing page context...');

    const context = this.collectPageContext();

    try {
      const response = await this.sendMessageToBackground({
        action: 'processContent',
        content: context,
        type: 'page-context'
      });

      this.showAnalysisResults(response);
    } catch (error) {
      this.showError('Context analysis failed');
    }
  }

  sendMessageToBackground(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }

  showLoading(text) {
    const overlay = document.getElementById('ai-contextual-overlay');
    overlay.innerHTML = `<div style="text-align: center; padding: 24px;">
      <div class="ai-loading-spinner" style="width: 30px; height: 30px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #6366f1; border-radius: 50%; animation: ai-rotate 1s linear infinite; margin: 0 auto 12px;"></div>
      <p style="font-size: 14px; opacity: 0.8;">${text}</p>
    </div>`;
    overlay.style.display = 'flex';
  }

  async handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case 'captureVideoFrame':
        try {
          const video = document.querySelector(`video[src="${message.videoUrl}"]`) ||
            document.querySelector('video');

          if (video) {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const frameData = canvas.toDataURL('image/jpeg', 0.8);
            sendResponse({ frameData });
          } else {
            sendResponse({ error: 'Video not found' });
          }
        } catch (error) {
          sendResponse({ error: error.message });
        }
        break;

      case 'collectPageContext':
        sendResponse(this.collectPageContext());
        break;

      case 'showAnalysisResults':
        this.showAnalysisResults(message.analysis);
        sendResponse({ success: true });
        break;

      case 'showSearchResults':
        this.showSearchResults(message.results, message.query);
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ error: 'Unknown action' });
    }
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ContentAnalyzer();
  });
} else {
  new ContentAnalyzer();
}