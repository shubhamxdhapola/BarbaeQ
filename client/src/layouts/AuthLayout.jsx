import React from 'react';
import { Logo } from '../components/ui/Logo.jsx';
import { ScrollToTop } from '../components/common/ScrollToTop.jsx';
import { CheckCircle2, Sparkles, Clock, ShieldCheck, Scissors } from 'lucide-react';

export const AuthLayout = ({ 
  children,
  tag = 'SMART QUEUE PLATFORM',
  heading = 'Where style meets punctuality.',
  highlightWord = 'meets punctuality.',
  headingPrefix = 'Where style ',
  description = 'The modern platform for barbershops to manage queues, appointments, and deliver an exceptional customer experience.',
  features = [
    'Real-time live queue tracking',
    'Zero waiting room delays',
    'Verified barbers & customer reviews'
  ]
}) => {
  return (
    <div className="min-h-screen flex w-full animate-fade-in bg-zinc-50">
      <ScrollToTop />
      
      {/* Form Area (Mobile/Right Side) */}
      <div className="flex-1 flex flex-col justify-center py-10 sm:py-14 px-4 sm:px-6 lg:flex-none lg:w-[540px] xl:w-[580px] z-10 relative bg-white border-r border-zinc-200/80 shadow-xs">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Header Logo (Hidden on Desktop) */}
          <div className="lg:hidden flex items-center mb-8 justify-center pt-2">
            <Logo size="lg" showIcon={false} />
          </div>

          <div className="bg-white rounded-3xl p-2 sm:p-4">
            {children}
          </div>
        </div>
      </div>

      {/* Desktop Branding Hero Panel (Left Side) */}
      <div className="hidden lg:flex flex-1 relative bg-zinc-950 overflow-hidden flex-col justify-between p-12 xl:p-16 text-white">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute inset-0 bg-radial-at-tr from-zinc-900/60 via-zinc-950 to-zinc-950 opacity-95 pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-zinc-800/40 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Logo size="lg" variant="white" showIcon={false} />
          <div className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-bold uppercase tracking-widest text-zinc-300">
            {tag}
          </div>
        </div>

        {/* Center Main Headline & Description */}
        <div className="relative z-10 my-auto py-12 max-w-xl space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.15] tracking-tight">
              {headingPrefix && <span>{headingPrefix}</span>}
              <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
                {highlightWord}
              </span>
            </h1>
            
            <p className="text-sm xl:text-base text-zinc-400 font-medium leading-relaxed max-w-lg">
              {description}
            </p>
          </div>

          {/* Feature Highlights */}
          {features && features.length > 0 && (
            <div className="pt-4 space-y-3">
              {features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs xl:text-sm font-semibold text-zinc-300">
                  <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300" />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Footer Credits */}
        <div className="relative z-10 pt-8 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 font-medium">
          <p>© {new Date().getFullYear()} BarbaeQ. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Fast Queueing</span>
            <span>•</span>
            <span>Live Estimates</span>
          </div>
        </div>
      </div>
    </div>
  );
};
