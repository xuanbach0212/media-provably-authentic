'use client';

import { motion } from 'framer-motion';
import Card3D from '@/components/Card3D';

const features = [
  {
    icon: '🤖',
    title: 'AI Detection',
    description: '7 advanced AI models with forensic analysis to detect deepfakes and AI-generated content with high accuracy',
    color: '#10B981',
    details: ['Multi-model ensemble', 'Forensic analysis', 'Frequency domain detection'],
  },
  {
    icon: '🔍',
    title: 'Provenance Tracking',
    description: 'Trace media origins through reverse image search, metadata analysis, and historical data',
    color: '#F59E0B',
    details: ['Reverse image search', 'EXIF metadata', 'Source verification'],
  },
  {
    icon: '⛓️',
    title: 'Blockchain Proof',
    description: 'Immutable attestations stored on SUI blockchain with cryptographic verification',
    color: '#06B6D4',
    details: ['On-chain attestations', 'Cryptographic proof', 'Tamper-proof records'],
  },
  {
    icon: '🔐',
    title: 'TEE Security',
    description: 'Secure processing in Nautilus trusted execution environments for maximum privacy',
    color: '#A855F7',
    details: ['Isolated processing', 'Hardware-level security', 'Encrypted data'],
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Powerful <span className="bg-gradient-to-r from-[#4DA2FF] to-[#06B6D4] bg-clip-text text-transparent">Features</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Enterprise-grade media verification powered by cutting-edge technology
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <Card3D intensity={0.5}>
                <div
                  className="h-full p-8 rounded-2xl backdrop-blur-md border transition-all hover:shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${feature.color}10 0%, transparent 100%)`,
                    borderColor: `${feature.color}30`,
                  }}
                >
                  {/* Icon */}
                  <motion.div
                    className="text-6xl mb-4"
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    {feature.icon}
                  </motion.div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Details List */}
                  <ul className="space-y-2">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: feature.color }}
                        ></div>
                        {detail}
                      </li>
                    ))}
                  </ul>

                  {/* Glow Effect */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-xl"
                    style={{ backgroundColor: `${feature.color}40` }}
                  ></div>
                </div>
              </Card3D>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

