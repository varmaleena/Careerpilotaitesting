import React from 'react';
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';

interface ScoreGaugeProps {
  score: number;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score }) => {
  const data = [
    {
      name: 'Score',
      value: score,
      fill: score > 75 ? '#10b981' : score > 50 ? '#a78bfa' : '#f59e0b', // Green if high, violet mid, amber low
    }
  ];

  const getScoreLabel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Developing';
    return 'Needs Work';
  };

  return (
    <div className="relative w-full h-40">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="75%"
          outerRadius="100%"
          barSize={12}
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: '#27272a' }}
            dataKey="value"
            cornerRadius={6}
          />
        </RadialBarChart>
      </ResponsiveContainer>

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/4 text-center pointer-events-none">
        <div className="text-3xl font-bold text-white">{score}%</div>
        <div className="text-xs text-zinc-500 font-medium mt-1">{getScoreLabel()}</div>
      </div>
    </div>
  );
};
