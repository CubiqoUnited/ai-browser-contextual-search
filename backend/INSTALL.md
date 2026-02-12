# Installation Guide

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/CubiqoUnited/ai-browser-contextual-search.git
cd ai-browser-contextual-search
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install extension dependencies
cd extension
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 3. Configure Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

### 4. Start Backend Server
```bash
cd backend
npm run dev
# Server runs on http://localhost:3000
```

### 5. Load Browser Extension

#### Chrome:
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `ai-browser-contextual-search/extension` folder

#### Firefox:
1. Open Firefox and go to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select any file in the `extension` folder

### 6. Test the Extension
1. Visit any website with videos or images
2. Click the extension icon in your toolbar
3. Try analyzing a video or image

## Advanced Installation

### Docker Deployment (Backend)

```bash
cd backend
docker build -t ai-browser-backend .
docker run -p 3000:3000 --env-file .env ai-browser-backend
```

### Production Build

```bash
# Build extension
cd extension
npm run build

# Build backend
cd ../backend
npm run build
```

### Environment Variables

#### Backend (.env):
```env
PORT=3000
NODE_ENV=production
CACHE_CLEAR_PASSWORD=your-secure-password
REDIS_URL=redis://localhost:6379
```

#### Extension Configuration:
Edit `extension/background.js` to point to your backend URL:
```javascript
const settings = {
  apiEndpoint: 'https://your-backend-domain.com/api',
  // ...
};
```

## Troubleshooting

### Extension Not Loading
- Make sure you're loading the correct folder (`extension/`)
- Check browser console for errors (F12 → Console)
- Verify manifest.json is valid

### Backend Connection Issues
- Check if backend is running: `curl http://localhost:3000/health`
- Verify CORS settings in backend
- Check browser network tab for failed requests

### AI Models Not Loading
- Ensure you have sufficient RAM (models can be memory-intensive)
- Check Node.js version (requires Node 18+)
- Verify all dependencies are installed

### Privacy Features Not Working
- Check privacy level settings in extension popup
- Verify backend is applying privacy filters
- Check console for any errors

## Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Extension tests (coming soon)
cd extension
npm test
```

### Code Structure
```
ai-browser-contextual-search/
├── extension/           # Browser extension
│   ├── manifest.json   # Extension manifest
│   ├── background.js   # Background service worker
│   ├── content.js      # Content script
│   ├── popup.*         # Popup UI
│   └── icons/          # Extension icons
├── backend/            # AI processing server
│   ├── server.js      # Main server
│   ├── package.json   # Dependencies
│   └── models/        # AI models (optional)
└── shared/            # Shared utilities
```

### Adding New Features

1. **New AI Model**:
   - Add to backend `package.json`
   - Load in `server.js`
   - Add processing logic
   - Update extension to use new model

2. **New UI Feature**:
   - Add to extension popup
   - Update content script if needed
   - Add background script handler

3. **New Privacy Feature**:
   - Add to privacy filtering in backend
   - Update extension settings
   - Add tests

## Security Notes

1. **Never commit sensitive data** to the repository
2. **Use environment variables** for configuration
3. **Regularly update dependencies**: `npm audit`
4. **Enable HTTPS** in production
5. **Implement rate limiting** for public deployments

## Support

- Issues: [GitHub Issues](https://github.com/CubiqoUnited/ai-browser-contextual-search/issues)
- Documentation: [README.md](./README.md)
- Backend API: [backend/README.md](./backend/README.md)