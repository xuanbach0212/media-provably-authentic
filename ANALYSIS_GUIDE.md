# Analysis Metrics Guide

This guide explains the technical metrics provided by the Media Authenticity Analysis System.

## Overview

Our system **analyzes media files and provides raw technical metrics** instead of making definitive judgments about authenticity. This approach empowers users to interpret the data based on their specific context and needs.

## Key Metrics

### 1. AI Detection Ensemble Score

**Range:** 0.0 - 1.0 (displayed as 0% - 100%)

**Interpretation:**
- **0.0 - 0.5** (0% - 50%): Lower likelihood of AI generation. The image exhibits characteristics more consistent with real/authentic media.
- **0.5 - 0.8** (50% - 80%): Medium likelihood. The image has some indicators of AI generation but is not conclusive.
- **0.8 - 1.0** (80% - 100%): Higher likelihood of AI generation. The image exhibits strong patterns consistent with AI-generated content.

**What it measures:** The ensemble score is a weighted average from multiple AI detection models, incorporating:
- Pattern recognition across 7+ specialized models
- Frequency domain analysis (DCT/FFT)
- Image quality assessment
- Cross-model consistency checking

**Important Notes:**
- This is a **probability score**, not a definitive verdict
- Context matters: professional CGI, heavily edited photos, or low-quality images may produce false positives
- No detection system is 100% accurate

---

### 2. Individual Model Scores

Each AI detection model provides its own analysis:

- **AI Score**: Likelihood that the image is AI-generated (0-1 scale)
- **Deepfake Score**: Likelihood of deepfake manipulation (0-1 scale)
- **Confidence**: How confident the model is in its prediction (0-1 scale)
- **Weight**: The model's weight in the ensemble calculation

**Models Used:**
1. `umm-maybe/AI-image-detector` - General AI image detection
2. `Organika/sdxl-detector` - Stable Diffusion XL detection
3. `saltacc/anime-ai-detect` - Anime/illustration AI detection
4. `dima806/deepfake_vs_real_image_detection` - Deepfake detection
5. `Nahrawy/AIorNot` - Binary AI/Not classification
6. `nateraw/real-or-fake` - Real vs Fake classification
7. `RandomZZ/FaceDeepFake` - Face-focused deepfake detection

---

### 3. Aggregate Scores

**AI Generated Score**: Overall likelihood of AI generation from all models

**Deepfake Score**: Overall likelihood of deepfake manipulation

**Manipulation Score**: Likelihood of any form of manipulation

**Authenticity Score**: Inverse of manipulation likelihood (1 - manipulation_score)

---

### 4. Forensic Analysis

Technical analysis of image characteristics:

#### Compression Artifacts
**Range:** 0.0 - 1.0+

Measures inconsistencies in JPEG compression patterns. AI-generated images may show unusual compression patterns.

- **< 0.1**: Minimal artifacts (consistent compression)
- **0.1 - 0.3**: Moderate artifacts
- **> 0.3**: Significant artifacts (may indicate manipulation or generation)

#### Image Quality Metrics

**Sharpness** (0-100+): Measures edge definition
- Higher values = sharper image
- AI-generated images often have unnaturally high or low sharpness

**Contrast** (0-100+): Measures tonal range
- AI-generated images may have unusual contrast patterns

**Brightness** (0-255): Average luminosity
- Used for quality assessment

#### EXIF Data
Metadata embedded in the image file:
- Camera model
- Software used
- Creation date
- GPS coordinates (if available)
- Editing software markers

**Red Flags:**
- Missing EXIF data (common in AI-generated images)
- Inconsistent timestamps
- Software signatures from AI tools (e.g., "Midjourney", "Stable Diffusion")

---

### 5. Frequency Analysis

#### DCT (Discrete Cosine Transform) Analysis
Analyzes compression patterns in the frequency domain. AI-generated images often have:
- Smoother frequency distributions
- Less high-frequency noise compared to natural images

#### FFT (Fast Fourier Transform) Analysis
Detects periodic patterns and anomalies invisible to the naked eye:
- AI generation may create subtle grid patterns
- Upscaling artifacts
- Generated texture patterns

**Frequency AI Score** (0-1): Combined frequency domain likelihood of AI generation

---

### 6. Reverse Search Results

If the ensemble score triggers reverse search (< 0.5 or > 0.8), the system searches for similar images online.

**When Matches Are Found:**
- **Similarity Score** (0-1): How closely the match resembles your image
- **First Seen Date**: Earliest known publication date
- **Source URLs**: Where the image or similar images appear online

**Interpretation:**
- **Multiple high-similarity matches**: Image may have been published before
- **Earliest publication date**: Helps establish provenance
- **No matches**: Does NOT prove the image is new/fake (may simply not be indexed)

