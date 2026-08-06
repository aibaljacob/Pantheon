import React from 'react';
import { Button } from '../../../components/ui/Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  secondaryActionLabel?: string;
  onAction?: () => void;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, actionLabel, secondaryActionLabel, onAction, onSecondaryAction }) => {
  return (
    <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-8 text-left">
      <div className="space-y-3 max-w-xl">
        <h3 className="font-headline text-2xl font-bold text-[#ffffff]">{title}</h3>
        <p className="text-sm leading-relaxed text-[#cac6bc]">{description}</p>
      </div>
      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-6 flex flex-wrap gap-3">
          {actionLabel ? <Button variant="primary" size="md" onClick={onAction}>{actionLabel}</Button> : null}
          {secondaryActionLabel ? <Button variant="secondary" size="md" onClick={onSecondaryAction}>{secondaryActionLabel}</Button> : null}
        </div>
      )}
    </div>
  );
};