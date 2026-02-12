// Main Electron application for AI Browser
const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const { AIEngine } = require('./ai/engine');
const { PrivacyManager } = require('./privacy/manager');
const { ContentAggregator } = require('./content/aggregator');

class AIBrowser {
  constructor() {
    this.mainWindow = null;
    this.aiEngine = new AIEngine();
    this.privacyManager = new PrivacyManager();
    this.contentAggregator = new ContentAggregator();
    this.isDev = process.env.NODE_ENV === 'development';
    
    this.initialize();
  }

  initialize() {
    app.whenReady().then(() => {
      this.createWindow();
      this.setupIPC();
      this.setupSession();
      this.setupAutoUpdater();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: true,
        allowRunningInsecureContent: false
      },
      icon: path.join(__dirname, '../public/icons/icon.png'),
      title: 'AI Browser',
      show: false,
      backgroundColor: '#1a1a1a'
    });

    // Load the main interface
    if (this.isDev) {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../public/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      this.sendInitialState();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Handle navigation
    this.mainWindow.webContents.on('did-navigate', (event, url) => {
      this.onPageNavigate(url);
    });

    this.mainWindow.webContents.on('did-finish-load', () => {
      this.onPageLoaded();
    });
  }

  setupIPC() {
    // Browser actions
    ipcMain.handle('browser:navigate', (event, url) => {
      return this.navigateTo(url);
    });

    ipcMain.handle('browser:back', () => {
      if (this.mainWindow.webContents.canGoBack()) {
        this.mainWindow.webContents.goBack();
        return true;
      }
      return false;
    });

    ipcMain.handle('browser:forward', () => {
      if (this.mainWindow.webContents.canGoForward()) {
        this.mainWindow.webContents.goForward();
        return true;
      }
      return false;
    });

    ipcMain.handle('browser:reload', () => {
      this.mainWindow.webContents.reload();
      return true;
    });

    ipcMain.handle('browser:home', () => {
      return this.navigateTo('https://www.google.com');
    });

    // AI analysis
    ipcMain.handle('ai:analyze-video', async (event, videoData) => {
      return await this.analyzeVideo(videoData);
    });

    ipcMain.handle('ai:analyze-text', async (event, text) => {
      return await this.analyzeText(text);
    });

    ipcMain.handle('ai:context-search', async (event, query, context) => {
      return await this.contextSearch(query, context);
    });

    ipcMain.handle('ai:aggregate-content', async (event, sources) => {
      return await this.aggregateContent(sources);
    });

    // Privacy controls
    ipcMain.handle('privacy:set-level', (event, level) => {
      return this.setPrivacyLevel(level);
    });

    ipcMain.handle('privacy:get-status', () => {
      return this.getPrivacyStatus();
    });

    ipcMain.handle('privacy:clear-data', () => {
      return this.clearUserData();
    });

    // Content manipulation
    ipcMain.handle('content:compile', async (event, sources, options) => {
      return await this.compileContent(sources, options);
    });

    ipcMain.handle('content:extract', async (event, url) => {
      return await this.extractContent(url);
    });

    // Settings
    ipcMain.handle('settings:get', () => {
      return this.getSettings();
    });

    ipcMain.handle('settings:update', (event, settings) => {
      return this.updateSettings(settings);
    });

    // Window management
    ipcMain.handle('window:minimize', () => {
      this.mainWindow.minimize();
      return true;
    });

    ipcMain.handle('window:maximize', () => {
      if (this.mainWindow.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow.maximize();
      }
      return true;
    });

    ipcMain.handle('window:close', () => {
      this.mainWindow.close();
      return true;
    });
  }

  setupSession() {
    // Configure session for privacy
    const ses = session.defaultSession;
    
    // Clear cookies and cache on exit
    ses.clearStorageData({
      storages: ['cookies', 'localstorage', 'indexdb', 'websql']
    });

    // Set privacy headers
    ses.webRequest.onBeforeSendHeaders((details, callback) => {
      const privacyLevel = this.privacyManager.getCurrentLevel();
      
      // Anonymize headers based on privacy level
      if (privacyLevel === 'high') {
        delete details.requestHeaders['User-Agent'];
        delete details.requestHeaders['Referer'];
        details.requestHeaders['DNT'] = '1';
      }
      
      callback({ cancel: false, requestHeaders: details.requestHeaders });
    });

    // Block trackers
    ses.webRequest.onBeforeRequest((details, callback) => {
      const url = details.url.toLowerCase();
      const isTracker = this.isTracker(url);
      
      if (isTracker && this.privacyManager.blockTrackers()) {
        callback({ cancel: true });
      } else {
        callback({ cancel: false });
      }
    });
  }

