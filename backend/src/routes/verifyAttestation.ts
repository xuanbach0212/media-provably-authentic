import { Router } from 'express';
import { NautilusService } from '../services/nautilus';

const router = Router();

/**
 * POST /api/verify-attestation
 * Verify a Nautilus attestation document
 * This would be called by Sui smart contract or frontend
 */
router.post('/verify-attestation', async (req, res) => {
  try {
    const { signature, reportData, attestationDocument } = req.body;

    if (!signature || !reportData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const nautilus = new NautilusService();
    
    // Verify the attestation
    const isValid = await nautilus.verifyAttestation(signature, reportData);

    res.json({
      valid: isValid,
      enclaveInfo: nautilus.getEnclaveInfo(),
      verifiedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[VerifyRoute] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

