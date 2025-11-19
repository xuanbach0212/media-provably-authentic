# Provably Authentic - Flow Summary (Markdown)

## 1. User Submission

* User selects media file to verify.

* Client computes SHA-256 hash and perceptual hash (pHash).

* Media is encrypted locally with a randomly generated Content Encryption Key (CEK).

* CEK is wrapped with Seal policy for authorized enclave decryption.

* Encrypted media and metadata are uploaded to Walrus.

* Job is submitted to Gateway/API with signed request from user's wallet.

## 2. Job Queue & Orchestration

* Gateway places verification job into Job Queue.

* Job includes mediaCID, SHA-256, pHash, policy ID, user signature, and metadata.

## 3. Enclave Processing (Nautilus TEE)

* Enclaves fetch jobs from the queue.

* Request CEK from Seal KMS (attested decryption key).

* Retrieve encrypted media from Walrus and decrypt inside TEE.

* Run reverse-search APIs to identify provenance (first seen URLs, matches).

* Run AI detection models for integrity / AI-generated detection.

* Generate `report.json` containing verdict, confidence, provenance, forensic analysis, and enclave
attestation.

* Sign the report inside enclave.

* Upload report.json back to Walrus.

* Submit minimal attestation (hash, reportCID, verdict, enclave signature) to Sui blockchain.

## 4. Aggregation & Consensus

* If multiple enclaves process the same job, reports are sent to Aggregator.

* Aggregator computes weighted consensus based on oracle reputation and stake.

* Final consensus attestation is submitted to Sui blockchain.

## 5. Challenge / Dispute Flow

* Users or challengers can submit evidenceCID to dispute an attestation.

* Aggregator triggers re-verification by oracles / enclaves.

* Verdict is updated on-chain.

* Misbehaving oracles can be slashed and reputation adjusted.

## 6. Dashboard & UI

* Fetch report.json and attestation events from Sui blockchain and Walrus.

* Display verdict, provenance timeline, and forensic details.

* Option to export legal evidence bundle (PDF) with chain proof, signed report, and enclave
attestation.

## 7. Data Lifecycle & Security

* Encrypted media and report.json stored in Walrus with redundancy.

* CEK access controlled by Seal policies.

* On-chain attestations store minimal proof for immutability and legal defensibility.

* Retention policies and archival procedures ensure legal compliance.

* Multi-enclave quorum reduces risk of compromised oracle reports.

## 8. Summary

* End-to-end flow ensures **provable authenticity** of media.

* Combines decentralized storage, secure compute enclaves, cryptographic attestations, AI detection,
and reverse-search for provenance.

* Supports challenge/dispute mechanism and legal-grade evidence export.

* Fully production-ready architecture, designed for scalability, privacy, and censorship resistance.