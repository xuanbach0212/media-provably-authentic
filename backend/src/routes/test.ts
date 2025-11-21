import express from "express";

const router = express.Router();

// Test endpoint to return mock complete report
router.get("/mock-report", (req, res) => {
  const mockReport = {
    jobId: "test_job_123",
    mediaCID: "mock_cid_123",
    mediaHash: "mock_hash_123",
    metadata: {
      filename: "test-image.jpg",
      mimeType: "image/jpeg",
      size: 1024000,
      sha256: "mock_sha256",
      uploadedAt: new Date().toISOString(),
    },
    analysisData: {
      aiDetection: {
        modelScores: {
          ai_generated_score: 0.75,
          deepfake_score: 0.68,
          manipulation_score: 0.72,
          authenticity_score: 0.28,
          frequency_ai_score: 0.70,
          ensemble_model_count: 7,
          individual_models: {
            "umm-maybe/AI-image-detector": {
              ai_score: 0.78,
              deepfake_score: 0.71,
              confidence: 0.92,
              weight: 0.25,
            },
            "Organika/sdxl-detector": {
              ai_score: 0.72,
              deepfake_score: 0.65,
              confidence: 0.88,
              weight: 0.25,
            },
          },
        },
        ensembleScore: 0.75,
        forensicAnalysis: {
          compression_artifacts: 0.45,
          sharpness: 0.78,
          noise_level: 0.32,
          color_saturation: 0.68,
          brightness: 0.55,
          contrast: 0.62,
          exif_data_present: true,
          exif_data: {
            Make: "Canon",
            Model: "EOS 5D Mark IV",
            DateTime: "2024:11:20 10:30:00",
          },
          manipulation_likelihood: 0.42,
        },
        frequencyAnalysis: {
          dct_anomaly_score: 0.36,
          fft_anomaly_score: 0.41,
          frequency_ai_score: 0.70,
        },
        qualityMetrics: {
          sharpness: 0.78,
          brightness: 0.55,
          contrast: 0.62,
          blurriness: 0.22,
          exposure: 0.58,
          colorfulness: 0.71,
          overall_quality: 0.75,
          enhancement_applied: "contrast",
        },
        metadata: {
          models_used: 7,
          forensics_enabled: true,
          device: "cpu",
        },
      },
      reverseSearch: {
        matches: [
          {
            url: "https://example.com/image1.jpg",
            firstSeen: "2024-01-15T10:30:00Z",
            similarity: 0.95,
            metadata: {
              title: "Example Image 1",
              publisher: "Wikipedia",
              timestamp: "2024-01-15T10:30:00Z",
            },
          },
          {
            url: "https://example.com/image2.jpg",
            firstSeen: "2024-02-20T14:20:00Z",
            similarity: 0.88,
            metadata: {
              title: "Example Image 2",
              publisher: "Getty Images",
              timestamp: "2024-02-20T14:20:00Z",
            },
          },
        ],
        provenanceChain: [],
        confidence: 0.92,
      },
      forensicAnalysis: {
        fileSize: 1024000,
        mimeType: "image/jpeg",
        uploadedAt: new Date().toISOString(),
      },
    },
    enclaveAttestation: {
      signature: "mock_signature_123",
      timestamp: new Date().toISOString(),
      enclaveId: "enclave_001",
      mrenclave: "mock_mrenclave",
    },
    generatedAt: new Date().toISOString(),
    blockchainAttestation: {
      attestationId: "att_mock_123",
      txHash: "0xmock_tx_hash_123",
      transactionHash: "0xmock_tx_hash_123",
      reportCID: "mock_report_cid",
      enclaveId: "enclave_001",
      blockNumber: 12345,
      timestamp: new Date().toISOString(),
    },
  };

  res.json(mockReport);
});

export default router;

