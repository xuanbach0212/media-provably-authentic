'use client';

import { useState, useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface EnsembleGaugeProps {
  score: number; // 0-1
}

export default function EnsembleGauge({ score }: EnsembleGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);
  
  // Animate number counting
  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const end = Math.round(score * 100);
      const duration = 1500; // 1.5 seconds
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setDisplayScore(Math.round(start + (end - start) * easeOut));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      animate();
    }, 200);
    
    return () => clearTimeout(timer);
  }, [score]);
  
  const percentage = Math.round(score * 100);
  
  // Color based on score
  const getColor = (score: number) => {
    if (score >= 0.8) return '#ef4444'; // Red - high AI likelihood
    if (score >= 0.5) return '#f59e0b'; // Orange - medium
    return '#10b981'; // Green - low AI likelihood
  };

  const color = getColor(score);
  
  // Data for pie chart (gauge effect)
  const data = [
    { value: score * 100 },
    { value: (1 - score) * 100 }
  ];

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'High AI Likelihood';
    if (score >= 0.5) return 'Medium Likelihood';
    return 'Low AI Likelihood';
  };

  return (
    <motion.div 
      className="flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <motion.div 
        className="relative w-48 h-48"
        initial={{ rotate: -180, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              dataKey="value"
              animationBegin={0}
              animationDuration={1500}
              animationEasing="ease-out"
            >
              <Cell fill={color} />
              <Cell fill="#2a2a2a" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div 
            className="text-5xl font-bold font-mono" 
            style={{ color }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.5 }}
          >
            {displayScore}%
          </motion.div>
          <motion.div 
            className="text-xs text-dark-muted mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Ensemble Score
          </motion.div>
        </div>
      </motion.div>
      
      <motion.div 
        className="mt-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <motion.div 
          className="text-lg font-bold mb-2" 
          style={{ color }}
          animate={percentage >= 80 ? {
            scale: [1, 1.05, 1],
            transition: { duration: 0.5, delay: 1.5 }
          } : {}}
        >
          {percentage >= 80 ? '🤖 Likely AI-Generated' :
           percentage >= 50 ? '⚠️ Possibly AI-Generated' :
           '✓ Likely Authentic'}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

