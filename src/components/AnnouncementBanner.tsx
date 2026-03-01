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
    <div className="w-full select-none relative">
      {/* Banner background + text */}
      <div style={{ backgroundColor: bgColor, color: textColor }}>
        <div className="overflow-hidden py-2">
          <div
            className="flex whitespace-nowrap animate-scroll"
            style={animationStyle}
          >
            <span className="flex items-center gap-6 mx-6 text-sm font-bold tracking-[0.15em] uppercase">
              {textBlock}
            </span>
            <span className="flex items-center gap-6 mx-6 text-sm font-bold tracking-[0.15em] uppercase">
              {textBlock}
            </span>
          </div>
        </div>
      </div>

      {/* Wave decoration - semicircles in page bg color overlapping the banner bottom */}
      <div className="relative -mt-[1px]" style={{ backgroundColor: bgColor }}>
        <div className="overflow-hidden" style={{ height: '10px' }}>
          <div className="flex" style={{ width: 'max-content' }}>
            <WaveMarquee color="hsl(var(--background))" strokeColor="hsl(var(--background))" />
            <WaveMarquee color="hsl(var(--background))" strokeColor="hsl(var(--background))" />
          </div>
        </div>
      </div>
    </div>
  );
};
