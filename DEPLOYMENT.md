# Deployment Guide for Render

## Prerequisites
- Render account
- GitHub repository connected

## Deployment Steps

### 1. Connect to Render
1. Go to [render.com](https://render.com)
2. Sign up/Login with your GitHub account
3. Click "New +" and select "Static Site"

### 2. Connect Repository
1. Connect your GitHub repository: `santhoshkv102003/clinic-token-management`
2. Select the repository

### 3. Configure Build Settings
- **Name**: `clinic-token-system`
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Environment**: Static Site

### 4. Environment Variables (if needed)
- No environment variables required for this project

### 5. Deploy
1. Click "Create Static Site"
2. Render will automatically build and deploy your app
3. Your app will be available at: `https://your-app-name.onrender.com`

## Build Process
1. Render installs dependencies: `npm install`
2. Builds the project: `npm run build`
3. Serves the `dist` folder as a static site

## Custom Domain (Optional)
1. Go to your site settings in Render
2. Add your custom domain
3. Update DNS settings as instructed

## Troubleshooting
- Check build logs if deployment fails
- Ensure all dependencies are in `package.json`
- Verify the build command works locally: `npm run build` 