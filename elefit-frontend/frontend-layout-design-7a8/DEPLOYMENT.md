# EleFit Frontend Deployment Guide

## Vercel Deployment

This project is configured for deployment to Vercel. Follow these steps:

### Prerequisites
- Vercel account (free at [vercel.com](https://vercel.com))
- Git repository (GitHub, GitLab, or Bitbucket)

### Deployment Steps

1. **Push your code to a Git repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_REPOSITORY_URL
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your Git provider
   - Click "New Project"
   - Import your repository
   - Vercel will automatically detect the configuration

3. **Environment Variables**
   After deployment, add these environment variables in your Vercel project settings:
   
   ```
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
   
   VITE_SHOPIFY_ACCESS_TOKEN=your_shopify_access_token
   VITE_SHOPIFY_API_KEY=your_shopify_api_key
   VITE_SHOPIFY_API_SECRET=your_shopify_api_secret
   VITE_SHOPIFY_DOMAIN=your_shopify_domain
   VITE_SHOPIFY_STOREFRONT_API_URL=your_shopify_storefront_api_url
   VITE_SHOPIFY_ADMIN_API_URL=your_shopify_admin_api_url
   
   VITE_OPENAI_API_KEY=your_openai_api_key
   
   VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
   VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
   VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
   
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_GOOGLE_CALENDAR_API_KEY=your_google_calendar_api_key
   
   VITE_APP_ENV=production
   VITE_APP_URL=https://your-vercel-app.vercel.app
   ```

### Automatic Deployments

Once connected, Vercel will automatically deploy:
- Every push to the `main` branch
- Pull requests as preview deployments
- Custom branches as specified

### Build Process

Vercel will automatically:
1. Install dependencies with `npm install`
2. Build the client with `npm run build:client`
3. Serve the static files from `dist/spa`

### Custom Domain

To use a custom domain:
1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run start
```

## Project Structure

- `client/` - React frontend components
- `server/` - Express server (for development only)
- `shared/` - Shared types and utilities
- `dist/spa/` - Built static files (output directory)
- `vercel.json` - Vercel deployment configuration

## Troubleshooting

If you encounter issues:
1. Check the build logs in Vercel dashboard
2. Verify all environment variables are set correctly
3. Ensure your `vercel.json` configuration is correct
4. Check that all dependencies are properly installed

For support, visit [Vercel Documentation](https://vercel.com/docs)