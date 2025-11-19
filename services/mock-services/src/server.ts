import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { MockWalrus } from './services/walrus';
import { MockSeal } from './services/seal';
import { MockNautilus } from './services/nautilus';
import { MockSui } from './services/sui';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));

// Initialize services
const walrus = new MockWalrus();
const seal = new MockSeal();
const nautilus = new MockNautilus('mock_enclave_1');
const sui = new MockSui();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'mock-services' });
});

// === Walrus Routes ===
app.post('/walrus/store', async (req, res) => {
  try {
    const { data, metadata } = req.body;
    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }
    
    const buffer = Buffer.from(data, 'base64');
    const blob = await walrus.storeBlob(buffer, metadata);
    
    res.json({ 
      success: true, 
      blobId: blob.blobId,
      uploadedAt: blob.uploadedAt
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/walrus/retrieve/:blobId', async (req, res) => {
  try {
    const { blobId } = req.params;
    const blob = await walrus.retrieveBlob(blobId);
    
    if (!blob) {
      return res.status(404).json({ error: 'Blob not found' });
    }
    
    res.json({ success: true, blob });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/walrus/delete/:blobId', async (req, res) => {
  try {
    const { blobId } = req.params;
    const deleted = await walrus.deleteBlob(blobId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Blob not found' });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// === Seal Routes ===
app.post('/seal/create-policy', (req, res) => {
  try {
    const { allowedEnclaves } = req.body;
    if (!allowedEnclaves || !Array.isArray(allowedEnclaves)) {
      return res.status(400).json({ error: 'allowedEnclaves array is required' });
    }
    
    const policy = seal.createPolicy(allowedEnclaves);
    res.json({ success: true, policy });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/seal/encrypt', async (req, res) => {
  try {
    const { data, policyId } = req.body;
    if (!data || !policyId) {
      return res.status(400).json({ error: 'data and policyId are required' });
    }
    
    const buffer = Buffer.from(data, 'base64');
    const result = await seal.encryptData(buffer, policyId);
    
    res.json({
      success: true,
      encrypted: result.encrypted.toString('base64'),
      metadata: result.metadata
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/seal/decrypt', async (req, res) => {
  try {
    const { encrypted, metadata, enclaveId } = req.body;
    if (!encrypted || !metadata || !enclaveId) {
      return res.status(400).json({ error: 'encrypted, metadata, and enclaveId are required' });
    }
    
    const buffer = Buffer.from(encrypted, 'base64');
    const decrypted = await seal.decryptData(buffer, metadata, enclaveId);
    
    res.json({
      success: true,
      decrypted: decrypted.toString('base64')
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/seal/policy/:policyId', (req, res) => {
  try {
    const { policyId } = req.params;
    const policy = seal.getPolicy(policyId);
    
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    
    res.json({ success: true, policy });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// === Nautilus Routes ===
app.get('/nautilus/enclave-id', (req, res) => {
  res.json({ 
    success: true, 
    enclaveId: nautilus.getEnclaveId() 
  });
});

app.post('/nautilus/sign', (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ error: 'data is required' });
    }
    
    const signature = nautilus.signData(data);
    res.json({ success: true, signature });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/nautilus/attest', (req, res) => {
  try {
    const { dataHash } = req.body;
    if (!dataHash) {
      return res.status(400).json({ error: 'dataHash is required' });
    }
    
    const attestation = nautilus.generateAttestation(dataHash);
    res.json({ success: true, attestation });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// === Sui Routes ===
app.post('/sui/attest', async (req, res) => {
  try {
    const { jobId, mediaHash, reportCID, verdict, enclaveSignature } = req.body;
    if (!jobId || !mediaHash || !reportCID || !verdict || !enclaveSignature) {
      return res.status(400).json({ 
        error: 'jobId, mediaHash, reportCID, verdict, and enclaveSignature are required' 
      });
    }
    
    const attestation = await sui.submitAttestation(
      jobId,
      mediaHash,
      reportCID,
      verdict,
      enclaveSignature
    );
    
    res.json({ success: true, attestation });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/sui/attestation/:attestationId', async (req, res) => {
  try {
    const { attestationId } = req.params;
    const attestation = await sui.getAttestation(attestationId);
    
    if (!attestation) {
      return res.status(404).json({ error: 'Attestation not found' });
    }
    
    res.json({ success: true, attestation });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/sui/attestations/media/:mediaHash', async (req, res) => {
  try {
    const { mediaHash } = req.params;
    const attestations = await sui.getAttestationsByMediaHash(mediaHash);
    res.json({ success: true, attestations });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/sui/attestations/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const attestations = await sui.getAttestationsByJobId(jobId);
    res.json({ success: true, attestations });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/sui/block', (req, res) => {
  res.json({ 
    success: true, 
    blockNumber: sui.getCurrentBlock() 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock Services running on port ${PORT}`);
  console.log(`   - Walrus: /walrus/*`);
  console.log(`   - Seal: /seal/*`);
  console.log(`   - Nautilus: /nautilus/*`);
  console.log(`   - Sui: /sui/*`);
});

export { walrus, seal, nautilus, sui };

