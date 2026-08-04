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
        ? 'bg-[#fcfcfa] text-zinc-800 border-[#e3e1dc] shadow-sm'
        : 'bg-transparent text-zinc-500 border-dashed border-[#e3e1dc]'
      }`}>
      {isAcquired ? (
        <Check className="w-3 h-3 text-zinc-500" />
      ) : (
        <Circle className="w-3 h-3 text-zinc-300" />
      )}
      <span>{skill.name}</span>
    </div>
  );
};