  setupAutoUpdater() {
    if (!this.isDev) {
      const { autoUpdater } = require('electron-updater');
      
      autoUpdater.on('update-available', () => {
        this.mainWindow.webContents.send('update:available');
      });
      
      autoUpdater.on('update-downloaded', () => {
        this.mainWindow.webContents.send('update:downloaded');
      });
      
      autoUpdater.on('error', (err) => {
        console.error('Update error:', err);
      });
      
      // Check for updates
      autoUpdater.checkForUpdatesAndNotify();
    }
  }

  async navigateTo(url) {
    try {
      // Validate URL
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }
      
      // Apply privacy filters
      const filteredUrl = this.privacyManager.filterUrl(url);
      
      // Navigate
      await this.mainWindow.loadURL(filteredUrl);
      
      return {
        success: true,
        url: filteredUrl,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Navigation error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async analyzeVideo(videoData) {
    try {
      const privacyLevel = this.privacyManager.getCurrentLevel();
      const analysis = await this.aiEngine.analyzeVideo(videoData, privacyLevel);
      
      // Send analysis to renderer
      this.mainWindow.webContents.send('ai:video-analysis', analysis);
      
      return analysis;
    } catch (error) {
      console.error('Video analysis error:', error);
      return {
        error: error.message,
        fallback: true,
        timestamp: new Date().toISOString()
      };
    }
  }

  async analyzeText(text) {
    try {
      const privacyLevel = this.privacyManager.getCurrentLevel();
      const analysis = await this.aiEngine.analyzeText(text, privacyLevel);
      
      return analysis;
    } catch (error) {
      console.error('Text analysis error:', error);
      return {
        error: error.message,
        fallback: true,
        timestamp: new Date().toISOString()
      };
    }
  }

  async contextSearch(query, context) {
    try {
      const privacyLevel = this.privacyManager.getCurrentLevel();
      const results = await this.aiEngine.contextSearch(query, context, privacyLevel);
      
      return results;
    } catch (error) {
      console.error('Context search error:', error);
      return {
        error: error.message,
        fallback: true,
        timestamp: new Date().toISOString()
      };
    }
  }

  async aggregateContent(sources) {
    try {
      const privacyLevel = this.privacyManager.getCurrentLevel();
      const aggregated = await this.contentAggregator.aggregate(sources, privacyLevel);
      
      return aggregated;
    } catch (error) {
      console.error('Content aggregation error:', error);
      return {
        error: error.message,
        fallback: true,
        timestamp: new Date().toISOString()
      };
    }
  }

  async compileContent(sources, options) {
    try {
      const compilation = await this.contentAggregator.compile(sources, options);
      
      // Save compilation
      this.saveCompilation(compilation);
      
      return compilation;
    } catch (error) {
      console.error('Content compilation error:', error);
      return {
        error: error.message,
        fallback: true,
        timestamp: new Date().toISOString()
      };
    }
  }

  async extractContent(url) {
    try {
      const content = await this.contentAggregator.extract(url);
      return content;
    } catch (error) {
      console.error('Content extraction error:', error);
      return {
        error: error.message,
        fallback: true,
        timestamp: new Date().toISOString()
      };
    }
  }

  setPrivacyLevel(level) {
    this.privacyManager.setLevel(level);
    
    // Update session settings
    this.setupSession();
    
    return {
      success: true,
      level: level,
      timestamp: new Date().toISOString()
    };
  }

  getPrivacyStatus() {
    return this.privacyManager.getStatus();
  }

  clearUserData() {
    const ses = session.defaultSession;
    
    return new Promise((resolve) => {
      ses.clearStorageData({
        storages: [
          'appcache', 'cookies', 'filesystem', 'indexdb',
          'localstorage', 'shadercache', 'websql', 'serviceworkers',
          'cachestorage'
        ]
      }, () => {
        resolve({
          success: true,
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  getSettings() {
    // Load from electron-store
    const Store = require('electron-store');
    const store = new Store();
    
    return store.get('settings', {
      privacyLevel: 'medium',
      aiModels: ['gpt-4', 'claude-3'],
      autoAnalyze: true,
      theme: 'dark',
      notifications: true
    });
  }

  updateSettings(settings) {
    const Store = require('electron-store');
    const store = new Store();
    
    store.set('settings', settings);
    
    // Apply settings
    if (settings.privacyLevel) {
      this.setPrivacyLevel(settings.privacyLevel);
    }
    
    return {
      success: true,
      settings: settings,
      timestamp: new Date().toISOString()
    };
  }

  onPageNavigate(url) {
    // Send navigation event to renderer
    this.mainWindow.webContents.send('browser:navigated', {
      url: url,
      timestamp: new Date().toISOString(),
      privacyLevel: this.privacyManager.getCurrentLevel()
    });
  }

  onPageLoaded() {
    // Inject AI overlay scripts
    this.injectAIScripts();
    
    // Send page loaded event
    this.mainWindow.webContents.send('browser:page-loaded', {
      timestamp: new Date().toISOString(),
      canAnalyze: true
    });
  }

  injectAIScripts() {
    // Inject JavaScript for AI overlays
    const script = `
      // AI Browser Overlay System
      window.AIBrowser = {
        version: '1.0.0',
        features: {
          videoAnalysis: true,
          textAnalysis: true,
          contextualSearch: true,
          privacyProtection: true
        },
        
        analyzeVideo: function(videoElement) {
          return new Promise((resolve) => {
            // Capture video frame
            const canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoElement, 0, 0);
            
            const frameData = canvas.toDataURL('image/jpeg', 0.8);
            
            // Send to main process
            window.electronAPI.analyzeVideo(frameData).then(resolve);
          });
        },
        
        analyzeText: function(text) {
          return window.electronAPI.analyzeText(text);
        },
        
        showOverlay: function(content, position) {
          // Create or update overlay
          let overlay = document.getElementById('ai-browser-overlay');
          
          if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'ai-browser-overlay';
            overlay.style.cssText = \`
              position: fixed;
              top: \${position?.top || '20px'};
              right: \${position?.right || '20px'};
              z-index: 10000;
              background: rgba(0, 0, 0, 0.9);
              color: white;
              padding: 15px;
              border-radius: 10px;
              max-width: 400px;
              font-family: Arial, sans-serif;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
              backdrop-filter: blur(10px);
            \`;
            document.body.appendChild(overlay);
          }
          
          overlay.innerHTML = content;
          overlay.style.display = 'block';
          
          // Auto-hide after 30 seconds
          setTimeout(() => {
            overlay.style.display = 'none';
          }, 30000);
        }
      };
      
      // Initialize video analysis buttons
      function initVideoAnalysis() {
        document.querySelectorAll('video').forEach(video => {
          if (!video.parentNode.querySelector('.ai-analyze-btn')) {
            const btn = document.createElement('button');
            btn.className = 'ai-analyze-btn';
            btn.innerHTML = '🔍 AI Analyze';
            btn.style.cssText = \`
              position: absolute;
              top: 10px;
              right: 10px;
              background: rgba(0, 0, 0, 0.7);
              color: white;
              border: none;
              padding: 8px 12px;
              border-radius: 4px;
              cursor: pointer;
              z-index: 1000;
              font-size: 12px;
            \`;
            
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              window.AIBrowser.analyzeVideo(video).then(analysis => {
                window.AIBrowser.showOverlay(
                  \`<h3>AI Analysis</h3>
                  <div>\${JSON.stringify(analysis, null, 2)}</div>\`
                );
              });
            });
            
            video.parentNode.style.position = 'relative';
            video.parentNode.appendChild(btn);
          }
        });
      }
      
      // Initialize on page load
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVideoAnalysis);
      } else {
        initVideoAnalysis();
      }
      
      // Watch for new videos
      const observer = new MutationObserver(initVideoAnalysis);
      observer.observe(document.body, { childList: true, subtree: true });
    `;
    
    this.mainWindow.webContents.executeJavaScript(script);
  }

  sendInitialState() {
    const initialState = {
      version: app.getVersion(),
      privacyLevel: this.privacyManager.getCurrentLevel(),
      settings: this.getSettings(),
      features: {
        videoAnalysis: true,
        contextualSearch: true,
        contentAggregation: true,
        privacyControls: true
      }
    };
    
    this.mainWindow.webContents.send('app:initial-state', initialState);
  }

  isTracker(url) {
    const trackers = [
      'google-analytics',
      'facebook.com/tr',
      'doubleclick.net',
      'googlesyndication',
      'googletagmanager',
      'facebook.net',
      'twitter.com/widgets',
      'linkedin.com/analytics'
    ];
    
    return trackers.some(tracker => url.includes(tracker));
  }

  saveCompilation(compilation) {
    const Store = require('electron-store');
    const store = new Store();
    
    const compilations = store.get('compilations', []);
    compilations.push({
      ...compilation,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    });
    
    store.set('compilations', compilations.slice(-50)); // Keep last 50
  }
}

// Start the application
const aiBrowser = new AIBrowser();

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

module.exports = { AIBrowser };