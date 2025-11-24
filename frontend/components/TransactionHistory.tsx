'use client';

import { motion } from 'framer-motion';
import { FaExternalLinkAlt, FaCheck, FaClock, FaLock, FaDatabase, FaShieldAlt } from 'react-icons/fa';
import { useState } from 'react';
import { getSuiTxUrlAuto, getWalrusBlobUrlAuto } from '@/lib/explorers';

interface Transaction {
  step: number;
  name: string;
  description: string;
  txHash?: string;
  cid?: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  type: 'encryption' | 'storage' | 'processing' | 'blockchain';
  details?: Record<string, any>;
}

interface TransactionHistoryProps {
  report: any;
}

export default function TransactionHistory({ report }: TransactionHistoryProps) {
  const [expandedTx, setExpandedTx] = useState<number | null>(null);

  // Build transaction history from report
  const transactions: Transaction[] = [];

  // Step 1: Encryption
  if (report.encryptionMeta) {
    transactions.push({
      step: 1,
      name: 'Media Encryption',
      description: 'Encrypted media with AES-256-GCM',
      timestamp: new Date(report.timestamp || Date.now()).toISOString(),
      status: 'completed',
      type: 'encryption',
      details: {
        algorithm: 'AES-256-GCM',
        keyId: report.encryptionMeta.keyId || 'N/A',
        iv: report.encryptionMeta.iv ? `${report.encryptionMeta.iv.substring(0, 16)}...` : 'N/A',
      }
    });
  }

  // Step 2: Storage to Walrus
  if (report.mediaCID) {
    transactions.push({
      step: 2,
      name: 'Walrus Storage',
      description: 'Stored encrypted media to Walrus',
      cid: report.mediaCID,
      timestamp: new Date(report.timestamp || Date.now()).toISOString(),
      status: 'completed',
      type: 'storage',
      details: {
        mediaCID: report.mediaCID,
        network: 'Walrus Testnet',
      }
    });
  }

  // Step 3: Report Storage to Walrus
  if (report.reportCID) {
    transactions.push({
      step: 3,
      name: 'Report Storage',
      description: 'Stored analysis report to Walrus',
      cid: report.reportCID,
      timestamp: new Date(report.timestamp || Date.now()).toISOString(),
      status: 'completed',
      type: 'storage',
      details: {
        reportCID: report.reportCID,
        network: 'Walrus Testnet',
      }
    });
  }

  // Step 4: TEE Attestation
  if (report.enclaveAttestation) {
    transactions.push({
      step: 4,
      name: 'TEE Attestation',
      description: 'Signed by AWS Nitro Enclave',
      timestamp: report.enclaveAttestation.timestamp,
      status: 'completed',
      type: 'processing',
      details: {
        enclaveId: report.enclaveAttestation.enclaveId,
        signature: report.enclaveAttestation.signature ? `${report.enclaveAttestation.signature.substring(0, 32)}...` : 'N/A',
        mrenclave: report.enclaveAttestation.mrenclave || 'N/A',
        pcr0: report.enclaveAttestation.pcrs?.PCR0 ? `${report.enclaveAttestation.pcrs.PCR0.substring(0, 32)}...` : 'N/A',
      }
    });
  }

  // Step 5: Blockchain Attestation
  if (report.blockchainAttestation) {
    transactions.push({
      step: 5,
      name: 'Blockchain Attestation',
      description: 'Submitted to Sui blockchain',
      txHash: report.blockchainAttestation.txHash,
      timestamp: report.blockchainAttestation.timestamp,
      status: 'completed',
      type: 'blockchain',
      details: {
        txHash: report.blockchainAttestation.txHash,
        blockNumber: report.blockchainAttestation.blockNumber,
        network: 'Sui Testnet',
        reportCID: report.blockchainAttestation.reportCID,
        enclaveId: report.blockchainAttestation.enclaveId,
      }
    });
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'encryption': return <FaLock className="w-5 h-5" />;
      case 'storage': return <FaDatabase className="w-5 h-5" />;
      case 'processing': return <FaShieldAlt className="w-5 h-5" />;
      case 'blockchain': return <FaCheck className="w-5 h-5" />;
      default: return <FaClock className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'encryption': return 'bg-purple-500/20 border-purple-500/50';
      case 'storage': return 'bg-blue-500/20 border-blue-500/50';
      case 'processing': return 'bg-orange-500/20 border-orange-500/50';
      case 'blockchain': return 'bg-green-500/20 border-green-500/50';
      default: return 'bg-gray-500/20 border-gray-500/50';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };


  return (
    <motion.div
      className="bg-dark-surface border border-dark-border rounded-lg p-6 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-dark-text flex items-center gap-2">
          <FaClock className="text-[#4DA2FF]" />
          Transaction History
        </h3>
        <span className="text-sm text-dark-muted">
          {transactions.length} transactions
        </span>
      </div>

      <div className="space-y-3">
        {transactions.map((tx, index) => (
          <motion.div
            key={tx.step}
            className={`border rounded-lg overflow-hidden transition-all ${getTypeColor(tx.type)}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Transaction Header */}
            <div
              className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setExpandedTx(expandedTx === tx.step ? null : tx.step)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(tx.type)}`}>
                    {getIcon(tx.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-dark-text">
                        Step {tx.step}: {tx.name}
                      </span>
                      <span className={`text-xs ${getStatusColor(tx.status)}`}>
                        ● {tx.status}
                      </span>
                    </div>
                    <p className="text-sm text-dark-muted">{tx.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-dark-muted">
                    {formatTimestamp(tx.timestamp)}
                  </span>
                  {(() => {
                    const url = tx.txHash 
                      ? getSuiTxUrlAuto(tx.txHash) 
                      : tx.cid 
                        ? getWalrusBlobUrlAuto(tx.cid) 
                        : null;
                    
                    return url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#4DA2FF] hover:text-[#6DB3FF] transition-colors"
                        onClick={(e) => e.stopPropagation()}
                        title={tx.txHash ? 'View on Sui Explorer' : 'View on Walrus'}
                      >
                        <FaExternalLinkAlt className="w-4 h-4" />
                      </a>
                    ) : tx.txHash || tx.cid ? (
                      <span className="text-xs text-yellow-400" title="Invalid transaction hash or blob ID (mock data)">
                        Mock Data
                      </span>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>

            {/* Transaction Details (Expandable) */}
            {expandedTx === tx.step && tx.details && (
              <motion.div
                className="px-4 pb-4 border-t border-white/10"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <div className="mt-3 space-y-2">
                  {Object.entries(tx.details).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2 text-sm">
                      <span className="text-dark-muted capitalize min-w-[120px]">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className="font-mono text-dark-text break-all flex-1">
                        {typeof value === 'string' ? value : JSON.stringify(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-dark-border grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">
            {transactions.filter(t => t.type === 'encryption').length}
          </div>
          <div className="text-xs text-dark-muted">Encryption</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">
            {transactions.filter(t => t.type === 'storage').length}
          </div>
          <div className="text-xs text-dark-muted">Storage</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-400">
            {transactions.filter(t => t.type === 'processing').length}
          </div>
          <div className="text-xs text-dark-muted">Processing</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">
            {transactions.filter(t => t.type === 'blockchain').length}
          </div>
          <div className="text-xs text-dark-muted">Blockchain</div>
        </div>
      </div>
    </motion.div>
  );
}

