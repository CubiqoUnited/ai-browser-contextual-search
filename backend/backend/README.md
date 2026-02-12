# AI Browser Backend

Backend server for the AI Contextual Search browser extension.

## Features

- **Video/Image Analysis**: Object detection, OCR, scene understanding
- **Privacy-Preserving Processing**: Multiple privacy levels, data anonymization
- **Parallel AI Processing**: Query multiple models simultaneously
- **Content Aggregation**: Combine results from multiple sources
- **Caching**: Intelligent caching for performance

## Installation

```bash
cd backend
npm install
```

## Configuration

Create a `.env` file:

```env
PORT=3000
NODE_ENV=development
CACHE_CLEAR_PASSWORD=your-secret-password
```

## Running

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Analysis
```
POST /api/analyze
Content-Type: application/json

{
  "type": "video-frame|image-analysis|text-analysis|context-search|content-aggregation",
  "data": "base64-image-or-text",
  "privacyLevel": "low|medium|high"
}
```

### Search
```
POST /api/search
Content-Type: application/json

{
  "query": "search terms",
  "context": "additional context",
  "privacyLevel": "low|medium|high"
}
```

### Content Aggregation
```
POST /api/aggregate
Content-Type: application/json

{
  "sources": ["url1", "url2", "url3"],
  "filters": ["filter1", "filter2"],
  "privacyLevel": "low|medium|high"
}
```

### Model Status
```
GET /api/models
```

## Models

The backend supports multiple AI models:

1. **Object Detection** (COCO-SSD): Detects objects in images/videos
2. **OCR** (Tesseract.js): Extracts text from images
3. **Text Analysis**: Basic NLP for text content
4. **Scene Understanding**: (Planned) Understands scene context

## Privacy Features

- **Low Privacy**: Minimal filtering, faster processing
- **Medium Privacy**: Balanced approach, some anonymization
- **High Privacy**: Maximum anonymization, all identifiable data hashed

## Architecture

```
Client (Browser Extension)
        ↓
    Backend API
        ↓
  Analysis Pipeline
        ↓
  AI Models (Parallel)
        ↓
  Result Curation
        ↓
  Privacy Filtering
        ↓
  Response to Client
```

## Development

### Adding New Models

1. Add model dependency to `package.json`
2. Load model in `server.js` `initializeModels()` method
3. Add processing logic in appropriate analysis method
4. Update API documentation

### Testing

```bash
npm test
```

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `CACHE_CLEAR_PASSWORD`: Password for cache clearing endpoint

## Performance

- Intelligent caching with configurable TTL
- Parallel model processing
- Streaming responses for large analyses
- Connection pooling for external API calls

## Security

- Helmet.js for security headers
- CORS configuration
- Input validation and sanitization
- Rate limiting (planned)
- API key authentication (planned)

## Monitoring

- Health check endpoint
- Model status endpoint
- Request logging with Morgan
- Error tracking (planned)