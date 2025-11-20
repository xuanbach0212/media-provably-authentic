'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface EnsembleGaugeProps {
  score: number; // 0-1
}

export default function EnsembleGauge({ score }: EnsembleGaugeProps) {
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
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48">
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
            >
              <Cell fill={color} />
              <Cell fill="#2a2a2a" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-bold font-mono" style={{ color }}>
            {percentage}%
          </div>
          <div className="text-xs text-dark-muted mt-1">
            Ensemble Score
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <div className="text-sm font-semibold" style={{ color }}>
          {getScoreLabel(score)}
        </div>
        <div className="text-xs text-dark-muted mt-1">
          Higher score = more likely AI-generated
        </div>
      </div>
    </div>
  );
}

