# Reverse Search Service - API Key Setup

## 🔑 Google Reverse Image Search (REQUIRED)

### Step 1: Get SerpAPI Key

1. **Sign up** at: https://serpapi.com
2. **Free tier includes:**
   - 100 searches/day
   - No credit card required
   - Instant activation

3. **Get your API key:**
   - Go to dashboard
   - Copy your API key

### Step 2: Configure Service

Create a `.env` file in `services/reverse-search/`:

```bash
cd services/reverse-search
touch .env
```

Add your API key:

```env
SERPAPI_KEY=your_actual_api_key_here
```

### Step 3: Install SerpAPI Package

```bash
# Activate virtual environment
source venv/bin/activate

# Install package
pip install google-search-results
```

### Step 4: Restart Service

```bash
# Kill old service
kill $(cat /tmp/reverse_search.pid)

# Start with new API key
python main.py > reverse_search.log 2>&1 &
echo $! > /tmp/reverse_search.pid
```

### Step 5: Test

```bash
curl http://localhost:8001/health
```

Should show:
```json
{
  "status": "ok",
  "google_enabled": true,    // ← Should be true now!
  "phash_db_size": 0
}
```

---

## 📊 Current Status

**Without API Key:**
- ❌ Google Reverse Search: DISABLED
- ✅ pHash Database: Working (but empty)
- ⚠️  Search will return minimal/no results

**With API Key:**
- ✅ Google Reverse Search: ENABLED
- ✅ pHash Database: Working
- ✅ Full reverse search functionality
- ✅ Real matches from Google Images

---

## 🔧 Optional: TinEye (Advanced)

If you want additional search engines:

1. Sign up at: https://tineye.com/api
2. Add to `.env`:

```env
TINEYE_PUBLIC_KEY=your_public_key
TINEYE_PRIVATE_KEY=your_private_key
```

---

## ⚠️ Important Notes

1. **Mock Mode Removed:**
   - Service no longer returns fake/mock results
   - Without API key, Google search will be disabled
   - Only pHash database will work (if populated)

2. **API Rate Limits:**
   - Free tier: 100 searches/day
   - Monitor usage in SerpAPI dashboard
   - Service will throw error if limit exceeded

3. **Security:**
   - Never commit `.env` file to git
   - `.env` is in `.gitignore`
   - Keep API keys secret

---

## 🎯 For Hackathon Demo

**Option A: Get Free API Key** (Recommended)
- Takes 2 minutes to sign up
- 100 searches/day is plenty for demo
- Real results look much better

**Option B: Demo Without API**
- Explain: "Google API can be easily added"
- Focus on AI Detection (82.9% F1 score!)
- Show infrastructure is ready

---

## 🆘 Troubleshooting

### Service shows `google_enabled: false`

```bash
# Check if .env file exists
ls -la services/reverse-search/.env

# Check if key is set
cat services/reverse-search/.env | grep SERPAPI

# Restart service
kill $(cat /tmp/reverse_search.pid)
cd services/reverse-search
source venv/bin/activate
python main.py > reverse_search.log 2>&1 &
echo $! > /tmp/reverse_search.pid
```

### `serpapi` package not found

```bash
cd services/reverse-search
source venv/bin/activate
pip install google-search-results
```

### API key invalid

- Check for typos in `.env`
- Verify key in SerpAPI dashboard
- Make sure no spaces/quotes around key

---

## 📞 Need Help?

Check logs:
```bash
tail -f services/reverse-search/reverse_search.log
```

Or ask for help! 😊

