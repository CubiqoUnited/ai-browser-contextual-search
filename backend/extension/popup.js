// Popup script for AI Contextual Search extension

class PopupManager {
  constructor() {
    this.settings = {};
    this.models = [];
    this.history = [];
    this.initialize();
  }

  async initialize() {
    console.log('Popup initialized');

    // Load settings
    await this.loadSettings();

    // Load models
    await this.loadModels();

    // Load history
    await this.loadHistory();

    // Set up event listeners
    this.setupEventListeners();

    // Update UI
    this.updateUI();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'autoAnalyze',
        'showOverlay',
        'localProcessing',
        'privacyLevel'
      ]);

      this.settings = {
        autoAnalyze: result.autoAnalyze !== false,
        showOverlay: result.showOverlay !== false,
        localProcessing: result.localProcessing !== false,
        privacyLevel: result.privacyLevel || 'medium'
      };
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = this.getDefaultSettings();
    }
  }

  getDefaultSettings() {
    return {
      autoAnalyze: true,
      showOverlay: true,
      localProcessing: true,
      privacyLevel: 'medium'
    };
  }

  async loadModels() {
    try {
      const result = await chrome.storage.sync.get(['enabledModels']);
      const enabledModels = result.enabledModels || [
        'object-detection',
        'face-recognition',
        'text-analysis',
        'scene-understanding'
      ];

      this.models = [
        {
          id: 'object-detection',
          name: 'Object Detection',
          description: 'Detects objects in images/videos',
          enabled: enabledModels.includes('object-detection')
        },
        {
          id: 'face-recognition',
          name: 'Face Recognition',
          description: 'Identifies faces and facial features',
          enabled: enabledModels.includes('face-recognition')
        },
        {
          id: 'text-analysis',
          name: 'Text Analysis',
          description: 'Analyzes and extracts text content',
          enabled: enabledModels.includes('text-analysis')
        },
        {
          id: 'scene-understanding',
          name: 'Scene Understanding',
          description: 'Understands scene context and relationships',
          enabled: enabledModels.includes('scene-understanding')
        },
        {
          id: 'content-aggregation',
          name: 'Content Aggregation',
          description: 'Aggregates content from multiple sources',
          enabled: enabledModels.includes('content-aggregation')
        },
        {
          id: 'privacy-filter',
          name: 'Privacy Filter',
          description: 'Applies privacy-preserving filters',
          enabled: enabledModels.includes('privacy-filter')
        }
      ];
    } catch (error) {
      console.error('Error loading models:', error);
      this.models = [];
    }
  }

  async loadHistory() {
    try {
      const result = await chrome.storage.local.get(['analysisHistory']);
      this.history = result.analysisHistory || [];

      // Limit to last 10 items
      this.history = this.history.slice(-10).reverse();
    } catch (error) {
      console.error('Error loading history:', error);
      this.history = [];
    }
  }

  setupEventListeners() {
    // Quick action buttons
    document.getElementById('analyzePage').addEventListener('click', () => {
      this.analyzeCurrentPage();
    });

    document.getElementById('searchVideo').addEventListener('click', () => {
      this.analyzeVideo();
    });

    document.getElementById('privacyMode').addEventListener('click', () => {
      this.togglePrivacyMode();
    });

    // Settings checkboxes
    document.getElementById('autoAnalyze').addEventListener('change', (e) => {
      this.updateSetting('autoAnalyze', e.target.checked);
    });

    document.getElementById('showOverlay').addEventListener('change', (e) => {
      this.updateSetting('showOverlay', e.target.checked);
    });

    document.getElementById('localProcessing').addEventListener('change', (e) => {
      this.updateSetting('localProcessing', e.target.checked);
    });

    document.getElementById('privacyLevel').addEventListener('change', (e) => {
      this.updateSetting('privacyLevel', e.target.value);
    });

    // Footer buttons
    document.getElementById('viewAll').addEventListener('click', () => {
      this.viewAllResults();
    });

    document.getElementById('settings').addEventListener('click', () => {
      this.openAdvancedSettings();
    });
  }

  updateUI() {
    // Update checkboxes
    document.getElementById('autoAnalyze').checked = this.settings.autoAnalyze;
    document.getElementById('showOverlay').checked = this.settings.showOverlay;
    document.getElementById('localProcessing').checked = this.settings.localProcessing;
    document.getElementById('privacyLevel').value = this.settings.privacyLevel;

    // Update models list
    this.renderModels();

    // Update history list
    this.renderHistory();

    // Update status
    this.updateStatus();
  }

  renderModels() {
    const container = document.getElementById('modelsList');
    container.innerHTML = '';

    this.models.forEach(model => {
      const item = document.createElement('div');
      item.className = 'model-item';
      item.innerHTML = `
        <div class="model-info">
          <div class="model-name">${model.name}</div>
          <div class="model-status">${model.description}</div>
        </div>
        <label class="model-toggle">
          <input type="checkbox" ${model.enabled ? 'checked' : ''} data-model="${model.id}">
          <span class="model-toggle-slider"></span>
        </label>
      `;

      // Add event listener for toggle
      const checkbox = item.querySelector('input');
      checkbox.addEventListener('change', (e) => {
        this.toggleModel(model.id, e.target.checked);
      });

      container.appendChild(item);
    });
  }

  renderHistory() {
    const container = document.getElementById('historyList');

    if (this.history.length === 0) {
      container.innerHTML = '<div class="history-item"><div class="history-title">No recent analysis</div></div>';
      return;
    }

    container.innerHTML = '';

    this.history.forEach(item => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      historyItem.innerHTML = `
        <div class="history-title">${this.truncateText(item.query || item.type, 40)}</div>
        <div class="history-time">${this.formatTime(item.timestamp)}</div>
      `;

      historyItem.addEventListener('click', () => {
        this.viewHistoryItem(item);
      });

      container.appendChild(historyItem);
    });
  }

  updateStatus() {
    const indicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');

    let status = 'Ready';
    let color = '#4CAF50';

    if (!this.settings.localProcessing) {
      status = 'Using cloud processing';
      color = '#FF9800';
    }

    if (this.settings.privacyLevel === 'high') {
      status = 'Maximum privacy mode';
      color = '#2196F3';
    }

    indicator.style.background = color;
    statusText.textContent = status;
  }

  async analyzeCurrentPage() {
    try {
      this.showLoading('analyzePage', 'Deep Synthesis...');

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Capture rich context from content script
      const context = await chrome.tabs.sendMessage(tab.id, {
        action: 'collectPageContext'
      });

      this.showNotification('Quantum context captured. Launching Plasma UI...', 'success');

      // In a real app, this would be a hosted URL. For this demo, we'll open a view that represents the masterpiece.
      const plasmaUrl = `https://ai-browser-plasma-ui.vercel.app/synthesis?q=${encodeURIComponent(tab.title)}&context=${encodeURIComponent(JSON.stringify(context))}`;

      chrome.tabs.create({ url: plasmaUrl });
    } catch (error) {
      console.error('Error analyzing page:', error);
      this.showNotification('Failed to launch Deep Synthesis', 'error');
    } finally {
      this.hideLoading('analyzePage', '📄 Deep Synthesis');
    }
  }

  async analyzeVideo() {
    try {
      this.showLoading('searchVideo', 'Searching...');

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'analyzeVideo'
      });

      if (response && response.success) {
        this.showNotification('Video analysis started');
        this.addToHistory({
          type: 'video-analysis',
          query: 'Video analysis',
          timestamp: Date.now()
        });
      } else {
        this.showNotification('No video found on page', 'error');
      }
    } catch (error) {
      console.error('Error analyzing video:', error);
      this.showNotification('Failed to analyze video', 'error');
    } finally {
      this.hideLoading('searchVideo', '🎥 Analyze Video');
    }
  }

  async togglePrivacyMode() {
    const currentLevel = this.settings.privacyLevel;
    let newLevel;

    switch (currentLevel) {
      case 'low':
        newLevel = 'medium';
        break;
      case 'medium':
        newLevel = 'high';
        break;
      case 'high':
        newLevel = 'low';
        break;
      default:
        newLevel = 'medium';
    }

    await this.updateSetting('privacyLevel', newLevel);
    this.showNotification(`Privacy mode: ${newLevel}`);
  }

  async updateSetting(key, value) {
    this.settings[key] = value;
    await chrome.storage.sync.set({ [key]: value });
    this.updateStatus();
  }

  async toggleModel(modelId, enabled) {
    try {
      const result = await chrome.storage.sync.get(['enabledModels']);
      let enabledModels = result.enabledModels || [];

      if (enabled) {
        if (!enabledModels.includes(modelId)) {
          enabledModels.push(modelId);
        }
      } else {
        enabledModels = enabledModels.filter(id => id !== modelId);
      }

      await chrome.storage.sync.set({ enabledModels });
      this.showNotification(`${enabled ? 'Enabled' : 'Disabled'} ${modelId}`);
    } catch (error) {
      console.error('Error toggling model:', error);
      this.showNotification('Failed to update model', 'error');
    }
  }

  async addToHistory(item) {
    try {
      const result = await chrome.storage.local.get(['analysisHistory']);
      let history = result.analysisHistory || [];

      history.push(item);

      // Keep only last 50 items
      if (history.length > 50) {
        history = history.slice(-50);
      }

      await chrome.storage.local.set({ analysisHistory: history });
      await this.loadHistory();
      this.renderHistory();
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  }

  viewHistoryItem(item) {
    // Open results in a new tab or show detailed view
    chrome.tabs.create({
      url: chrome.runtime.getURL('results.html') + `?id=${item.id || Date.now()}`
    });
  }

  viewAllResults() {
    chrome.tabs.create({
      url: chrome.runtime.getURL('results.html')
    });
  }

  openAdvancedSettings() {
    chrome.tabs.create({
      url: chrome.runtime.getURL('settings.html')
    });
  }

  showLoading(buttonId, text) {
    const button = document.getElementById(buttonId);
    button.classList.add('loading');
    button.textContent = text;
    button.disabled = true;
  }

  hideLoading(buttonId, originalText) {
    const button = document.getElementById(buttonId);
    button.classList.remove('loading');
    button.textContent = originalText;
    button.disabled = false;
  }

  showNotification(message, type = 'success') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.background = type === 'error' ? '#f44336' : '#4CAF50';

    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  truncateText(text, maxLength) {
    if (!text) return 'Unknown';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString();
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});