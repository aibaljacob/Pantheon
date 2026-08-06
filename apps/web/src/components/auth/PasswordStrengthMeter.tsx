import React from 'react';
import { Check, X } from 'lucide-react';
interface PasswordStrengthMeterProps {
  password?: string;
}
interface RuleRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}
const PASSWORD_RULES: RuleRequirement[] = [
  { id: 'length', label: '8+ characters', test: (p) => p.length >= 8 },
  { id: 'uppercase', label: 'Uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'Lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
  { id: 'number', label: 'Number (0-9)', test: (p) => /\d/.test(p) },
  { id: 'special', label: 'Special symbol (!@#$%...)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];
export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password = '' }) => {
  if (!password) {
    return null;
  }
  const passedRules = PASSWORD_RULES.filter((rule) => rule.test(password));
  const score = passedRules.length;
  let strengthLabel = 'Weak';
  let scoreBarColor = 'bg-red-500/70';
  let textColor = 'text-red-400';
  if (score === 5) {
    strengthLabel = 'Strong';
    scoreBarColor = 'bg-emerald-500/80';
    textColor = 'text-emerald-400';
  } else if (score >= 3) {
    strengthLabel = 'Good';
    scoreBarColor = 'bg-amber-500/80';
    textColor = 'text-amber-400';
  } else if (score >= 2) {
    strengthLabel = 'Fair';
    scoreBarColor = 'bg-yellow-500/70';
    textColor = 'text-yellow-400';
  }
  return (
    <div className="space-y-2 rounded-lg border border-[#363433] bg-[#141312] p-3 text-left">
      {/* Strength Bar & Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#cac6bc]">
          Password Strength
        </span>
        <span className={`text-[11px] font-mono font-semibold ${textColor}`}>
          {strengthLabel} ({score}/5)
        </span>
      </div>
      {/* Progress Bars */}
      <div className="grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              level <= score ? scoreBarColor : 'bg-[#2b2a29]'
            }`}
          />
        ))}
      </div>
      {/* Rule Breakdown Checklist */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1">
        {PASSWORD_RULES.map((rule) => {
          const isPassed = rule.test(password);
          return (
            <div key={rule.id} className="flex items-center gap-1.5">
              {isPassed ? (
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
              ) : (
                <X className="w-3 h-3 text-[#939188]/60 shrink-0" />
              )}
              <span
                className={`text-[10px] font-mono leading-tight ${
                  isPassed ? 'text-[#e6e2df]' : 'text-[#8c887e]'
                }`}
              >
                {rule.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};