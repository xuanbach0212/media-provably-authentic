'use client';

import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ModelScoresBarProps {
  modelScores: Record<string, any>;
}

export default function ModelScoresBar({ modelScores }: ModelScoresBarProps) {
  if (!modelScores?.individual_models) {
    return null;
  }

  // Transform data for bar chart
  const data = Object.entries(modelScores.individual_models).map(([model, scores]: [string, any]) => ({
    name: model.length > 15 ? model.substring(0, 15) + '...' : model,
    fullName: model,
    score: scores.ai_score * 100,
    confidence: scores.confidence * 100,
  }));

  const getBarColor = (score: number) => {
    if (score >= 80) return '#ef4444'; // Red
    if (score >= 50) return '#f59e0b'; // Orange
    return '#10b981'; // Green
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-surface border border-dark-border rounded p-3 shadow-lg">
          <p className="text-dark-text font-semibold text-sm">{payload[0].payload.fullName}</p>
          <p className="text-blue-400 text-sm">AI Score: {payload[0].value.toFixed(1)}%</p>
          <p className="text-gray-400 text-xs">
            Confidence: {payload[0].payload.confidence.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      className="w-full h-80"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.3 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />
          <YAxis
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            label={{ value: 'AI Score (%)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="score" 
            radius={[8, 8, 0, 0]}
            animationBegin={300}
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

