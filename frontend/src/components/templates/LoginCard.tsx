import type { ReactNode } from 'react';
import { BrandMark } from '../atoms/BrandMark';

interface LoginCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function LoginCard({ title, subtitle, children }: LoginCardProps) {
  return (
    <div id="login-screen" className="flex min-h-screen items-center justify-center bg-backdrop p-6">
      <div className="w-full max-w-[380px] rounded-lg border border-line bg-surface p-8 shadow-md">
        <div className="mb-7 flex items-center gap-2.5">
          <BrandMark size="lg" />
          <strong>Vacation Manager</strong>
        </div>
        <h1 className="mb-1 text-xl font-semibold text-fg">{title}</h1>
        <p className="mb-6 text-muted">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
