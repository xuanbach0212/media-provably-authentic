'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for trying out our platform',
    features: [
      '10 verifications/month',
      'AI detection',
      'Basic forensic analysis',
      'Community support',
      'Web interface',
    ],
    cta: 'Get Started',
    highlighted: false,
    color: '#4DA2FF',
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/month',
    description: 'For professionals and teams',
    features: [
      'Unlimited verifications',
      'Advanced AI models',
      'Full forensic analysis',
      'Reverse search',
      'API access',
      'Priority support',
      'Blockchain attestations',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
    color: '#06B6D4',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations',
    features: [
      'Everything in Pro',
      'White-label solution',
      'Custom AI models',
      'Dedicated support',
      'SLA guarantee',
      'On-premise deployment',
      'Custom integrations',
    ],
    cta: 'Contact Sales',
    highlighted: false,
    color: '#14B8A6',
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 relative">
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
            Simple <span className="bg-gradient-to-r from-[#4DA2FF] to-[#06B6D4] bg-clip-text text-transparent">Pricing</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Choose the plan that fits your needs
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className={`relative ${tier.highlighted ? 'md:-mt-4' : ''}`}
            >
              {/* Popular Badge */}
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#4DA2FF] to-[#06B6D4] rounded-full text-white text-sm font-semibold">
                  Most Popular
                </div>
              )}

              <div
                className={`h-full p-8 rounded-2xl backdrop-blur-md border-2 transition-all hover:scale-105 ${
                  tier.highlighted
                    ? 'border-[#06B6D4] shadow-2xl shadow-[#06B6D4]/20'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
                style={{
                  background: tier.highlighted
                    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(20, 184, 166, 0.05) 100%)'
                    : 'rgba(17, 24, 39, 0.6)',
                }}
              >
                {/* Tier Name */}
                <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                
                {/* Price */}
                <div className="mb-4">
                  <span className="text-5xl font-bold text-white">{tier.price}</span>
                  {tier.period && <span className="text-gray-400 text-lg">{tier.period}</span>}
                </div>

                {/* Description */}
                <p className="text-gray-400 mb-6">{tier.description}</p>

                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        style={{ color: tier.color }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link
                  href="/app"
                  className={`block w-full py-3 rounded-lg font-semibold text-center transition-all ${
                    tier.highlighted
                      ? 'bg-gradient-to-r from-[#4DA2FF] to-[#06B6D4] text-white hover:shadow-lg hover:shadow-[#4DA2FF]/50'
                      : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

