import { WaveMarquee } from '@/components/WaveMarquee';

interface AnnouncementBannerProps {
  texts: string[];
  bgColor?: string;
  textColor?: string;
  speed?: number;
}

export const AnnouncementBanner = ({
  texts,
  bgColor = '#000000',
  textColor = '#FFFFFF',
  speed = 40,
}: AnnouncementBannerProps) => {
  const animationStyle = { animationDuration: `${speed}s` };

  const textBlock = texts.map((t, i) => (
    <span key={i} className="flex items-center gap-6">
      <span>{t}</span>
      <span>★</span>
    </span>
  ));

  return (
    <div className="w-full select-none">
      {/* Banner bg + scrolling text */}
      <div style={{ backgroundColor: bgColor, color: textColor }}>
        <div className="overflow-hidden py-2">
          <div className="flex whitespace-nowrap animate-scroll" style={animationStyle}>
            <span className="flex items-center gap-6 mx-6 text-sm font-bold tracking-[0.15em] uppercase">
              {textBlock}
            </span>
            <span className="flex items-center gap-6 mx-6 text-sm font-bold tracking-[0.15em] uppercase">
              {textBlock}
            </span>
          </div>
        </div>
      </div>

      {/* Scalloped edge: white semicircles biting into the black banner */}
      <div className="relative -mt-[10px] overflow-hidden" style={{ height: '12px', pointerEvents: 'none' }}>
        <div className="flex" style={{ width: 'max-content' }}>
          <WaveMarquee color="hsl(var(--background))" />
          <WaveMarquee color="hsl(var(--background))" />
        </div>
      </div>
    </div>
  );
};
