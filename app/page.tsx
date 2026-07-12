'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import { Bus, Truck, MapPin, ArrowRight } from 'lucide-react';

const ANIMATION_STEPS = [
  { icon: Bus, text: 'Initializing TransitOps...' },
  { icon: Truck, text: 'Loading fleet data...' },
  { icon: MapPin, text: 'Connecting dispatch...' },
];

export default function Home() {
  const { user } = useApp();
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const isAuthenticated = !!user;

    // Animate through loading steps
    const stepTimer = setInterval(() => {
      setStepIndex(prev => Math.min(prev + 1, ANIMATION_STEPS.length - 1));
    }, 350);

    // Determine redirect destination
    const destination = isAuthenticated ? '/dashboard' : '/login';

    // Shorter splash for returning users
    const splashDuration = isAuthenticated ? 800 : 1600;

    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, splashDuration);

    const redirectTimer = setTimeout(() => {
      setShow(false);
      router.replace(destination);
    }, splashDuration + 400);

    return () => {
      clearInterval(stepTimer);
      clearTimeout(fadeTimer);
      clearTimeout(redirectTimer);
    };
  }, [user, router]);

  if (!show) return null;

  const CurrentIcon = ANIMATION_STEPS[stepIndex].icon;
  const currentText = ANIMATION_STEPS[stepIndex].text;

  return (
    <div
      className={`fixed inset-0 bg-slate-900 flex flex-col items-center justify-center motion-safe:transition-opacity duration-500 ease-in-out z-50 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Animated icon */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center motion-safe:animate-pulse">
          <CurrentIcon className="w-10 h-10 text-blue-400 transition-all duration-300" />
        </div>
        {/* Pulsing ring */}
        <div className="absolute inset-0 rounded-2xl border-2 border-blue-500/20 motion-safe:animate-ping" />
      </div>

      {/* Brand name */}
      <h1 className="text-3xl font-bold text-white tracking-tight mb-2 motion-safe:animate-splash-fade-in">
        TransitOps
      </h1>
      <p className="text-slate-400 text-sm mb-12 motion-safe:animate-[splash-fade-in_0.4s_ease-out_0.1s_both]">
        Smart Transport Operations Platform
      </p>

      {/* Loading indicator */}
      <div className="flex items-center gap-3 text-slate-300 text-sm">
        <span className="w-2 h-2 rounded-full bg-blue-400 motion-safe:animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-blue-400 motion-safe:animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-blue-400 motion-safe:animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>

      {/* Loading text */}
      <div className="flex items-center gap-2 mt-6 text-slate-500 text-sm transition-all duration-300">
        <span className="font-mono text-xs text-blue-400/60">{'>'}</span>
        <span key={stepIndex} className="motion-safe:animate-[splash-fade-in_0.25s_ease-out] inline-block">
          {currentText}
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-blue-400/60" />
      </div>


    </div>
  );
}
