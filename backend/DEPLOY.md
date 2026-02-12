# Deployment Guide

## Quick Deploy (One-Click)

### Option 1: Deploy to Render (Recommended - Free)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/CubiqoUnited/ai-browser-contextual-search)

**Steps:**
1. Click the button above
2. Connect your GitHub account
3. Select repository: `ai-browser-contextual-search`
4. Service will auto-deploy in ~5 minutes
5. Get your URL: `https://ai-browser-backend.onrender.com`

### Option 2: Deploy to Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/CubiqoUnited/ai-browser-contextual-search)

### Option 3: Deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/CubiqoUnited/ai-browser-contextual-search)

## Manual Deployment

### 1. Local Deployment (Docker)
```bash
# Clone repository
git clone https://github.com/CubiqoUnited/ai-browser-contextual-search.git
cd ai-browser-contextual-search

# Run deployment script
chmod +x deploy.sh
./deploy.sh local

# Backend will be available at: http://localhost:3000
```

### 2. Cloud Deployment (Render)
```bash
# Install Render CLI
npm install -g render-cli

# Login to Render
render login

# Deploy
render deploy
```

### 3. Cloud Deployment (Railway)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Deploy
railway up
```

## Environment Variables

Create `.env.production` in `backend/` folder:
```env
NODE_ENV=production
PORT=3000
CACHE_CLEAR_PASSWORD=your-secure-password-here
```

## Testing Deployment

After deployment, test your backend:

```bash
# Health check
curl https://your-deployment-url/health

# Test API
curl -X POST https://your-deployment-url/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"type":"text-analysis","data":"Test","privacyLevel":"medium"}'
```

## Update Browser Extension

After deploying backend, update the extension configuration:

1. Open `extension/background.js`
2. Find `apiEndpoint` setting
3. Update to your deployment URL:
```javascript
const settings = {
  apiEndpoint: 'https://your-deployment-url/api',
  // ...
};
```

4. Reload extension in browser

## Scaling

### Free Tier Limits
- **Render**: 750 hours/month free, sleep after inactivity
- **Railway**: $5/month free credits
- **Vercel**: 100GB-hours free

### Production Scaling
1. **Upgrade Plan**: Move to paid tier
2. **Add Redis**: For better caching
3. **Load Balancing**: Multiple instances
4. **CDN**: For static assets

## Monitoring

### Health Checks
- Endpoint: `/health`
- Returns: Status, models, uptime

### Logs
```bash
# Render
render logs ai-browser-backend

# Railway
railway logs

# Vercel
vercel logs
```

### Metrics to Monitor
1. **Response Time**: Should be < 500ms
2. **Error Rate**: Should be < 1%
3. **Memory Usage**: Watch for leaks
4. **CPU Usage**: Scale if > 70%

## Security

### Required Actions
1. **Change Default Passwords**: Update `CACHE_CLEAR_PASSWORD`
2. **Enable HTTPS**: All platforms provide SSL
3. **Set CORS**: Configure allowed origins
4. **Rate Limiting**: Implement if public

### Recommended
1. **API Keys**: Add authentication
2. **WAF**: Web Application Firewall
3. **DDoS Protection**: Cloudflare
4. **Backup**: Regular database backups

## Troubleshooting

### Deployment Fails
1. Check logs for errors
2. Verify environment variables
3. Check Dockerfile syntax
4. Ensure port 3000 is exposed

### Backend Not Responding
1. Check health endpoint
2. Verify CORS settings
3. Check firewall rules
4. Test locally first

### High Memory Usage
1. Reduce AI model memory
2. Implement caching
3. Add memory limits in Docker
4. Scale vertically

### Extension Connection Issues
1. Check backend URL in extension
2. Verify CORS allows extension origin
3. Check browser console for errors
4. Test API directly with curl

## Cost Optimization

### Free Tier Tips
1. **Use Sleep**: Services sleep when inactive
2. **Optimize Images**: Smaller Docker images
3. **Cache Aggressively**: Reduce API calls
4. **Compress Responses**: Enable gzip

### Paid Tier Tips
1. **Reserved Instances**: Cheaper than on-demand
2. **Auto-scaling**: Scale based on load
3. **Multi-region**: Better latency
4. **CDN**: Reduce origin load

## Support

### Common Issues
- **Model Loading Failures**: Increase memory allocation
- **CORS Errors**: Update allowed origins
- **Timeout Errors**: Increase timeout settings
- **Memory Leaks**: Monitor and restart

### Getting Help
1. Check [GitHub Issues](https://github.com/CubiqoUnited/ai-browser-contextual-search/issues)
2. Review deployment logs
3. Test locally first
4. Contact platform support

## Next Steps After Deployment

1. **Test Thoroughly**: All API endpoints
2. **Monitor Performance**: Response times, errors
3. **Set Up Alerts**: For downtime, errors
4. **Plan Scaling**: Based on usage
5. **Update Documentation**: With your URLs
6. **Share Feedback**: Report issues, suggest features