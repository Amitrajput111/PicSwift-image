# PicSwift - Production Deployment Guide 🚀

Your project is built as a highly optimized, production-ready fullstack application consisting of a **React + Vite frontend** and a **secure Express + MongoDB backend**.

---

## 💻 1. Unified Local Development (Recommended)

To eliminate CORS and cookie-sharing port blocks on your browser, you can run the backend and frontend together with a proxy configuration.

### Step 1: Start the Backend Database Server
Open a terminal and run:
```bash
cd server
npm install
npm start
```
*The backend server will launch on **`http://localhost:5000`**.*

### Step 2: Start the Frontend Client
Open a second terminal in the root directory and run:
```bash
npm install
npm run dev
```
*The client will boot up on **`http://localhost:5173`**.*
*The client automatically proxies all `/api` routes directly to the backend. Your session cookies will save natively and securely!*

---

## ☁️ 2. Production Deployment (Unified Architecture)

This application is built with a **unified production design**. When you compile the frontend, the Express backend serves all React pages on the exact same port. You only need to deploy **one single application server** (on Render, Railway, or Heroku)!

### Step 1: Compile the React Assets
In the root directory, compile your frontend:
```bash
npm run build
```
This builds all HTML/JS assets into the `/dist` directory.

### Step 2: Push to GitHub & Deploy
1. Push all files to your repository: `https://github.com/Amitrajput111/PicSwift-image`
2. Link your GitHub repo to a cloud provider like **[Render](https://render.com/)**, **[Railway](https://railway.app/)**, or **[Heroku](https://heroku.com/)**.
3. Configure the following build/start commands in your cloud host dashboard:
   * **Root Directory:** `./`
   * **Build Command:** `npm install && npm run build && cd server && npm install`
   * **Start Command:** `node server/server.js`

---

## 🗄️ 3. Production Database Connection (MongoDB)

For handling high volumes of users (10,000 to 20,000+ accounts), configure a cloud database:

1. Create a free account at **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas)**.
2. Deploy a free cluster and fetch your MongoDB Connection String.
3. In your cloud hosting provider (Render, Railway, etc.), define the **Environment Variables**:
   * `NODE_ENV` = `production`
   * `JWT_SECRET` = `a_long_random_secure_character_string`
   * `MONGODB_URI` = `mongodb+srv://<username>:<password>@cluster.mongodb.net/picswift`
4. When the server launches, it detects the connection string and connects automatically to MongoDB.

---

## 💰 4. Google AdSense & ads.txt Verification

1. Place your AdSense slot IDs inside `src/components/AdPlaceholder.tsx`.
2. Connect your domain in your Google AdSense Dashboard.
3. Verify that your `/ads.txt` file is readable (already set up in your `public/ads.txt` folder).
4. Google will begin serving ads in your placeholders, yielding passive revenue as users process images!
