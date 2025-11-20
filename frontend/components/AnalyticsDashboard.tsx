'use client';

import { useEffect, useState } from 'react';

interface AnalyticsData {
  totalProcessed: number;
  verdictBreakdown: {
    authentic: number;
    aiGenerated: number;
    manipulated: number;
  };
  averageConfidence: number;
  confidenceDistribution: {
    high: number; // >= 0.8
    medium: number; // 0.6-0.8
    low: number; // < 0.6
  };
  modelPerformance: {
    name: string;
    avgScore: number;
  }[];
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalProcessed: 0,
    verdictBreakdown: {
      authentic: 0,
      aiGenerated: 0,
      manipulated: 0,
    },
    averageConfidence: 0,
    confidenceDistribution: {
      high: 0,
      medium: 0,
      low: 0,
    },
    modelPerformance: [],
  });

  useEffect(() => {
    // In production, fetch from API
    // For now, load from localStorage or use mock data
    const mockData: AnalyticsData = {
      totalProcessed: 1247,
      verdictBreakdown: {
        authentic: 523,
        aiGenerated: 612,
        manipulated: 112,
      },
      averageConfidence: 0.756,
      confidenceDistribution: {
        high: 682,
        medium: 451,
        low: 114,
      },
      modelPerformance: [
        { name: 'Dafilab', avgScore: 0.85 },
        { name: 'Smogy', avgScore: 0.82 },
        { name: 'Hemg', avgScore: 0.79 },
        { name: 'SDXL', avgScore: 0.76 },
        { name: 'Deepfake', avgScore: 0.74 },
      ],
    };

    setAnalytics(mockData);
  }, []);

  const verdictTotal = analytics.verdictBreakdown.authentic + 
                       analytics.verdictBreakdown.aiGenerated + 
                       analytics.verdictBreakdown.manipulated;

  const getPercentage = (value: number, total: number) => 
    total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-2">📊 Analytics Dashboard</h2>
        <p className="text-gray-600">System-wide verification statistics and performance metrics</p>
      </div>

      {/* Overview Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Total Processed</div>
          <div className="text-4xl font-bold text-blue-600">{analytics.totalProcessed.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-2">All time</div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg shadow p-6">
          <div className="text-sm text-green-700 mb-2">Authentic</div>
          <div className="text-4xl font-bold text-green-700">
            {analytics.verdictBreakdown.authentic}
          </div>
          <div className="text-xs text-green-600 mt-2">
            {getPercentage(analytics.verdictBreakdown.authentic, verdictTotal)}% of total
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg shadow p-6">
          <div className="text-sm text-orange-700 mb-2">AI Generated</div>
          <div className="text-4xl font-bold text-orange-700">
            {analytics.verdictBreakdown.aiGenerated}
          </div>
          <div className="text-xs text-orange-600 mt-2">
            {getPercentage(analytics.verdictBreakdown.aiGenerated, verdictTotal)}% of total
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg shadow p-6">
          <div className="text-sm text-red-700 mb-2">Manipulated</div>
          <div className="text-4xl font-bold text-red-700">
            {analytics.verdictBreakdown.manipulated}
          </div>
          <div className="text-xs text-red-600 mt-2">
            {getPercentage(analytics.verdictBreakdown.manipulated, verdictTotal)}% of total
          </div>
        </div>
      </div>

      {/* Verdict Distribution Chart */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h3 className="text-xl font-bold mb-6">Verdict Distribution</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-green-700">✅ Authentic</span>
              <span className="text-sm font-semibold">
                {analytics.verdictBreakdown.authentic} ({getPercentage(analytics.verdictBreakdown.authentic, verdictTotal)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-500 h-4 rounded-full"
                style={{ width: `${getPercentage(analytics.verdictBreakdown.authentic, verdictTotal)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-orange-700">🤖 AI Generated</span>
              <span className="text-sm font-semibold">
                {analytics.verdictBreakdown.aiGenerated} ({getPercentage(analytics.verdictBreakdown.aiGenerated, verdictTotal)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-orange-500 h-4 rounded-full"
                style={{ width: `${getPercentage(analytics.verdictBreakdown.aiGenerated, verdictTotal)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-red-700">⚠️ Manipulated</span>
              <span className="text-sm font-semibold">
                {analytics.verdictBreakdown.manipulated} ({getPercentage(analytics.verdictBreakdown.manipulated, verdictTotal)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-red-500 h-4 rounded-full"
                style={{ width: `${getPercentage(analytics.verdictBreakdown.manipulated, verdictTotal)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Confidence Distribution */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h3 className="text-xl font-bold mb-6">Confidence Distribution</h3>
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {analytics.confidenceDistribution.high}
            </div>
            <div className="text-sm font-medium text-gray-700">High (≥80%)</div>
            <div className="text-xs text-gray-500 mt-1">
              {getPercentage(analytics.confidenceDistribution.high, analytics.totalProcessed)}% of total
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-600 mb-2">
              {analytics.confidenceDistribution.medium}
            </div>
            <div className="text-sm font-medium text-gray-700">Medium (60-80%)</div>
            <div className="text-xs text-gray-500 mt-1">
              {getPercentage(analytics.confidenceDistribution.medium, analytics.totalProcessed)}% of total
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-orange-600 mb-2">
              {analytics.confidenceDistribution.low}
            </div>
            <div className="text-sm font-medium text-gray-700">Low (&lt;60%)</div>
            <div className="text-xs text-gray-500 mt-1">
              {getPercentage(analytics.confidenceDistribution.low, analytics.totalProcessed)}% of total
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Average Confidence</span>
            <span className="text-2xl font-bold text-blue-600">
              {(analytics.averageConfidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Model Performance */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h3 className="text-xl font-bold mb-6">Model Performance</h3>
        <div className="space-y-4">
          {analytics.modelPerformance.map((model, index) => (
            <div key={model.name}>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  #{index + 1} {model.name}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {(model.avgScore * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-400' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${(model.avgScore * 100).toFixed(0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>💡 Note:</strong> Model performance scores represent average confidence across all predictions.
            Higher scores indicate more decisive predictions.
          </p>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h3 className="text-xl font-bold mb-6">System Health</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-sm font-semibold text-green-700">API Status</div>
            <div className="text-xs text-green-600 mt-1">Operational</div>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded text-center">
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-sm font-semibold text-green-700">Avg Processing Time</div>
            <div className="text-xs text-green-600 mt-1">0.46s per image</div>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded text-center">
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-sm font-semibold text-green-700">System Accuracy</div>
            <div className="text-xs text-green-600 mt-1">60.6% (F1: 82.9%)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