**Conditional Triggering:**
The system runs reverse search only when:
- Ensemble score < 0.5 (likely real → check if it exists online)
- Ensemble score > 0.8 (likely AI → check if it's a stolen/modified real image)

This saves resources and focuses on cases where reverse search adds value.

---

## How to Interpret Results

### Example 1: High AI Likelihood

```
Ensemble Score: 0.92 (92%)
Individual Models: Most agree (85-95% AI scores)
Forensic Analysis: Low compression artifacts, missing EXIF
Reverse Search: No matches found
```

**Interpretation:** Strong indicators of AI generation. Multiple models agree, forensic analysis shows typical AI characteristics, and no prior publication found.

### Example 2: Low AI Likelihood

```
Ensemble Score: 0.15 (15%)
Individual Models: Most disagree (5-25% AI scores)
Forensic Analysis: Normal compression, complete EXIF from Canon camera
Reverse Search: 5 matches found, earliest from 2021
```

**Interpretation:** Strong indicators of authentic media. Low AI scores, authentic camera metadata, and online publication history.

### Example 3: Ambiguous Case

```
Ensemble Score: 0.62 (62%)
Individual Models: Mixed results (40-75% AI scores)
Forensic Analysis: Moderate artifacts, partial EXIF
Reverse Search: Not triggered (score in middle range)
```

**Interpretation:** Uncertain. Could be:
- Heavily edited real photo
- Hybrid (real photo + AI enhancement)
- Low-quality AI generation
- Professional CGI

**Recommendation:** Manual review or additional verification needed.

---

## Best Practices

### 1. Consider Context
- **Source**: Where did the image come from? Social media? News outlet? Official source?
- **Purpose**: Why was it created? Documentary? Art? Advertisement?
- **Subject**: Is it plausible? Does it match known facts?

### 2. Look for Supporting Evidence
- Reverse image search results (manual Google/TinEye)
- Metadata examination
- Comparison with other images from same source
- Expert domain knowledge

### 3. Understand Limitations
- **False Positives**: Professional CGI, artistic edits, low-resolution images
- **False Negatives**: Sophisticated AI tools, hybrid manipulations
- **Evolving Technology**: AI generation improves constantly

### 4. Use Multiple Signals
Never rely on a single metric. Consider:
- Ensemble score AND individual model agreement
- Forensic analysis AND metadata
- Reverse search results AND temporal context

---

## Blockchain Attestation

Every analysis is cryptographically signed and stored on-chain (Sui blockchain):
- **Transaction Hash**: Immutable proof of analysis
- **Timestamp**: When the analysis was performed
- **Enclave Signature**: Cryptographic proof from trusted execution environment
- **Report CID**: Content-addressed storage (Walrus) for full analysis data

This ensures:
- **Provenance**: You can prove when and how the analysis was conducted
- **Integrity**: The results cannot be tampered with
- **Transparency**: Anyone can verify the analysis on-chain

---

## Technical Details

### Model Ensemble Strategy
- **Smart Ensemble**: Models are weighted based on historical accuracy
- **Confidence Gating**: Low-confidence predictions are downweighted
- **Cross-Model Consistency**: Checks for agreement among models
- **Forensic Integration**: Combines ML predictions with forensic evidence

### Quality Enhancement
Images are preprocessed before analysis:
- Upscaling for low-resolution images
- Noise reduction
- Adaptive enhancement based on quality assessment

This improves detection accuracy for poor-quality inputs.

---

## Frequently Asked Questions

**Q: Can this system definitively prove an image is AI-generated?**
A: No system can provide 100% certainty. Our system provides probability scores and technical metrics to inform your judgment.

**Q: Why do some professional photos get high AI scores?**
A: Professional post-processing (heavy retouching, filters, HDR) can resemble AI generation patterns. Context and metadata help differentiate.

**Q: What if there are no reverse search results?**
A: Absence of matches doesn't prove anything. The image may be:
- New and not yet indexed
- From a private/restricted source
- Modified enough to escape detection
- Actually AI-generated

**Q: How accurate is the ensemble score?**
A: Based on our 1000-image test dataset:
- Overall accuracy: ~70%
- Real image detection: 42% (high false positive rate)
- AI image detection: 97% (very reliable for detecting fakes)

This means the system is **better at identifying AI-generated content than confirming authenticity**.

**Q: Can AI detection be fooled?**
A: Yes. Sophisticated techniques can evade detection:
- Adding noise or compression
- Hybrid approaches (AI + real elements)
- Adversarial perturbations
- Using very recent/advanced models

---

## Updates and Improvements

This system is continuously updated with:
- New detection models
- Improved forensic techniques
- Enhanced reverse search capabilities
- Updated training data

Check the documentation for the latest features and accuracy metrics.

---

## Support

For technical questions or to report issues:
- GitHub: [repository link]
- Email: [contact email]
- Documentation: [docs link]

