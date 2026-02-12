// Background service worker for AI Contextual Search extension

class AIContextualSearch {
  constructor() {
    this.initialize();
  }

  async initialize() {
    console.log('AI Contextual Search background service worker initialized');
    
    // Set up context menu
    this.setupContextMenu();
    
    // Initialize storage
    await this.initializeStorage();
    
    // Set up message listeners
    this.setupMessageListeners();
  }

  setupContextMenu() {
    chrome.contextMenus.create({
      id: 'analyze-video',
      title: 'Analyze video context',
      contexts: ['video']
    });

    chrome.contextMenus.create({
      id: 'search-context',
      title: 'Search contextual information',
      contexts: ['selection']
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab);
    });
  }

  async initializeStorage() {
    const defaults = {
      privacyLevel: 'high',
      enabledModels: ['object-detection', 'face-recognition', 'text-analysis'],
      apiEndpoint: 'http://localhost:3001', // Local test server
      useLocalProcessing: true
    };

    const result = await chrome.storage.sync.get(Object.keys(defaults));
    const settings = { ...defaults, ...result };
    await chrome.storage.sync.set(settings);
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });
  }

  async handleContextMenuClick(info, tab) {
    switch (info.menuItemId) {
      case 'analyze-video':
        await this.analyzeVideo(tab.id, info.srcUrl);
        break;
      case 'search-context':
        await this.searchContext(tab.id, info.selectionText);
        break;
    }
  }

  async analyzeVideo(tabId, videoUrl) {
    try {
      // Capture video frame
      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'captureVideoFrame',
        videoUrl: videoUrl
      });

      if (response && response.frameData) {
        // Send to AI backend for analysis
        const analysis = await this.sendToBackend({
          type: 'video-analysis',
          frameData: response.frameData,
          videoUrl: videoUrl
        });

        // Show results
        await chrome.tabs.sendMessage(tabId, {
          action: 'showAnalysisResults',
          analysis: analysis
        });
      }
    } catch (error) {
      console.error('Error analyzing video:', error);
    }
  }

  async searchContext(tabId, text) {
    try {
      const results = await this.sendToBackend({
        type: 'context-search',
        query: text,
        tabId: tabId
      });

      await chrome.tabs.sendMessage(tabId, {
        action: 'showSearchResults',
        results: results
      });
    } catch (error) {
      console.error('Error searching context:', error);
    }
  }

  async sendToBackend(data) {
    const settings = await chrome.storage.sync.get(['apiEndpoint', 'privacyLevel']);
    
    // For privacy: mask sensitive data
    const maskedData = this.maskSensitiveData(data, settings.privacyLevel);
    
    const response = await fetch(`${settings.apiEndpoint}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(maskedData)
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    return await response.json();
  }

  maskSensitiveData(data, privacyLevel) {
    // Implement privacy masking based on level
    const masked = { ...data };
    
    if (privacyLevel === 'high') {
      // Remove or hash identifiable information
      if (masked.videoUrl) {
        masked.videoUrl = this.hashString(masked.videoUrl);
      }
      if (masked.tabId) {
        masked.tabId = this.hashString(masked.tabId.toString());
      }
    }
    
    return masked;
  }

  hashString(str) {
    // Simple hash for demonstration
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  async handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case 'getSettings':
        const settings = await chrome.storage.sync.get(null);
        sendResponse(settings);
        break;

      case 'updateSettings':
        await chrome.storage.sync.set(message.settings);
        sendResponse({ success: true });
        break;

      case 'processContent':
        const result = await this.processContent(message.content, message.type);
        sendResponse(result);
        break;

      default:
        sendResponse({ error: 'Unknown action' });
    }
  }

  async processContent(content, type) {
    // Process content locally or send to backend
    const settings = await chrome.storage.sync.get(['useLocalProcessing']);
    
    if (settings.useLocalProcessing && this.canProcessLocally(type)) {
      return this.processLocally(content, type);
    } else {
      return this.sendToBackend({
        type: 'content-processing',
        content: content,
        contentType: type
      });
    }
  }

  canProcessLocally(type) {
    // Check if we can process this type locally
    const localCapabilities = ['text-extraction', 'simple-object-detection'];
    return localCapabilities.includes(type);
  }

  processLocally(content, type) {
    // Simple local processing for demonstration
    switch (type) {
      case 'text-extraction':
        return {
          type: 'text',
          content: content,
          entities: this.extractEntities(content),
          summary: this.summarizeText(content)
        };
      default:
        return { type, content, processed: false };
    }
  }

  extractEntities(text) {
    // Simple entity extraction (for demonstration)
    const entities = [];
    const words = text.split(/\s+/);
    
    // Check for potential names, places, etc.
    words.forEach(word => {
      if (word.length > 3 && /^[A-Z]/.test(word)) {
        entities.push({
          text: word,
          type: 'potential-entity',
          confidence: 0.7
        });
      }
    });
    
    return entities;
  }

  summarizeText(text, maxLength = 200) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}

// Initialize the extension
const aiSearch = new AIContextualSearch();