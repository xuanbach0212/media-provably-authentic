'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    question: 'What is media verification?',
    answer: 'Media verification is the process of analyzing images and videos to determine their authenticity, detect AI-generated content, and trace their origins using advanced AI models, forensic analysis, and blockchain technology.',
  },
  {
    question: 'How accurate is the AI detection?',
    answer: 'Our system uses an ensemble of 7 advanced AI models with forensic analysis, achieving high accuracy rates. The multi-model approach with consensus mechanism ensures reliable results across different types of media manipulation.',
  },
  {
    question: 'What blockchain do you use?',
    answer: 'We use the SUI blockchain for storing immutable attestations. SUI provides fast transactions, low fees, and strong cryptographic verification, making it ideal for media verification use cases.',
  },
  {
    question: 'Is my data private and secure?',
    answer: 'Yes. All processing happens in Nautilus trusted execution environments (TEEs) with hardware-level security. Your media is encrypted during upload, processed securely, and never stored permanently on our servers.',
  },
  {
    question: 'What file formats are supported?',
    answer: 'We support common image formats (JPEG, PNG, WebP, etc.) and video formats (MP4, MOV, etc.). Maximum file size is 100MB. Contact us for enterprise solutions with larger file support.',
  },
  {
    question: 'How long does verification take?',
    answer: 'Most verifications complete within 10-30 seconds depending on file size and complexity. The process includes AI analysis, forensic examination, optional reverse search, and blockchain attestation.',
  },
  {
    question: 'Can I access verification results later?',
    answer: 'Yes. All verification results are stored on the SUI blockchain with a permanent, immutable record. You can retrieve results anytime using the transaction hash or report CID.',
  },
  {
    question: 'Do you offer an API?',
    answer: 'Yes. Pro and Enterprise plans include full API access for integrating media verification into your own applications. Check our API documentation for details.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 relative">
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
            Frequently Asked <span className="bg-gradient-to-r from-[#4DA2FF] to-[#06B6D4] bg-clip-text text-transparent">Questions</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to know about media verification
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-white pr-8">{faq.question}</h3>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    <svg
                      className="w-6 h-6 text-[#4DA2FF]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </motion.div>
                </div>
                
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="mt-4 text-gray-400 leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-gray-400 mb-4">Still have questions?</p>
          <a
            href="mailto:support@verifymedia.com"
            className="inline-block px-8 py-3 bg-white/5 backdrop-blur-sm text-white rounded-lg border border-white/10 hover:bg-white/10 transition-all font-semibold"
          >
            Contact Support
          </a>
        </motion.div>
      </div>
    </section>
  );
}

