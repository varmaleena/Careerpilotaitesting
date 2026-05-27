import { Check, Circle } from 'lucide-react';
import React from 'react';
import { Skill } from '../types';

interface SkillCardProps {
  skill: Skill;
}

export const SkillCard: React.FC<SkillCardProps> = ({ skill }) => {
  const isAcquired = skill.status === 'acquired';

  return (
    <div className={`px-3 py-1.5 rounded-md text-xs font-medium border flex items-center gap-1.5 ${isAcquired
        ? 'bg-emerald-500/5 text-emerald-300 border-emerald-500/20'
        : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50'
      }`}>
      {isAcquired ? (
        <Check className="w-3 h-3" />
      ) : (
        <Circle className="w-3 h-3" />
      )}
      <span>{skill.name}</span>
    </div>
  );
};
