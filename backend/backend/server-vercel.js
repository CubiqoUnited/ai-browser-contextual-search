// Simplified server for Vercel deployment
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:*', 'chrome-extension://*', 'moz-extension://*'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '0.1.0',
    features: ['contextual-search', 'privacy-filtering', 'content-aggregation']
  });
});

// Mock AI analysis endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { type, data, privacyLevel = 'medium' } = req.body;
    
    if (!type || !data) {
      return res.status(400).json({ error: 'Missing type or data' });
    }

    // Mock analysis based on type
    let analysis;
    switch (type) {
      case 'video-frame':
      case 'image-analysis':
        analysis = {
          type,
          entities: [
            { text: 'person', type: 'object', confidence: 0.85 },
            { text: 'object', type: 'object', confidence: 0.78 },
            { text: 'scene', type: 'context', confidence: 0.92 }
          ],
          metadata: {
            analysisType: 'mock',
            privacyLevel,
            timestamp: new Date().toISOString()
          }
        };
        break;
      
      case 'text-analysis':
        analysis = {
          type,
          text: privacyLevel === 'high' ? hashString(data) : data.substring(0, 100),
          entities: [
            { text: 'keyword', type: 'keyword', confidence: 0.7 },
            { text: 'entity', type: 'entity', confidence: 0.8 }
          ],
          metadata: {
            analysisType: 'mock',
            privacyLevel,
            timestamp: new Date().toISOString()
          }
        };
        break;
      
      case 'context-search':
        analysis = {
          type,
          query: privacyLevel === 'high' ? hashString(data) : data,
          sources: [
            {
              title: 'Wikipedia',
              url: 'https://en.wikipedia.org/wiki/Search',
              snippet: `Information about "${data.substring(0, 20)}..."`,
              confidence: 0.9
            },
            {
              title: 'YouTube',
              url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(data),
              snippet: `Videos related to "${data.substring(0, 20)}..."`,
              confidence: 0.8
            }
          ],
          aggregated: {
            summary: `"${data.substring(0, 30)}..." appears to be a search term with multiple sources available.`,
            confidence: 0.85
          }
        };
        break;
      
      default:
        return res.status(400).json({ error: 'Unsupported analysis type' });
    }

    // Apply privacy filters
    if (privacyLevel === 'high') {
      analysis = applyPrivacyFilters(analysis);
    }

    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Analysis failed', 
      message: error.message,
      fallback: true
    });
  }
});

// Privacy-preserving search
app.post('/api/search', async (req, res) => {
  try {
    const { query, context, privacyLevel = 'high' } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Missing query' });
    }

    // Anonymize query
    const anonymizedQuery = privacyLevel === 'high' ? hashString(query) : query;
    
    // Mock parallel search results
    const models = ['gpt-4', 'claude-3', 'gemini-pro', 'llama-2'];
    const searchResults = models.map(model => ({
      model,
      response: `Mock response from ${model} for: "${anonymizedQuery.substring(0, 30)}..."`,
      confidence: 0.5 + Math.random() * 0.5,
      processingTime: 50 + Math.random() * 100
    }));

    // Curate results
    const curatedResults = {
      curatedResponse: searchResults.map(r => r.response).join(' ').substring(0, 500) + '...',
      averageConfidence: searchResults.reduce((sum, r) => sum + r.confidence, 0) / searchResults.length,
      modelCount: searchResults.length,
      fastestModel: searchResults.reduce((fastest, current) => 
        current.processingTime < fastest.processingTime ? current : fastest
      ).model
    };

    res.json({
      query: anonymizedQuery,
      results: curatedResults,
      privacy: {
        level: privacyLevel,
        anonymized: privacyLevel === 'high',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed', message: error.message });
  }
});

// Content aggregation
app.post('/api/aggregate', async (req, res) => {
  try {
    const { sources, filters, privacyLevel = 'high' } = req.body;
    
    if (!sources || !Array.isArray(sources)) {
      return res.status(400).json({ error: 'Missing or invalid sources' });
    }

    // Mock aggregation
    const aggregated = sources.map(source => ({
      source: privacyLevel === 'high' ? hashString(source) : source,
      content: `Processed content from ${source.substring(0, 50)}...`,
      metadata: {
        processed: true,
        filtersApplied: filters || [],
        privacyLevel,
        timestamp: new Date().toISOString()
      }
    }));

    res.json({
      aggregated,
      sourceCount: sources.length,
      privacy: {
        level: privacyLevel,
        sourcesAnonymized: privacyLevel === 'high'
      }
    });
  } catch (error) {
    console.error('Aggregation error:', error);
    res.status(500).json({ error: 'Aggregation failed', message: error.message });
  }
});

// Model status
app.get('/api/models', (req, res) => {
  res.json({
    models: {
      'object-detection': { loaded: true, type: 'mock' },
      'text-analysis': { loaded: true, type: 'mock' },
      'context-search': { loaded: true, type: 'mock' },
      'content-aggregation': { loaded: true, type: 'mock' }
    },
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Helper functions
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function applyPrivacyFilters(analysis) {
  const filtered = { ...analysis };
  
  if (filtered.text) {
    filtered.text = hashString(filtered.text);
  }
  
  if (filtered.query) {
    filtered.query = hashString(filtered.query);
  }
  
  filtered.privacy = {
    filtered: true,
    level: 'high',
    timestamp: new Date().toISOString()
  };
  
  return filtered;
}

// Start server
if (require.main === module) {
  app.listen(port, () => {
    console.log(`AI Browser Backend running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${port}/health`);
  });
}

module.exports = app;