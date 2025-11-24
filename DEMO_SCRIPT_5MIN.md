# Demo Script - Media Provably Authentic
## 🎬 5-Minute Video Demo Script

**Total Duration**: 4 minutes 45 seconds  
**Target**: Hackathon judges & developers  
**Goal**: Show complete flow from upload to verified results

---

## 📋 Pre-Recording Checklist

### Setup (Do this before recording)
- [ ] All services running: `./start-all-services.sh`
- [ ] Browser tabs ready:
  - Tab 1: `http://localhost:3000` (Landing page)
  - Tab 2: `http://localhost:3000/app` (App page)
  - Tab 3: Backend logs (Terminal)
- [ ] Sui wallet connected and funded
- [ ] Test images ready in `test_google_search_samples/`:
  - `REAL_01.jpg` (famous artwork - will find on Google)
  - `AI_01.jpg` (AI-generated image)
- [ ] Screen recording software ready (QuickTime/OBS)
- [ ] Microphone tested
- [ ] Close unnecessary apps/notifications

---

## 🎤 SCRIPT

### [0:00 - 0:30] OPENING (30 seconds)

**[Show Landing Page - http://localhost:3000]**

> "Hi! I'm presenting **Media Provably Authentic** - a decentralized platform for verifying media authenticity using the Sui ecosystem.
> 
> In today's world of AI-generated images and deepfakes, how do you know if what you see is real? Our solution combines AI detection, reverse search, and cryptographic proof to provide transparent, verifiable analysis.
> 
> Let me show you how it works."

**[Click "Launch App" button]**

---

### [0:30 - 1:00] SYSTEM OVERVIEW (30 seconds)

**[Now on App page - http://localhost:3000/app]**

> "Our platform integrates the entire Sui ecosystem:
> 
> **[Point to wallet button]** We use Sui Wallet for authentication.
> 
> **[Point to process tree]** This tree shows our 33-step verification process in real-time.
> 
> Behind the scenes, we're using:
> - **7 AI models** in ensemble for maximum accuracy
> - **Walrus** for decentralized storage
> - **Nautilus TEE** - real AWS Nitro Enclave for cryptographic proof
> - **3 independent enclaves** for Byzantine fault tolerance
> - And finally, **Sui blockchain** for immutable attestation records.
> 
> Let's verify a real image."

---

### [1:00 - 1:15] CONNECT WALLET (15 seconds)

**[Click "Connect Wallet" button]**

> "First, I'll connect my Sui wallet..."

**[Wallet popup appears - click connect]**

> "...and we're connected!"

**[Wallet address shows in top right]**

---

### [1:15 - 1:30] UPLOAD IMAGE (15 seconds)

**[Drag REAL_01.jpg to upload zone OR click to browse]**

> "Now I'll upload this image - it's a famous artwork. Let's see what our system finds."

**[Image preview appears on left side]**

> "The image is loaded. Now I'll sign the upload request with my wallet to start verification."

**[Click "Sign & Verify Authenticity" button]**

---

### [1:30 - 2:30] PROCESSING (60 seconds)

**[Wallet signature popup appears]**

> "I'll approve the signature..."

**[Click "Sign" in wallet popup]**

**[Process tree starts animating - nodes light up]**

> "And now the magic happens! Watch the process tree - each node represents a step in our verification pipeline.
> 
> **[Stage 1 lights up]** First, we're encrypting the image with AES-256-GCM...
> 
> **[Stage 2 lights up]** ...and storing it to Walrus, Sui's decentralized storage.
> 
> **[Stage 3 - 3 parallel lanes light up]** Now comes the interesting part: **3 independent enclaves** are processing this image in parallel. This is our Byzantine fault tolerance - even if one enclave is compromised, the system still works.
> 
> Each enclave is:
> - Running **7 AI models** to detect if it's AI-generated
> - Performing **forensic analysis** - checking EXIF data, compression artifacts, noise patterns
> - Running **frequency analysis** using DCT and FFT
> - And conditionally running **reverse image search** via Google Lens
> 
> **[Stage 4 lights up]** The 3 enclaves are now voting on the results using weighted consensus...
> 
> **[Stage 5 lights up]** And finally, submitting the attestation to Sui blockchain for immutability."

**[All stages complete - results appear]**

---

### [2:30 - 3:45] RESULTS WALKTHROUGH (75 seconds)

**[Scroll through results slowly]**

> "Perfect! Let's look at the results.
> 
> **[Point to AI Detection section]**
> First, **AI Detection**: Our ensemble of 7 models gives this image a score of **0.15** - meaning only 15% AI-generated. That's **'Likely Real'**.
> 
> You can see the individual model scores here - all 7 models agree this is likely a real image.
> 
> **[Expand Forensic Analysis]**
> Next, **Forensic Analysis**: We found EXIF metadata, normal compression patterns, and natural noise distribution - all signs of a real photo.
> 
> **[Point to Frequency Analysis]**
> **Frequency Analysis**: DCT and FFT anomaly scores are low - no suspicious frequency patterns that AI-generated images often have.
> 
> **[Point to Quality Metrics]**
> **Quality Metrics**: Good sharpness, normal brightness and contrast.
> 
> **[Scroll to Reverse Search Results]**
> Now here's the exciting part - **Reverse Search Results**: We found this image on **3 sources**:
> 
> **[Point to matches]**
> - Wikipedia with 98% similarity
> - MoMA.org (Museum of Modern Art) with 95% similarity
> - Another art site with 92% similarity
> 
> All from notable, trusted sources. This confirms the image's provenance - it's a famous artwork!
> 
> **[Scroll to Blockchain Attestation]**
> **Blockchain Attestation**: Here's the Sui transaction hash - this entire report is now immutably stored on-chain.
> 
> **[Expand TEE Attestation]**
> And finally, **TEE Attestation**: This is the cryptographic proof from our AWS Nitro Enclave:
> - Real signature from the enclave
> - Attestation document in base64 CBOR format
> - Enclave's public key
> - And PCR measurements - these are the Platform Configuration Registers that prove the code running in the enclave hasn't been tampered with.
> 
> This is **cryptographically verifiable proof** that this analysis was performed in a secure, trusted execution environment."

---

### [3:45 - 4:30] TECHNICAL HIGHLIGHTS (45 seconds)

**[Switch to Terminal showing backend logs OR stay on results]**

> "Let me highlight what makes this special:
> 
> **1. Real Sui Ecosystem Integration**
> - We're using real Sui wallet, Walrus storage, and Nautilus TEE
> - All attestations are on Sui testnet blockchain
> - Everything is decentralized and verifiable
> 
> **2. High Accuracy**
> - Our 7-model ensemble achieves **96.6% recall** - we catch 96.6% of fake images
> - Forensic and frequency analysis add extra layers of verification
> 
> **3. Byzantine Fault Tolerance**
> - 3 independent enclaves process every image
> - Weighted voting based on reputation and stake
> - System works even if 1 enclave fails or is compromised
> 
> **4. Transparency**
> - We don't just say 'real' or 'fake'
> - We show you ALL the data: model scores, forensic metrics, reverse search results
> - You interpret the data in your context
> 
> **5. Cryptographic Proof**
> - Real AWS Nitro Enclave attestations
> - Immutable blockchain records
> - Fully auditable and verifiable"

---

### [4:30 - 4:45] CLOSING (15 seconds)

**[Back to results page or landing page]**

> "This is production-ready for testnet. We have:
> - Complete documentation
> - Full API reference
> - Real-time progress updates
> - And a beautiful, modern UI
> 
> **Media Provably Authentic** - bringing trust and transparency to digital media verification on Sui.
> 
> Thank you!"

**[Fade out or show GitHub repo]**

---

## 🎬 RECORDING TIPS

### Camera/Screen Setup
1. **Screen Recording**: Use QuickTime (Cmd+Shift+5) or OBS
2. **Resolution**: 1920x1080 minimum
3. **Frame Rate**: 30fps or 60fps
4. **Audio**: Use external mic if possible (clearer voice)

### Speaking Tips
1. **Pace**: Speak clearly and not too fast
2. **Enthusiasm**: Show excitement about the features
3. **Pauses**: Brief pauses between sections for editing
4. **Pronunciation**: Practice "Nautilus", "Byzantine", "attestation"

### Visual Tips
1. **Mouse Movement**: Move mouse smoothly, not erratically
2. **Highlighting**: Hover over important elements when mentioning them
3. **Scrolling**: Scroll slowly so viewers can read
4. **Timing**: If processing takes longer, talk about the architecture

### Editing Tips
1. **Cut Dead Air**: Remove long pauses
2. **Speed Up Processing**: If processing takes >60s, speed up 1.5x
3. **Add Captions**: Consider adding text overlays for key points
4. **Background Music**: Soft, non-distracting (optional)

---

## 🎯 ALTERNATIVE: SHORTER 3-MINUTE VERSION

If you need a 3-minute version, cut these sections:
- ❌ Detailed forensic analysis walkthrough (save 30s)
- ❌ Technical highlights section (save 45s)
- ❌ Some reverse search details (save 15s)

Keep focus on:
- ✅ Quick system overview
- ✅ Live upload and processing
- ✅ AI detection results
- ✅ Reverse search matches
- ✅ Blockchain + TEE proof

---

## 🎯 ALTERNATIVE: DETAILED 7-MINUTE VERSION

If you want a longer, more detailed version, add:
- ✅ Upload an AI-generated image (show different results)
- ✅ Compare real vs AI-generated side-by-side
- ✅ Show backend logs in detail
- ✅ Explain each AI model
- ✅ Show Nautilus enclave health check
- ✅ Show Sui Explorer transaction

---

## 📝 SCRIPT VARIATIONS

### For Technical Audience
- Add more details about:
  - Consensus algorithm (weighted voting formula)
  - Encryption (AES-256-GCM with Seal KMS)
  - PCR measurements and what they mean
  - Smart contract architecture

### For Business Audience
- Focus on:
  - Use cases (journalism, legal, insurance)
  - Cost efficiency
  - Scalability
  - Market opportunity

### For Judges
- Emphasize:
  - Real Sui ecosystem integration (not mock)
  - Production-ready code
  - Complete documentation
  - Innovation (7 models + 3 enclaves + TEE)

---

## 🚨 TROUBLESHOOTING

### If Upload Fails
> "Oops, let me try that again. [Retry upload] This can happen if the wallet signature times out."

### If Processing Takes Too Long (>90s)
> "While we wait, let me explain what's happening behind the scenes... [Talk about architecture]"

### If Results Don't Display
> "The processing is complete, let me refresh to show the results. [Hard refresh: Cmd+Shift+R]"

### If Wallet Doesn't Connect
> "Let me reconnect the wallet. [Close and reopen wallet popup] There we go!"

---

## 📊 POST-RECORDING CHECKLIST

- [ ] Video is under 5 minutes
- [ ] Audio is clear (no background noise)
- [ ] All key features shown:
  - [ ] Wallet connection
  - [ ] Upload process
  - [ ] Real-time progress tree
  - [ ] AI detection results
  - [ ] Reverse search matches
  - [ ] Blockchain attestation
  - [ ] TEE attestation proof
- [ ] No sensitive info shown (private keys, etc.)
- [ ] Smooth transitions between sections
- [ ] Good pacing (not too fast/slow)

---

## 🎥 EXPORT SETTINGS

### For YouTube/Vimeo
- Format: MP4 (H.264)
- Resolution: 1920x1080
- Bitrate: 8-10 Mbps
- Audio: AAC, 192 kbps

### For Social Media
- Format: MP4 (H.264)
- Resolution: 1920x1080 (or 1080x1920 for vertical)
- Bitrate: 5-8 Mbps
- Audio: AAC, 128 kbps
- Add captions (required for auto-play)

---

## 📎 ADDITIONAL RESOURCES

- **Test Images**: `test_google_search_samples/`
- **Full Demo Guide**: `HACKATHON_DEMO.md`
- **Architecture Docs**: `README.md`
- **API Reference**: `API_REFERENCE.md`

---

**Good luck with your demo video! 🎬🚀**

**Pro Tip**: Do a practice run first without recording to:
1. Check timing
2. Smooth out your speech
3. Identify any technical issues
4. Get comfortable with the flow

Then record 2-3 takes and pick the best one!

