// Local test server for AI Browser (no authentication required)
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const port = 3001; // Different port to avoid conflicts

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*', // Allow all for testing
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: 'local-test',
    version: '1.0.0',
    features: [
      'contextual-search',
      'privacy-filtering',
      'content-aggregation',
      'video-analysis',
      'multi-model-processing'
    ]
  });
});

// AI analysis endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { type, data, privacyLevel = 'medium' } = req.body;
    
    if (!type || !data) {
      return res.status(400).json({ error: 'Missing type or data' });
    }

    console.log(`[AI Analysis] Type: ${type}, Privacy: ${privacyLevel}`);
    
    // Generate realistic mock analysis
    const analysis = generateAnalysis(type, data, privacyLevel);
    
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

// Contextual search
app.post('/api/search', async (req, res) => {
  try {
    const { query, context, privacyLevel = 'high' } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Missing query' });
    }

    console.log(`[Search] Query: ${query.substring(0, 50)}...`);
    
    const results = await performSearch(query, context, privacyLevel);
    
    res.json(results);
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

    console.log(`[Aggregation] Sources: ${sources.length}`);
    
    const aggregated = await aggregateContent(sources, filters, privacyLevel);
    
    res.json(aggregated);
  } catch (error) {
    console.error('Aggregation error:', error);
    res.status(500).json({ error: 'Aggregation failed', message: error.message });
  }
});

// Models status
app.get('/api/models', (req, res) => {
  res.json({
    models: {
      'object-detection': { status: 'mock', accuracy: 0.85 },
      'text-analysis': { status: 'mock', accuracy: 0.92 },
      'context-search': { status: 'mock', accuracy: 0.88 },
      'content-aggregation': { status: 'mock', accuracy: 0.90 }
    },
    capabilities: [
      'real-time-processing',
      'privacy-preserving',
      'multi-source-aggregation',
      'contextual-understanding'
    ],
    timestamp: new Date().toISOString()
  });
});

// Helper functions
function generateAnalysis(type, data, privacyLevel) {
  const base = {
    type,
    timestamp: new Date().toISOString(),
    privacy: { level: privacyLevel }
  };

  switch (type) {
    case 'video-frame':
      return {
        ...base,
        entities: [
          { text: 'person', type: 'human', confidence: 0.87, age: '25-35', gender: 'male' },
          { text: 'car', type: 'vehicle', confidence: 0.92, make: 'Tesla', model: 'Model 3' },
          { text: 'building', type: 'architecture', confidence: 0.78, style: 'modern' }
        ],
        scene: {
          description: 'Urban street scene with vehicle and pedestrian',
          timeOfDay: 'daylight',
          weather: 'clear',
          location: 'city street'
        },
        metadata: {
          resolution: '1920x1080',
          frameRate: 30,
          colorProfile: 'sRGB',
          analysisTime: '125ms'
        }
      };

    case 'text-analysis':
      const text = privacyLevel === 'high' ? hashString(data) : data;
      return {
        ...base,
        text: text.length > 500 ? text.substring(0, 500) + '...' : text,
        entities: extractEntities(data),
        sentiment: analyzeSentiment(data),
        summary: generateSummary(data),
        metadata: {
          language: 'en',
          wordCount: data.split(/\s+/).length,
          readingTime: `${Math.ceil(data.split(/\s+/).length / 200)} minutes`,
          complexity: 'medium'
        }
      };

    default:
      return {
        ...base,
        data: privacyLevel === 'high' ? hashString(data) : data,
        note: 'Analysis completed successfully'
      };
  }
}

async function performSearch(query, context, privacyLevel) {
  // Simulate AI model parallel processing
  const models = [
    { name: 'gpt-4', provider: 'OpenAI', cost: 0.03 },
    { name: 'claude-3', provider: 'Anthropic', cost: 0.02 },
    { name: 'gemini-pro', provider: 'Google', cost: 0.01 },
    { name: 'llama-2', provider: 'Meta', cost: 0.005 }
  ];

  const results = await Promise.all(
    models.map(async (model) => {
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150));
      
      return {
        model: model.name,
        provider: model.provider,
        response: generateModelResponse(query, context, model.name),
        confidence: 0.7 + Math.random() * 0.25,
        processingTime: 80 + Math.random() * 120,
        cost: model.cost,
        tokensUsed: 400 + Math.floor(Math.random() * 800)
      };
    })
  );

  return {
    query: privacyLevel === 'high' ? hashString(query) : query,
    results: results,
    curation: {
      bestModel: results.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      ).model,
      averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
      consensus: generateConsensus(results, query),
      recommendations: generateRecommendations(query)
    },
    privacy: {
      level: privacyLevel,
      queryAnonymized: privacyLevel === 'high',
      timestamp: new Date().toISOString()
    }
  };
}

async function aggregateContent(sources, filters, privacyLevel) {
  const aggregated = await Promise.all(
    sources.map(async (source, index) => {
      await new Promise(resolve => setTimeout(resolve, 30 * index));
      
      const sourceType = determineSourceType(source);
      
      return {
        source: privacyLevel === 'high' ? hashString(source) : source,
        type: sourceType,
        content: generateContent(source, sourceType),
        metadata: {
          index,
          processedAt: new Date().toISOString(),
          filtersApplied: filters || [],
          privacyLevel,
          size: `${1024 + Math.floor(Math.random() * 4096)} bytes`,
          quality: 0.6 + Math.random() * 0.4
        },
        preview: `Content from ${sourceType} source: ${source.substring(0, 80)}...`,
        relevance: 0.5 + Math.random() * 0.5
      };
    })
  );

  return {
    aggregated,
    summary: {
      totalSources: sources.length,
      successfulAggregations: aggregated.length,
      contentTypes: [...new Set(aggregated.map(a => a.type))],
      totalSize: aggregated.reduce((sum, item) => sum + parseInt(item.metadata.size), 0),
      averageRelevance: aggregated.reduce((sum, item) => sum + item.relevance, 0) / aggregated.length
    },
    compilation: {
      possible: aggregated.length > 1,
      suggestedFormat: determineCompilationFormat(aggregated),
      estimatedTime: `${aggregated.length * 2} minutes`
    },
    privacy: {
      level: privacyLevel,
      sourcesAnonymized: privacyLevel === 'high',
      timestamp: new Date().toISOString()
    }
  };
}

