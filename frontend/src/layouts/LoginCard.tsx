import type { ReactNode } from 'react';
import { BrandMark } from '../components/atoms/BrandMark';

interface LoginCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

const LOGIN_IMAGE = 'https://i.pinimg.com/736x/be/09/e9/be09e90f18d72d5795b1d0efcd2644b7.jpg';

export function LoginCard({ title, subtitle, children }: LoginCardProps) {
  return (
    <div id="login-screen" className="min-h-screen bg-surface md:flex md:items-center md:justify-center md:bg-backdrop md:p-7">
      <div className="relative w-full max-w-[1000px] overflow-hidden bg-surface md:h-[calc(100vh-6px)] md:max-h-[500px] md:min-h-[450px] md:rounded-[40px] md:shadow-lg">
        <aside className="absolute inset-y-0 left-0 hidden w-[calc(50%+96px)] overflow-hidden bg-white md:block">
          <img
            src={LOGIN_IMAGE}
            alt=""
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover opacity-50 grayscale"
            onError={(e) => e.currentTarget.remove()}
          />
          <div className="absolute bottom-0 left-0 w-[calc(100%-96px)] bg-linear-to-t from-white via-white/80 to-transparent px-6 pt-20 pb-8">
            <p className="text-center text-3xl leading-none font-black tracking-wide text-transparent uppercase [-webkit-text-stroke:1.5px_rgb(0_0_0/0.6)] xl:text-4xl">
              Sistema de Vacaciones
            </p>
          </div>
        </aside>

        <main className="relative flex min-h-screen bg-surface p-6 md:ml-[50%] md:h-full md:min-h-0 md:overflow-y-auto md:rounded-tl-[96px] md:p-12">
          <div className="m-auto w-full max-w-[520px]">
            <div className="mb-7 flex items-center gap-2.5 md:hidden">
              <BrandMark size="lg" />
              <strong>Sistema de Vacaciones</strong>
            </div>
            <h1 className="mb-1 text-2xl font-semibold text-fg">{title}</h1>
            <p className="mb-6 text-muted">{subtitle}</p>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
