# Test Guide

## Quick Test

### 1. Start Backend Server
```bash
cd backend
npm install
npm run dev
```
Server should start on `http://localhost:3000`

### 2. Test Backend API
```bash
# Health check
curl http://localhost:3000/health

# Test analysis (mock response)
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"type":"text-analysis","data":"Test text for analysis","privacyLevel":"medium"}'
```

### 3. Load Extension
1. Open Chrome → `chrome://extensions/`
2. Enable Developer Mode
3. Load unpacked → Select `extension/` folder
4. Extension icon should appear in toolbar

### 4. Test Extension
1. Visit YouTube or any video site
2. Click extension icon → Test "Analyze Current Page"
3. Hover over a video → Click "🔍 AI Analyze" button
4. Check overlay appears with analysis results

## Feature Tests

### Video Analysis
1. Find a video with clear objects/people
2. Click AI Analyze button on video
3. Verify overlay shows detected entities
4. Test search buttons for detected entities

### Privacy Features
1. Open extension popup
2. Change Privacy Level to "High"
3. Analyze content
4. Verify data is anonymized/hashed

### Content Aggregation
1. Use context menu (right-click selection)
2. Choose "Search contextual information"
3. Verify multiple sources appear in results

### Multi-Model Processing
1. Check backend logs during analysis
2. Verify parallel processing (mock responses)
3. Check curated results combine multiple model outputs

## Expected Results

### Backend Health Check
```json
{
  "status": "healthy",
  "timestamp": "2026-02-10T10:30:00.000Z",
  "models": ["objectDetection", "ocr"]
}
```

### Video Analysis Response
```json
{
  "type": "video-frame",
  "entities": [
    {"text": "person", "type": "object", "confidence": 0.85},
    {"text": "car", "type": "object", "confidence": 0.78}
  ],
  "metadata": {
    "frameCount": 1,
    "analysisType": "object-detection"
  }
}
```

### Privacy Mode (High)
```json
{
  "type": "text-analysis",
  "text": "hashed-value",
  "entities": [
    {"text": "hashed-entity", "type": "potential-entity", "confidence": 0.7}
  ],
  "privacy": {
    "filtered": true,
    "level": "high"
  }
}
```

## Troubleshooting Tests

### Extension Not Working
1. Check browser console (F12)
2. Verify extension is enabled
3. Check permissions in manifest.json

### Backend Connection Failed
1. Check if server is running
2. Test `curl http://localhost:3000/health`
3. Check CORS settings in backend

### AI Models Not Loading
1. Check backend logs for model loading errors
2. Verify Node.js version (18+)
3. Check available memory

### Performance Issues
1. Check network tab for request times
2. Verify caching is working
3. Check backend response times

## Automated Tests

### Backend Tests
```bash
cd backend
npm test
```

Tests include:
- API endpoint validation
- Privacy filtering
- Error handling
- Cache functionality

### Extension Tests (Coming Soon)
```bash
cd extension
npm test
```

## Security Tests

### Privacy Validation
1. Test each privacy level (low, medium, high)
2. Verify data anonymization at high level
3. Check no PII leaks in responses

### Input Validation
1. Test malformed requests to backend
2. Verify proper error responses
3. Check for injection vulnerabilities

### CORS Validation
1. Test from different origins
2. Verify proper CORS headers
3. Check preflight requests

## Load Testing

### Concurrent Requests
```bash
# Using Apache Bench
ab -n 100 -c 10 -p test.json -T application/json http://localhost:3000/api/analyze
```

### Memory Usage
1. Monitor RAM during analysis
2. Check for memory leaks
3. Verify proper cleanup

## Browser Compatibility

Tested on:
- Chrome 120+
- Firefox 115+
- Edge 120+

## Next Steps After Testing

1. **Fix any issues** found during testing
2. **Optimize performance** based on test results
3. **Add more test cases** for edge cases
4. **Update documentation** with test results
5. **Prepare for production** deployment