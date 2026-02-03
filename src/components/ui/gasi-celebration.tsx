import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface GasiCelebrationProps {
  show: boolean;
  onComplete: () => void;
}

export const GasiCelebration = ({ show, onComplete }: GasiCelebrationProps) => {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      setAnimating(true);

      // Start fade out after 2.5 seconds
      const fadeTimer = setTimeout(() => {
        setAnimating(false);
      }, 2500);

      // Complete and hide after 3 seconds
      const hideTimer = setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 3000);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none",
        "transition-opacity duration-500",
        animating ? "opacity-100" : "opacity-0"
      )}
    >
      <div 
        className={cn(
          "text-center transition-all duration-500",
          animating 
            ? "scale-100 opacity-100" 
            : "scale-150 opacity-0"
        )}
        style={{
          animation: animating ? 'gasiPulse 0.5s ease-out' : undefined,
        }}
      >
        <h1 
          className="text-5xl sm:text-7xl font-black tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 25%, #FF6347 50%, #FFD700 75%, #FFA500 100%)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'shimmer 2s linear infinite',
            textShadow: '0 0 40px rgba(255, 215, 0, 0.5)',
            filter: 'drop-shadow(0 4px 20px rgba(255, 165, 0, 0.4))',
          }}
        >
          GASI ABBESTIA!
        </h1>
        <p className="text-lg sm:text-xl text-amber-600 font-semibold mt-2 animate-bounce">
          🏆 Obiettivo raggiunto! 🏆
        </p>
      </div>

      <style>{`
        @keyframes gasiPulse {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes shimmer {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
};