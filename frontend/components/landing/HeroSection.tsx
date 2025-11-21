'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import ParticlesBackground from '@/components/ParticlesBackground';
import ShootingStars from '@/components/ShootingStars';

export default function HeroSection() {
  const scrollToLearnMore = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <ParticlesBackground />
      <ShootingStars />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-gray-900"></div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-6 mb-8 text-sm text-gray-400"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#4DA2FF] animate-pulse"></div>
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse"></div>
              <span>Blockchain Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse"></div>
              <span>TEE Secured</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="bg-gradient-to-r from-[#4DA2FF] via-[#06B6D4] to-[#14B8A6] bg-clip-text text-transparent">
              Verify Media Authenticity
            </span>
            <br />
            <span className="text-white">with AI & Blockchain</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto"
          >
            Detect deepfakes, trace origins, and prove authenticity using advanced AI models and SUI blockchain
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/app"
              className="px-8 py-4 bg-gradient-to-r from-[#4DA2FF] to-[#06B6D4] text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-[#4DA2FF]/50 transition-all hover:scale-105"
            >
              Start Verification →
            </Link>
            <button
              onClick={scrollToLearnMore}
              className="px-8 py-4 bg-white/5 backdrop-blur-sm text-white rounded-xl font-semibold text-lg border border-white/10 hover:bg-white/10 transition-all hover:scale-105"
            >
              Learn More
            </button>
          </motion.div>

          {/* Floating Elements */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Floating Card 1 */}
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotate: [0, 5, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute top-1/4 left-10 w-32 h-32 bg-gradient-to-br from-[#4DA2FF]/20 to-[#06B6D4]/20 backdrop-blur-md rounded-2xl border border-[#4DA2FF]/30 hidden lg:block"
            >
              <div className="w-full h-full flex items-center justify-center text-6xl">
                🤖
              </div>
            </motion.div>

            {/* Floating Card 2 */}
            <motion.div
              animate={{
                y: [0, 20, 0],
                rotate: [0, -5, 0],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
              className="absolute top-1/3 right-10 w-28 h-28 bg-gradient-to-br from-[#06B6D4]/20 to-[#14B8A6]/20 backdrop-blur-md rounded-2xl border border-[#06B6D4]/30 hidden lg:block"
            >
              <div className="w-full h-full flex items-center justify-center text-5xl">
                ⛓️
              </div>
            </motion.div>

            {/* Floating Card 3 */}
            <motion.div
              animate={{
                y: [0, -15, 0],
                rotate: [0, 3, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 2,
              }}
              className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-gradient-to-br from-[#14B8A6]/20 to-[#4DA2FF]/20 backdrop-blur-md rounded-2xl border border-[#14B8A6]/30 hidden lg:block"
            >
              <div className="w-full h-full flex items-center justify-center text-4xl">
                🔐
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-gray-600 rounded-full flex items-start justify-center p-2"
        >
          <div className="w-1 h-2 bg-[#4DA2FF] rounded-full"></div>
        </motion.div>
      </motion.div>
    </section>
  );
}

