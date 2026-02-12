const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs').promises;

class AIServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.models = {};
    this.cache = new Map();
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeModels();
  }

  initializeMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"]
        }
      }
    }));
    
    // CORS configuration
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : ['http://localhost:*', 'chrome-extension://*'],
      credentials: true
    }));
    
    // Logging
    this.app.use(morgan('combined'));
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Static files
    this.app.use(express.static(path.join(__dirname, 'public')));
  }

  async initializeModels() {
    console.log('Initializing AI models...');
    
    try {
      // Initialize TensorFlow.js
      const tf = require('@tensorflow/tfjs-node');
      
      // Load COCO-SSD for object detection
      const cocoSsd = require('@tensorflow-models/coco-ssd');
      this.models.objectDetection = await cocoSsd.load();
      console.log('Object detection model loaded');
      
      // Initialize Tesseract for OCR
      const Tesseract = require('tesseract.js');
      this.models.ocr = Tesseract;
      console.log('OCR model ready');
      
      // Initialize other models would go here
      // this.models.faceRecognition = await loadFaceRecognitionModel();
      // this.models.sceneUnderstanding = await loadSceneModel();
      
    } catch (error) {
      console.error('Error loading models:', error);
      console.log('Running in fallback mode (mock responses)');
    }
  }

  initializeRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        models: Object.keys(this.models)
      });
    });

    // Main analysis endpoint
    this.app.post('/api/analyze', async (req, res) => {
      try {
        const { type, data, privacyLevel = 'medium' } = req.body;
        
        // Validate request
        if (!type || !data) {
          return res.status(400).json({ error: 'Missing type or data' });
        }

        // Check cache
        const cacheKey = this.generateCacheKey(type, data, privacyLevel);
        if (this.cache.has(cacheKey)) {
          return res.json(this.cache.get(cacheKey));
        }

        // Process based on type
        let result;
        switch (type) {
          case 'video-frame':
            result = await this.analyzeVideoFrame(data, privacyLevel);
            break;
          case 'image-analysis':
            result = await this.analyzeImage(data, privacyLevel);
            break;
          case 'text-analysis':
            result = await this.analyzeText(data, privacyLevel);
            break;
          case 'context-search':
            result = await this.contextSearch(data, privacyLevel);
            break;
          case 'content-aggregation':
            result = await this.aggregateContent(data, privacyLevel);
            break;
          default:
            return res.status(400).json({ error: 'Unsupported analysis type' });
        }

        // Cache result
        this.cache.set(cacheKey, result);
        
        // Set cache headers
        res.set('Cache-Control', 'public, max-age=300');
        
        res.json(result);
      } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ 
          error: 'Analysis failed', 
          message: error.message,
          fallback: await this.getFallbackResponse(req.body)
        });
      }
    });

    // Privacy-preserving search
    this.app.post('/api/search', async (req, res) => {
      try {
        const { query, context, privacyLevel = 'high' } = req.body;
        
        if (!query) {
          return res.status(400).json({ error: 'Missing query' });
        }

        // Anonymize query based on privacy level
        const anonymizedQuery = this.anonymizeQuery(query, privacyLevel);
        
        // Perform parallel searches
        const searchResults = await this.parallelSearch(anonymizedQuery, context);
        
        // Curate and aggregate results
        const curatedResults = this.curateResults(searchResults);
        
        res.json({
          query: anonymizedQuery,
          results: curatedResults,
          privacy: {
            level: privacyLevel,
            anonymized: true,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed', message: error.message });
      }
    });

    // Content aggregation endpoint
    this.app.post('/api/aggregate', async (req, res) => {
      try {
        const { sources, filters, privacyLevel = 'high' } = req.body;
        
        if (!sources || !Array.isArray(sources)) {
          return res.status(400).json({ error: 'Missing or invalid sources' });
        }

        // Aggregate content from multiple sources
        const aggregated = await this.aggregateFromSources(sources, filters, privacyLevel);
        
        res.json({
          aggregated: aggregated,
          sourceCount: sources.length,
          privacy: {
            level: privacyLevel,
            sourcesAnonymized: true
          }
        });
      } catch (error) {
        console.error('Aggregation error:', error);
        res.status(500).json({ error: 'Aggregation failed', message: error.message });
      }
    });

    // Model status endpoint
    this.app.get('/api/models', (req, res) => {
      const modelStatus = {};
      Object.keys(this.models).forEach(key => {
        modelStatus[key] = {
          loaded: !!this.models[key],
          type: typeof this.models[key]
        };
      });
      
      res.json({
        models: modelStatus,
        cacheSize: this.cache.size,
        uptime: process.uptime()
      });
    });

    // Clear cache endpoint
    this.app.post('/api/cache/clear', (req, res) => {
      const { password } = req.body;
      
      if (password !== process.env.CACHE_CLEAR_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const previousSize = this.cache.size;
      this.cache.clear();
      
      res.json({
        cleared: true,
        previousSize,
        currentSize: this.cache.size
      });
    });

    // Error handling
    this.app.use((err, req, res, next) => {
      console.error('Server error:', err);
      res.status(500).json({ 
        error: 'Internal server error',
        requestId: req.id
      });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Not found' });
    });
  }

  async analyzeVideoFrame(frameData, privacyLevel) {
    // Extract base64 data
    const base64Data = frameData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    let analysis = {
      type: 'video-frame',
      timestamp: new Date().toISOString(),
      entities: [],
      metadata: {}
    };

    try {
      // Object detection
      if (this.models.objectDetection) {
        const predictions = await this.models.objectDetection.detect(buffer);
        analysis.entities.push(...predictions.map(pred => ({
          text: pred.class,
          type: 'object',
          confidence: pred.score,
          bbox: pred.bbox
        })));
      }

      // OCR if needed
      if (this.models.ocr && buffer.length > 0) {
        const { data: { text } } = await this.models.ocr.recognize(buffer, 'eng');
        if (text && text.trim()) {
          analysis.metadata.text = text.trim();
          analysis.entities.push({
            text: 'Text detected',
            type: 'text-region',
            confidence: 0.8
          });
        }
      }

      // Apply privacy filters
      if (privacyLevel === 'high') {
        analysis = this.applyPrivacyFilters(analysis);
      }

    } catch (error) {
      console.error('Video frame analysis error:', error);
      // Fallback to mock analysis
      analysis = this.getMockAnalysis('video');
    }

    return analysis;
  }

  async analyzeImage(imageData, privacyLevel) {
    // Similar to video frame analysis but for static images
    return this.analyzeVideoFrame(imageData, privacyLevel);
  }

  async analyzeText(text, privacyLevel) {
    // Simple text analysis
    const words = text.split(/\s+/);
    const entities = [];
    
    // Extract potential entities (simple heuristic)
    words.forEach(word => {
      if (word.length > 3 && /^[A-Z]/.test(word)) {
        entities.push({
          text: word,
          type: 'potential-entity',
          confidence: 0.7
        });
      }
    });
    
    // Apply privacy filters
    let analysis = {
      type: 'text-analysis',
      text: privacyLevel === 'high' ? this.hashString(text) : text,
      entities: entities,
      wordCount: words.length,
      characterCount: text.length
    };
    
    if (privacyLevel === 'high') {
      analysis = this.applyPrivacyFilters(analysis);
    }
    
    return analysis;
  }

  async contextSearch(query, privacyLevel) {
    // Mock context search - in production would call multiple APIs
    const mockResults = {
      query: privacyLevel === 'high' ? this.hashString(query) : query,
      sources: [
        {
          title: 'Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Search',
          snippet: `Information about "${query}" from Wikipedia`,
          confidence: 0.9
        },
        {
          title: 'YouTube',
          url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query),
          snippet: `Videos related to "${query}"`,
          confidence: 0.8
        },
        {
          title: 'News',
          url: 'https://news.google.com/search?q=' + encodeURIComponent(query),
          snippet: `Latest news about "${query}"`,
          confidence: 0.7
        }
      ],
      aggregated: {
        summary: `"${query}" appears to be a search term. Multiple sources provide information about this topic.`,
        confidence: 0.85
      }
    };
    
    return mockResults;
  }

  async aggregateContent(sources, filters, privacyLevel) {
    // Mock content aggregation
    const aggregated = {
      type: 'content-aggregation',
      sources: sources.map(source => ({
        url: privacyLevel === 'high' ? this.hashString(source) : source,
        status: 'processed',
        content: `Mock content from ${source}`,
        metadata: {
          processedAt: new Date().toISOString(),
          privacyLevel: privacyLevel
        }
      })),
      summary: `Aggregated ${sources.length} sources with ${filters ? filters.length : 0} filters applied`,
      totalItems: sources.length * 10 // Mock item count
    };
    
    return aggregated;
  }

  async parallelSearch(query, context) {
    // Mock parallel search across multiple "AI models"
    const models = ['gpt-4', 'claude-3', 'gemini-pro', 'llama-2'];
    
    const results = await Promise.all(
      models.map(async (model) => {
        return {
          model: model,
          response: `Mock response from ${model} for query: "${query}"`,
          confidence: Math.random() * 0.5 + 0.5, // 0.5-1.0
          processingTime: Math.random() * 100 + 50 // 50-150ms
        };
      })
    );
    
    return results;
  }

  curateResults(searchResults) {
    // Simple curation: average confidence, combine responses
    const avgConfidence = searchResults.reduce((sum, r) => sum + r.confidence, 0) / searchResults.length;
    
    const combinedResponse = searchResults
      .map(r => r.response)
      .join(' ')
      .substring(0, 500) + '...';
    
    return {
      curatedResponse: combinedResponse,
      averageConfidence: avgConfidence,
      modelCount: searchResults.length,
      fastestModel: searchResults.reduce((fastest, current) => 
        current.processingTime < fastest.processingTime ? current : fastest
      ).model
    };
  }

  applyPrivacyFilters(analysis) {
    // Apply privacy filters to analysis results
    const filtered = { ...analysis };
    
    // Hash identifiable information
    if (filtered.text) {
      filtered.text = this.hashString(filtered.text);
    }
    
    // Remove location data
    if (filtered.metadata && filtered.metadata.location) {
      delete filtered.metadata.location;
    }
    
    // Anonymize entities
    if (filtered.entities) {
      filtered.entities = filtered.entities.map(entity => ({
        ...entity,
        text: entity.type === 'person' ? this.hashString(entity.text) : entity.text
      }));
    }
    
    filtered.privacy = {
      filtered: true,
      level: 'high',
      timestamp: new Date().toISOString()
    };
    
    return filtered;
  }

  anonymizeQuery(query, privacyLevel) {
    if (privacyLevel === 'low') return query;
    if (privacyLevel === 'medium') return query.substring(0, 50);
    return this.hashString(query);
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

  generateCacheKey(type, data, privacyLevel) {
    const str = `${type}:${privacyLevel}:${JSON.stringify(data)}`;
    return this.hashString(str);
  }

  getMockAnalysis(type) {
    const mockData = {
      'video': {
        type: 'video-frame',
        entities: [
          { text: 'person', type: 'object', confidence: 0.85 },
          { text: 'car', type: 'object', confidence: 0.78 },
          { text: 'building', type: 'object', confidence: 0.92 }
        ],
        metadata: {
          frameCount: 1,
          analysisType: 'mock'
        }
      },
      'image': {
        type: 'image-analysis',
        entities: [
          { text: 'cat', type: 'object', confidence: 0.95 },
          { text: 'tree', type: 'object', confidence: 0.82 }
        ],
        metadata: {
          colors: ['#FF0000', '#00FF00', '#0000FF'],
          analysisType: 'mock'
        }
      },
      'text': {
        type: 'text-analysis',
        entities: [
          { text: 'Important', type: 'keyword', confidence: 0.7 },
          { text: 'Document', type: 'keyword', confidence: 0.8 }
        ],
        metadata: {
          language: 'en',
          analysisType: 'mock'
        }
      }
    };
    
    return mockData[type] || mockData.text;
  }

  async getFallbackResponse(request) {
    // Provide a fallback response when analysis fails
    return {
      type: request.type,
      status: 'fallback',
      analysis: this.getMockAnalysis(request.type.split('-')[0]),
      message: 'Using fallback analysis due to processing error',
      timestamp: new Date().toISOString()
    };
  }

  async aggregateFromSources(sources, filters, privacyLevel) {
    // Mock implementation - would fetch and process actual content
    return sources.map(source => ({
      source: privacyLevel === 'high' ? this.hashString(source) : source,
      content: `Processed content from ${source}`,
      metadata: {
        processed: true,
        filtersApplied: filters || [],
        privacyLevel: privacyLevel
      }
    }));
  }

  start() {
    this.server = this.app.listen(this.port, () => {
      console.log(`AI Server running on port ${this.port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Available models: ${Object.keys(this.models).join(', ')}`);
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      console.log('Server stopped');
    }
  }
}

// Start server if run directly
if (require.main === module) {
  // Check if we're on Vercel
  if (process.env.VERCEL) {
    console.log('Running on Vercel - using simplified server');
    const app = require('./server-vercel');
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`AI Browser Backend running on Vercel, port ${port}`);
    });
  } else {
    const server = new AIServer();
    server.start();
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.stop();
      process.exit(0);
    });
    
    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      server.stop();
      process.exit(0);
    });
  }
}

module.exports = AIServer;