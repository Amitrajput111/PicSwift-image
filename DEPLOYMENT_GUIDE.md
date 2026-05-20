# PicSwift - Fast Static Deployment Guide 🚀

Your website is 100% client-side, which means you can deploy it to the web for **free** in less than 2 minutes using **Netlify** or **Vercel** without writing any code or setting up Git repositories.

---

## ⚡ Option 1: Drag & Drop with Netlify (Easiest - 1 Minute)

1. Open your browser and go to **[Netlify Drop](https://app.netlify.com/drop)**.
2. Open the project folder on your computer:
   `C:\Users\amitr\.gemini\antigravity\scratch\clarity-ai-suite`
3. Drag and drop the **`dist`** folder directly into the browser upload box on the Netlify Drop page.
4. Your website is instantly live! Netlify will provide a free link (e.g., `https://random-name.netlify.app`).

---

## 🚀 Option 2: Deploying with Vercel CLI (Automatic updates - 2 Minutes)

If you want to deploy directly from your command line:

1. Open your command line in the project folder:
   `C:\Users\amitr\.gemini\antigravity\scratch\clarity-ai-suite`
2. Install the Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```
3. Run the deployment command:
   ```bash
   vercel
   ```
4. Follow the brief prompts (login, project setup, etc.) to publish your website instantly.

---

## 🔗 Option 3: Connect Your Custom Domain

Once your site is live on Netlify or Vercel:
1. Go to your site settings on Netlify/Vercel.
2. Click **Add Domain** and enter your custom domain (e.g., `picswift.com` or `fastpictools.com`).
3. Set your domain's DNS settings at your domain registrar (e.g., GoDaddy, Namecheap) to point to Netlify/Vercel.
4. The hosting service will automatically issue a **free SSL security certificate (HTTPS)**.

---

## 💰 Applying for Google AdSense

Once your custom domain is connected and live:
1. Register/Log in to **[Google AdSense](https://adsense.google.com/)**.
2. Submit your domain for review.
3. The AdSense bots will scan your site. Since we already set up functional **Privacy Policy, Terms of Service, Contact details**, and **rich SEO guides**, your application has everything required to pass review.
4. Once approved, place your AdSense publisher ad-codes inside `src/components/AdPlaceholder.tsx` (replacing the styled containers) to begin generating revenue!
