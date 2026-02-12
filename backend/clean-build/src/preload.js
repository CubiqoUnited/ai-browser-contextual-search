// Preload script for AI Browser
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Browser actions
  navigate: (url) => ipcRenderer.invoke('browser:navigate', url),
  goBack: () => ipcRenderer.invoke('browser:back'),
  goForward: () => ipcRenderer.invoke('browser:forward'),
  reload: () => ipcRenderer.invoke('browser:reload'),
  goHome: () => ipcRenderer.invoke('browser:home'),
  
  // AI analysis
  analyzeVideo: (videoData) => ipcRenderer.invoke('ai:analyze-video', videoData),
  analyzeText: (text) => ipcRenderer.invoke('ai:analyze-text', text),
  contextSearch: (query, context) => ipcRenderer.invoke('ai:context-search', query, context),
  aggregateContent: (sources) => ipcRenderer.invoke('ai:aggregate-content', sources),
  
  // Privacy controls
  setPrivacyLevel: (level) => ipcRenderer.invoke('privacy:set-level', level),
  getPrivacyStatus: () => ipcRenderer.invoke('privacy:get-status'),
  clearData: () => ipcRenderer.invoke('privacy:clear-data'),
  
  // Content manipulation
  compileContent: (sources, options) => ipcRenderer.invoke('content:compile', sources, options),
  extractContent: (url) => ipcRenderer.invoke('content:extract', url),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings) => ipcRenderer.invoke('settings:update', settings),
  
  // Window management
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  
  // Events from main process
  onBrowserNavigated: (callback) => ipcRenderer.on('browser:navigated', callback),
  onPageLoaded: (callback) => ipcRenderer.on('browser:page-loaded', callback),
  onVideoAnalysis: (callback) => ipcRenderer.on('ai:video-analysis', callback),
  onInitialState: (callback) => ipcRenderer.on('app:initial-state', callback),
  onUpdateAvailable: (callback) => ipcRenderer.on('update:available', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update:downloaded', callback),
  
  // Remove event listeners
  removeBrowserNavigatedListener: (callback) => ipcRenderer.removeListener('browser:navigated', callback),
  removePageLoadedListener: (callback) => ipcRenderer.removeListener('browser:page-loaded', callback),
  removeVideoAnalysisListener: (callback) => ipcRenderer.removeListener('ai:video-analysis', callback),
  removeInitialStateListener: (callback) => ipcRenderer.removeListener('app:initial-state', callback),
  removeUpdateAvailableListener: (callback) => ipcRenderer.removeListener('update:available', callback),
  removeUpdateDownloadedListener: (callback) => ipcRenderer.removeListener('update:downloaded', callback)
});

// Expose app information
contextBridge.exposeInMainWorld('appInfo', {
  platform: process.platform,
  version: process.versions.electron,
  isDev: process.env.NODE_ENV === 'development'
});

// Expose safe Node.js modules
contextBridge.exposeInMainWorld('nodeModules', {
  path: {
    join: (...args) => require('path').join(...args),
    basename: (path) => require('path').basename(path),
    dirname: (path) => require('path').dirname(path)
  },
  url: {
    parse: (url) => require('url').parse(url),
    format: (urlObj) => require('url').format(urlObj)
  }
});

// Security warning
console.log('%c⚠️ Security Warning', 'color: red; font-size: 16px; font-weight: bold;');
console.log('This is a secure AI Browser application. Do not enter any sensitive information into the console.');

// Initialize AI Browser context
window.addEventListener('DOMContentLoaded', () => {
  // Check if AI Browser context is already initialized
  if (!window.AIBrowser) {
    window.AIBrowser = {
      version: '1.0.0',
      ready: true,
      features: {
        videoAnalysis: true,
        contextualSearch: true,
        privacyProtection: true,
        contentAggregation: true
      }
    };
  }
  
  // Notify main process that renderer is ready
  ipcRenderer.send('renderer:ready');
});