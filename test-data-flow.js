/**
 * Test script to check data flow from backend to frontend
 */

const io = require('socket.io-client');

console.log('🔍 TESTING DATA FLOW...\n');

// Connect to backend socket
const socket = io('http://localhost:3001', {
  transports: ['websocket'],
  auth: {
    walletAddress: 'test-wallet',
    signature: 'test-signature'
  }
});

socket.on('connect', () => {
  console.log('✅ Connected to backend socket\n');
  
  // Subscribe to a test job
  const testJobId = 'test_' + Date.now();
  socket.emit('subscribe', testJobId);
  console.log(`📡 Subscribed to job: ${testJobId}\n`);
  
  // Listen for completion
  socket.on('complete', (report) => {
    console.log('📦 RECEIVED COMPLETE EVENT:\n');
    console.log('Report keys:', Object.keys(report));
    console.log('\n📊 Analysis Data:');
    if (report.analysisData) {
      console.log('  - analysisData keys:', Object.keys(report.analysisData));
      console.log('  - Has reverseSearch?', !!report.analysisData.reverseSearch);
      if (report.analysisData.reverseSearch) {
        console.log('  - reverseSearch keys:', Object.keys(report.analysisData.reverseSearch));
        console.log('  - matches count:', report.analysisData.reverseSearch.matches?.length || 0);
        console.log('  - confidence:', report.analysisData.reverseSearch.confidence);
      }
    } else {
      console.log('  ❌ NO analysisData in report!');
    }
    
    console.log('\n⛓️ Blockchain Attestation:');
    if (report.blockchainAttestation) {
      console.log('  - enclaveId:', report.blockchainAttestation.enclaveId);
      console.log('  - txHash:', report.blockchainAttestation.txHash?.substring(0, 20) + '...');
    } else {
      console.log('  ❌ NO blockchainAttestation in report!');
    }
    
    console.log('\n✅ Test complete!');
    process.exit(0);
  });
  
  console.log('⏳ Waiting for a job to complete...');
  console.log('   Please upload an image in the frontend now.\n');
});

socket.on('connect_error', (err) => {
  console.error('❌ Connection error:', err.message);
  process.exit(1);
});

// Timeout after 60 seconds
setTimeout(() => {
  console.log('\n⏱️  Timeout - no job completed in 60 seconds');
  process.exit(1);
}, 60000);

