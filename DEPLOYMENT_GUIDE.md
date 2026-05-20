# PicSwift - Production Deployment Guide 🚀

Your project consists of a **Vite + React frontend** and a secure **Node.js/Express backend** that handles JWT sessions and HTTP-Only cookies.

---

## 💻 1. Local Development (Running Both Together)

To run the full authenticated application locally, you will start the backend and the frontend in two separate terminals:

### Terminal A: Start the Backend Server
```bash
cd server
npm install
npm start
```
*The backend will boot up on **`http://localhost:5000`**.*

### Terminal B: Start the Frontend Client
```bash
# In the root folder
npm install
npm run dev
```
*The client will boot up on **`http://localhost:5173`**.*

The frontend is pre-configured to communicate with the backend using credentials, meaning your **HTTP-Only cookies** will save automatically in the browser for secure sessions.

---

## ☁️ 2. Production Hosting Options

### Option A: Serverless Backend on Vercel (Easiest - All-in-One)
Vercel allows you to deploy the backend directly inside the same project folder by placing Express routes inside an **`/api`** folder. 
1. The project is fully setup and configured to auto-deploy.
2. Link your repository: **`https://github.com/Amitrajput111/PicSwift-image`** to Vercel.
3. Vercel automatically deploys the static files and compiles the backend routes.

### Option B: Split Hosting (Express Server on Render / Railway)
You can host the Express backend for free on **[Render](https://render.com/)** or **[Railway](https://railway.app/)**:
1. Connect your GitHub repository to Render and choose **Web Service**.
2. Set the build command to `npm install` and start command to `node server/server.js`.
3. In your React code, the API calls will dynamically direct requests to your Render URL.

---

## 💰 Google AdSense & ads.txt Verification

1. Place your AdSense codes inside `src/components/AdPlaceholder.tsx`.
2. Go to your AdSense dashboard and link your custom domain (e.g., `picswift.com`).
3. Make sure your custom domain has the `/ads.txt` file readable (which is already configured inside your `public/` directory!).
4. Once verified, Google Ads will start rendering in the slots and generate passive revenue with **$0 server compute overhead**!