// Utility functions
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `hash_${hash.toString(36)}`;
}

function extractEntities(text) {
  const words = text.split(/\s+/);
  const entities = [];
  
  // Simple entity extraction
  words.forEach((word, index) => {
    if (word.length > 3 && /^[A-Z]/.test(word)) {
      entities.push({
        text: word,
        type: 'proper-noun',
        confidence: 0.8,
        position: index
      });
    }
    
    if (word.match(/^\d+$/)) {
      entities.push({
        text: word,
        type: 'number',
        confidence: 1.0,
        position: index
      });
    }
  });
  
  return entities.slice(0, 10); // Limit to 10 entities
}

function analyzeSentiment(text) {
  const positiveWords = ['good', 'great', 'excellent', 'happy', 'love'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'sad'];
  
  let score = 0;
  const words = text.toLowerCase().split(/\s+/);
  
  words.forEach(word => {
    if (positiveWords.includes(word)) score += 1;
    if (negativeWords.includes(word)) score -= 1;
  });
  
  if (score > 2) return { polarity: 'positive', score: 0.8 };
  if (score < -2) return { polarity: 'negative', score: 0.7 };
  return { polarity: 'neutral', score: 0.5 };
}

function generateSummary(text) {
  const sentences = text.split(/[.!?]+/);
  if (sentences.length <= 2) return text;
  
  return sentences.slice(0, 2).join('. ') + '...';
}

function generateModelResponse(query, context, modelName) {
  const responses = {
    'gpt-4': `Based on my analysis of "${query}", I can provide comprehensive information from multiple reliable sources. ${context ? `Considering the context: ${context.substring(0, 100)}` : ''}`,
    'claude-3': `I've analyzed "${query}" and found several relevant aspects worth exploring. The query appears to be well-formed and specific.`,
    'gemini-pro': `Regarding "${query}", I've identified key information points and can provide detailed explanations across various dimensions.`,
    'llama-2': `The query "${query}" has been processed. Multiple information sources are available with varying levels of detail and reliability.`
  };
  
  return responses[modelName] || `Analysis of "${query}" completed successfully.`;
}

function generateConsensus(results, query) {
  const confidences = results.map(r => r.confidence);
  const avgConfidence = confidences.reduce((a, b) => a + b) / confidences.length;
  
  if (avgConfidence > 0.8) {
    return `All models agree that "${query}" is a well-defined query with high information availability.`;
  } else if (avgConfidence > 0.6) {
    return `Models show moderate agreement on "${query}". Some variations in interpretation exist.`;
  } else {
    return `Models show low consensus on "${query}". The query may be ambiguous or require clarification.`;
  }
}

function generateRecommendations(query) {
  return [
    `Search for "${query}" on specialized databases`,
    `Look for video content related to "${query}"`,
    `Check academic papers about "${query}"`,
    `Explore news coverage of "${query}"`
  ];
}

function determineSourceType(url) {
  if (url.includes('youtube.com') || url.includes('vimeo.com')) return 'video';
  if (url.includes('wikipedia.org')) return 'encyclopedia';
  if (url.includes('news.') || url.includes('reuters.com')) return 'news';
  if (url.includes('research.') || url.includes('arxiv.org')) return 'academic';
  if (url.includes('github.com')) return 'code';
  if (url.includes('porn') || url.includes('xxx')) return 'adult';
  return 'general';
}

function generateContent(source, type) {
  const contents = {
    'video': `Video content from ${new URL(source).hostname}. Includes visual and audio elements suitable for analysis.`,
    'encyclopedia': `Comprehensive information from ${new URL(source).hostname}. Well-researched and factual content.`,
    'news': `Current news coverage from ${new URL(source).hostname}. Timely information with journalistic standards.`,
    'academic': `Research content from ${new URL(source).hostname}. Peer-reviewed and scholarly information.`,
    'adult': `Adult content from ${new URL(source).hostname}. Requires age verification and content warnings.`,
    'general': `Web content from ${new URL(source).hostname}. Mixed information requiring verification.`
  };
  
  return contents[type] || `Content from ${source}`;
}

function determineCompilationFormat(aggregated) {
  const types = aggregated.map(a => a.type);
  
  if (types.includes('video')) return 'video-compilation';
  if (types.includes('adult')) return 'curated-collection';
  if (types.every(t => t === 'news')) return 'news-digest';
  if (types.every(t => t === 'academic')) return 'research-paper';
  
  return 'mixed-content-bundle';
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'POST /api/analyze',
      'POST /api/search',
      'POST /api/aggregate',
      'GET /api/models'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 AI Browser Local Test Server running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔧 API endpoints ready for testing`);
  console.log(`🔒 Privacy levels: low, medium, high`);
  console.log(`🎯 Features: video analysis, contextual search, content aggregation`);
});

module.exports = app;