import React from 'react';
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip } from 'recharts';

interface ScoreGaugeProps {
  score: number;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score }) => {
  // Always show a "Potential" that is higher than current score to encourage growth
  // If score is 0-50, potential is +40. If 50-80, potential is +15.
  let potential = score < 60 ? score + 40 : score + 15;
  if (potential > 100) potential = 100;

  const data = [
    {
      name: 'Future Potential',
      value: potential,
      fill: '#818cf8', // Indigo 400 (lighter, background track)
      opacity: 0.2
    },
    {
      name: 'Starting Point',
      value: score,
      fill: score > 75 ? '#10b981' : '#6366f1', // Green if high, else Indigo
      opacity: 1
    }
  ];

  return (
    <div className="relative w-full h-48" style={{ minHeight: '200px' }}>
      <ResponsiveContainer width="100%" height="100%" minHeight={200}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="100%"
          barSize={15}
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: '#1e293b' }}
            dataKey="value"
            cornerRadius={10}
            label={false}
          />
        </RadialBarChart>
      </ResponsiveContainer>

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/4 text-center pointer-events-none w-full">
        <div className="text-4xl font-bold text-white tracking-tight">{score}%</div>
        <div className="text-xs text-indigo-200 font-medium uppercase tracking-wide mt-1">Match Potential</div>

        {score < 100 && (
          <div className="inline-block mt-2 px-2 py-0.5 rounded bg-indigo-500/20 text-[10px] text-indigo-300 border border-indigo-500/30">
            Aiming for {potential}%
          </div>
        )}
      </div>
    </div>
  );
};