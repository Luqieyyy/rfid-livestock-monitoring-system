# Deployment Guide

## Deployment Options

### Option 1: Vercel (Recommended)

**Why Vercel?**
- Optimized for Next.js
- Automatic deployments from Git
- Free tier available
- Built-in analytics
- Serverless functions support

**Steps:**

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables**
   - Go to your project on Vercel dashboard
   - Settings > Environment Variables
   - Add all Firebase credentials from `.env.local`

5. **Production Deployment**
   ```bash
   vercel --prod
   ```

**Custom Domain:**
- Go to Settings > Domains
- Add your custom domain
- Update DNS records as instructed

---

### Option 2: Netlify

**Steps:**

1. **Build the Project**
   ```bash
   npm run build
   ```

2. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

3. **Initialize Netlify**
   ```bash
   netlify init
   ```

4. **Deploy**
   ```bash
   netlify deploy --prod
   ```

5. **Environment Variables**
   - Go to Site settings > Environment variables
   - Add all Firebase credentials

**Build Settings:**
- Build command: `npm run build`
- Publish directory: `.next`

---

### Option 3: Firebase Hosting

**Steps:**

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login**
   ```bash
   firebase login
   ```

3. **Initialize Hosting**
   ```bash
   firebase init hosting
   ```

4. **Build Project**
   ```bash
   npm run build
   ```

5. **Deploy**
   ```bash
   firebase deploy --only hosting
   ```

**Configuration (`firebase.json`):**
```json
{
  "hosting": {
    "public": ".next",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

### Option 4: AWS Amplify

**Steps:**

1. **Install Amplify CLI**
   ```bash
   npm install -g @aws-amplify/cli
   ```

2. **Initialize Amplify**
   ```bash
   amplify init
   ```

3. **Add Hosting**
   ```bash
   amplify add hosting
   ```

4. **Publish**
   ```bash
   amplify publish
   ```

---

### Option 5: Custom VPS (DigitalOcean, Linode, etc.)

**Prerequisites:**
- Ubuntu 20.04+ server
- Node.js 18+ installed
- Nginx installed
- Domain name pointed to server

**Steps:**

1. **SSH into Server**
   ```bash
   ssh user@your-server-ip
   ```

2. **Clone Repository**
   ```bash
   git clone your-repo-url
   cd AdminBuyer
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Create Environment File**
   ```bash
   nano .env.local
   # Add Firebase credentials
   ```

5. **Build Project**
   ```bash
   npm run build
   ```

6. **Install PM2**
   ```bash
   npm install -g pm2
   ```

7. **Start Application**
   ```bash
   pm2 start npm --name "livestock-web" -- start
   pm2 save
   pm2 startup
   ```

8. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

9. **Enable Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/livestock /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

10. **Setup SSL with Let's Encrypt**
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d yourdomain.com
    ```

---

## Environment Variables Checklist

Ensure these are set in your deployment platform:

- ✅ `NEXT_PUBLIC_FIREBASE_API_KEY`
- ✅ `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ✅ `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ✅ `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ✅ `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ✅ `NEXT_PUBLIC_FIREBASE_APP_ID`

---

## Post-Deployment Checklist

- [ ] Test all pages load correctly
- [ ] Verify Firebase connection works
- [ ] Check Admin Dashboard functionality
- [ ] Test Buyer Portal
- [ ] Verify responsive design on mobile
- [ ] Test data fetching from Firestore
- [ ] Check browser console for errors
- [ ] Test navigation between pages
- [ ] Verify all routes work (no 404s)
- [ ] Check performance metrics
- [ ] Test with production data
- [ ] Setup monitoring/analytics
- [ ] Configure custom domain (if applicable)
- [ ] Setup SSL certificate

---

## Performance Optimization

### Before Deployment

1. **Optimize Images**
   - Use Next.js Image component
   - Compress images before upload
   - Use appropriate formats (WebP)

2. **Code Splitting**
   - Already handled by Next.js
   - Use dynamic imports for heavy components

3. **Caching Strategy**
   - Configure appropriate cache headers
   - Use Firestore caching when possible

### After Deployment

1. **Monitor Performance**
   - Use Vercel Analytics or Google Analytics
   - Check Core Web Vitals
   - Monitor Firebase usage

2. **Optimize Bundle Size**
   ```bash
   npm run build
   # Check .next/analyze/client.html
   ```

---

## Troubleshooting Common Deployment Issues

### Issue: Build Fails

**Solution:**
```bash
# Clear cache and rebuild
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

### Issue: Environment Variables Not Working

**Solution:**
- Ensure all variables have `NEXT_PUBLIC_` prefix
- Redeploy after adding variables
- Check variable names are exact match

### Issue: Firebase Connection Fails

**Solution:**
- Verify Firebase credentials
- Check Firebase project is active
- Ensure Firestore rules allow read access

### Issue: 404 on Routes

**Solution:**
- Ensure Next.js is in production mode
- Check routing configuration
- Verify all page files exist

---

## Continuous Deployment

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## Monitoring and Maintenance

### Recommended Tools

- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry, LogRocket
- **Analytics**: Google Analytics, Vercel Analytics
- **Firebase Monitoring**: Firebase Console

### Regular Maintenance

- Check Firebase usage monthly
- Review error logs weekly
- Update dependencies regularly
- Monitor performance metrics
- Backup Firestore data

---

For more help, consult:
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
