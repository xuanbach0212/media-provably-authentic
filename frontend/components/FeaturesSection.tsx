'use client';

import { motion } from 'framer-motion';
import { FaRobot, FaSearchLocation, FaCubes } from 'react-icons/fa';
import Card3D from './Card3D';
import { staggerContainer, cardEntrance } from '@/lib/animations';

const features = [
  {
    icon: <FaRobot className="text-5xl" />,
    title: 'AI Detection',
    description: 'Advanced AI models detect deepfakes and AI-generated content',
    gradient: 'from-[var(--theme-primary)] to-[var(--theme-secondary)]',
  },
  {
    icon: <FaSearchLocation className="text-5xl" />,
    title: 'Provenance Tracking',
    description: 'Trace media origins through reverse image search and metadata analysis',
    gradient: 'from-[var(--theme-secondary)] to-[var(--theme-accent)]',
  },
  {
    icon: <FaCubes className="text-5xl" />,
    title: 'Blockchain Proof',
    description: 'Immutable attestations stored on SUI blockchain with TEE verification',
    gradient: 'from-[var(--theme-accent)] to-[var(--theme-primary)]',
  },
];

export default function FeaturesSection() {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {features.map((feature, index) => (
        <motion.div
          key={feature.title}
          variants={cardEntrance}
          whileHover={{ y: -8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Card3D intensity={0.4}>
            <div
              className="relative p-6 rounded-xl border overflow-hidden group cursor-pointer"
              style={{
                backgroundColor: 'var(--theme-surface)',
                borderColor: 'var(--theme-border)',
              }}
            >
              {/* Animated gradient background */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 0.1 }}
              />

              {/* Glow effect on hover */}
              <motion.div
                className="absolute inset-0 rounded-xl"
                initial={{ opacity: 0 }}
                whileHover={{ 
                  opacity: 1,
                  boxShadow: '0 0 40px rgba(77, 162, 255, 0.3)',
                }}
                transition={{ duration: 0.3 }}
              />

              {/* Content */}
              <div className="relative z-10">
                {/* Icon with animation */}
                <motion.div
                  className={`mb-4 bg-gradient-to-br ${feature.gradient} bg-clip-text text-transparent`}
                  whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  {feature.icon}
                </motion.div>

                {/* Title */}
                <h3 
                  className="text-xl font-bold mb-3"
                  style={{ color: 'var(--theme-text)' }}
                >
                  {feature.title}
                </h3>

                {/* Description */}
                <p 
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  {feature.description}
                </p>

                {/* Animated border bottom */}
                <motion.div
                  className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${feature.gradient}`}
                  initial={{ width: '0%' }}
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
          </Card3D>
        </motion.div>
      ))}
    </motion.div>
  );
}

