'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    number: '01',
    title: 'Upload Media',
    description: 'Upload your image or video for verification through our secure platform',
    icon: '📤',
    color: '#4DA2FF',
  },
  {
    number: '02',
    title: 'AI Analysis',
    description: '7 AI models analyze your media with forensic techniques and frequency domain analysis',
    icon: '🤖',
    color: '#10B981',
  },
  {
    number: '03',
    title: 'Enclave Processing',
    description: 'Secure processing in 3 parallel Nautilus enclaves with TEE protection',
    icon: '🔐',
    color: '#A855F7',
  },
  {
    number: '04',
    title: 'Blockchain Attestation',
    description: 'Results are verified and stored immutably on SUI blockchain',
    icon: '⛓️',
    color: '#06B6D4',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How It <span className="bg-gradient-to-r from-[#4DA2FF] to-[#06B6D4] bg-clip-text text-transparent">Works</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Four simple steps to verify your media authenticity
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="relative"
            >
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 top-32 w-0.5 h-32 bg-gradient-to-b from-gray-700 to-transparent hidden md:block"></div>
              )}

              <div className="flex flex-col md:flex-row items-center gap-8 mb-16">
                {/* Left Content (even) */}
                {index % 2 === 0 && (
                  <div className="flex-1 text-right hidden md:block">
                    <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-gray-400">{step.description}</p>
                  </div>
                )}

                {/* Center Circle */}
                <div className="relative flex-shrink-0">
                  <motion.div
                    className="w-24 h-24 rounded-full flex items-center justify-center backdrop-blur-md border-2 relative z-10"
                    style={{
                      background: `linear-gradient(135deg, ${step.color}40 0%, ${step.color}10 100%)`,
                      borderColor: step.color,
                      boxShadow: `0 0 30px ${step.color}50`,
                    }}
                    whileHover={{ scale: 1.1 }}
                  >
                    <span className="text-4xl">{step.icon}</span>
                  </motion.div>
                  {/* Step Number */}
                  <div
                    className="absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{
                      backgroundColor: step.color,
                      color: '#000',
                    }}
                  >
                    {step.number}
                  </div>
                </div>

                {/* Right Content (odd) / Mobile Content */}
                <div className="flex-1 md:hidden text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-400">{step.description}</p>
                </div>

                {index % 2 === 1 && (
                  <div className="flex-1 text-left hidden md:block">
                    <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-gray-400">{step.description}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

