# 🍕 Pizza Ordering App - Streamlit Deployment

This is a Streamlit wrapper for the Pizza Ordering App that embeds your original React UI without any changes.

## 🚀 Quick Start

### Local Setup

1. **Install dependencies:**
   ```bash
   cd streamlit_deploy
   pip install -r requirements.txt
   ```

2. **Create .env file:**
   ```bash
   cp .env.example .env
   ```

3. **Update .env with your URLs:**
   ```
   REACT_APP_URL=http://localhost:3000
   API_URL=http://localhost:5000/api
   ```

4. **Make sure your React app is running:**
   ```bash
   cd ../client
   npm start
   ```

5. **In another terminal, start Streamlit:**
   ```bash
   cd streamlit_deploy
   streamlit run app.py
   ```

Your Streamlit app will open at: **http://localhost:8501**

---

## ☁️ Deploy to Streamlit Cloud

### 1. Push to GitHub

```bash
git add streamlit_deploy/
git commit -m "Add Streamlit deployment"
git push origin main
```

### 2. Deploy on Streamlit Cloud

1. Go to https://streamlit.io/cloud
2. Sign in with GitHub
3. Click "New app"
4. Select your repository
5. Set these options:
   - **Repository:** your-repo
   - **Branch:** main
   - **Main file path:** `streamlit_deploy/app.py`

### 3. Add Secrets

After deployment:
1. Click menu (≡) → Settings
2. Go to "Secrets"
3. Add your configuration:
   ```toml
   API_URL = "https://your-backend.onrender.com/api"
   REACT_APP_URL = "https://your-frontend.vercel.app"
   ```

4. Click "Save" and the app will redeploy

---

## 📁 Project Structure

```
streamlit_deploy/
├── app.py                      # Main Streamlit app
├── requirements.txt            # Python dependencies
├── .env.example               # Environment template
├── .streamlit/
│   └── config.toml            # Streamlit configuration
└── README.md                  # This file
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `REACT_APP_URL` | Frontend URL | `http://localhost:3000` |
| `API_URL` | Backend API URL | `http://localhost:5000/api` |

---

## 🌐 Production URLs

After deploying your full stack:

```
Frontend (Vercel):  https://pizza-app-xxx.vercel.app
Backend (Render):   https://pizza-app-backend.onrender.com
Streamlit:          https://pizza-app-streamlit.streamlit.app
```

---

## ❓ Troubleshooting

### Blank page on Streamlit?
- Check if frontend URL is accessible
- Verify CORS settings on backend
- Check browser console for errors

### API connection error?
- Make sure backend is running
- Check API_URL in .env
- Verify MongoDB connection on backend

### Iframe not loading?
- Ensure both frontend and backend are running
- Check that URLs don't have trailing slashes
- Clear Streamlit cache: `streamlit cache clear`

---

## 📚 Features

✅ Original React UI (no changes)
✅ All app features work seamlessly
✅ Responsive design
✅ Easy deployment to Streamlit Cloud
✅ Zero code modifications needed

---

## 🚀 Deployment Checklist

- [ ] Backend deployed (Render)
- [ ] Frontend deployed (Vercel)
- [ ] MongoDB database connected
- [ ] Code pushed to GitHub
- [ ] Streamlit Cloud connected
- [ ] Secrets configured on Streamlit Cloud
- [ ] App tested and working

---

## 💡 Tips

1. **Keep URLs up to date:** Update .env when deploying to production
2. **Test locally first:** Run all three services locally before cloud deployment
3. **Monitor logs:** Check Streamlit Cloud logs for any issues
4. **Update regularly:** Push code changes to GitHub for auto-redeploy

---

Your pizza ordering app is ready to serve! 🍕🚀
