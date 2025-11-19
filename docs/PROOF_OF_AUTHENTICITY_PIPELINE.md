```mermaid
flowchart TD
  %% === User to Gateway ===
  U[User Client] -->|Upload encrypted media + metadata| GW[Gateway/API]

  %% === Gateway to Storage & Queue ===
  GW --> W[Walrus Storage (encrypted)]
  GW --> Q[Job Queue]

  %% === Seal KMS for key retrieval ===
  Q -->|Job fetch| E1[Nautilus Enclave Node 1]
  Q --> E2[Nautilus Enclave Node 2]
  Q --> E3[Nautilus Enclave Node 3]

  E1 --> S[Seal KMS] --> E1
  E2 --> S --> E2
  E3 --> S --> E3

  %% === Enclaves process media ===
  E1 --> RS1[Reverse Search APIs / External Sources]
  E1 --> M1[AI Detection Models]
  E1 --> R1[Generate signed report.json]
  R1 --> W
  R1 --> Sui1[Sui Blockchain Attestation]

  E2 --> RS2[Reverse Search APIs / External Sources]
  E2 --> M2[AI Detection Models]
  E2 --> R2[Generate signed report.json]
  R2 --> W
  R2 --> Sui2[Sui Blockchain Attestation]

  E3 --> RS3[Reverse Search APIs / External Sources]
  E3 --> M3[AI Detection Models]
  E3 --> R3[Generate signed report.json]
  R3 --> W
  R3 --> Sui3[Sui Blockchain Attestation]

  %% === Aggregator for consensus ===
  R1 --> Ag[Aggregator / Verifier]
  R2 --> Ag
  R3 --> Ag
  Ag -->|Final consensus attestation| SuiFinal[Sui Blockchain Final Attestation]

  %% === Dashboard / UI ===
  SuiFinal --> UI[Frontend / Dashboard]
  W --> UI
```