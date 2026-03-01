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
    <div className="w-full overflow-hidden select-none" style={{ backgroundColor: bgColor, color: textColor }}>
      {/* Scrolling text */}
      <div className="overflow-hidden py-1.5">
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

      {/* Wave decoration */}
      <div className="overflow-hidden -mb-2.5">
        <div className="flex" style={{ width: 'max-content' }}>
          <WaveMarquee color={bgColor} strokeColor={textColor} />
          <WaveMarquee color={bgColor} strokeColor={textColor} />
        </div>
      </div>
    </div>
  );
};
