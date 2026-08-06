import React from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';

interface AuthLoadingScreenProps {
  title?: string;
  description?: string;
}

export const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({
  title = 'Restoring session',
  description = 'Loading your workspace and verifying your account...',
}) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#141312] px-6 text-[#e6e2df]">
      <div className="w-full max-w-md rounded-3xl border border-[#363433] bg-[#1c1b1a] p-8 text-center shadow-2xl shadow-black/40">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#48473f] bg-[#2A2724] text-[#e6e2df]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <Badge variant="bronze" className="mt-6">Pantheon Auth</Badge>
        <h1 className="mt-4 font-headline text-2xl font-bold text-[#ffffff]">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#cac6bc]">{description}</p>
      </div>
    </div>
  );
};