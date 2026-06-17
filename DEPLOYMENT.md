# Deployment Guide: Render & Vercel

This guide will help you deploy your Smart Attendance Management System to Render (backend) and Vercel (frontend).

## Prerequisites

- [Render](https://render.com) account
- [Vercel](https://vercel.com) account
- GitHub repository (already set up)

## Backend Deployment (Render)

### Step 1: Connect GitHub Repository
1. Go to [render.com/dashboard](https://render.com/dashboard)
2. Click **"New +"** → **"Web Service"**
3. Select **"Build and deploy from a Git repository"**
4. Authorize GitHub and select the `Madhupelluri/Smart-Attendance-Management-System` repository

### Step 2: Configure the Service
- **Name**: `smart-attendance-backend`
- **Root Directory**: `backend`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free (or Paid if you need auto-renewal)

### Step 3: Add Environment Variables
Add these in the **Environment** section:
- `NODE_ENV`: `production`
- `MONGODB_URI`: (paste your MongoDB connection string)
- `JWT_SECRET`: (generate a strong random string)
- `PORT`: `10000` (Render-specific)

### Step 4: Deploy
Click **"Deploy"** and wait for the build to complete (~2-3 minutes).

Once deployed, you'll get a URL like: `https://smart-attendance-backend.onrender.com`

---

## Frontend Deployment (Vercel)

### Step 1: Connect GitHub Repository
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select the `Smart-Attendance-Management-System` repository
4. Choose **"Next"**

### Step 2: Configure Project
- **Project Name**: `smart-attendance-frontend`
- **Framework Preset**: `Vite`
- **Root Directory**: `frontend`

### Step 3: Environment Variables
Add these variables:
- **Key**: `VITE_API_URL`
- **Value**: `https://smart-attendance-backend.onrender.com` (your Render backend URL)

### Step 4: Deploy
Click **"Deploy"** and wait for the build (~1-2 minutes).

Once deployed, you'll get a URL like: `https://smart-attendance-frontend.vercel.app`

---

## Update Frontend API Configuration

After deploying the backend to Render:

1. Go to Vercel → **Settings** → **Environment Variables**
2. Update `VITE_API_URL` with your Render backend URL
3. Trigger a **Redeploy** to use the new variable

---

## Auto-Deployment (GitHub Integration)

Both Render and Vercel are already configured for auto-deployment:

- **When you push to `main` branch**, both services automatically redeploy
- Check deployment status in their dashboards
- View logs if deployment fails

---

## Testing Your Deployment

After both deployments are complete:

1. **Test Backend** (Postman or browser):
   ```
   GET https://your-backend-url.onrender.com/api/health
   ```
   Should return: `{"status":"ok","message":"Smart Attendance API is running"}`

2. **Test Frontend**:
   Open `https://your-frontend-url.vercel.app` in your browser and log in

---

## Troubleshooting

### Backend not starting?
- Check **Logs** in Render dashboard
- Verify `MONGODB_URI` is correct
- Ensure `JWT_SECRET` is set

### Frontend showing "Cannot find module"?
- Clear Vercel cache: **Settings** → **Git** → **Deploy Hooks** → Redeploy
- Verify `VITE_API_URL` is set in Environment Variables

### CORS errors?
- Backend has `cors()` middleware enabled
- If issues persist, check CORS configuration in `backend/server.js`

---

## Environment Files

- **Backend**: `backend/.env.example` → copy to `backend/.env`
- **Frontend**: `frontend/.env.example` → copy to `frontend/.env.local`

Never commit `.env` files (they're in `.gitignore`)
