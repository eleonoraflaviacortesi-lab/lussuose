interface WaveMarqueeProps {
  color: string;
}

export const WaveMarquee = ({ color }: WaveMarqueeProps) => (
  <svg
    width={900}
    height={12}
    viewBox="0 0 900 12"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    style={{ display: 'block', flexShrink: 0 }}
  >
    {Array.from({ length: 46 }).map((_, i) => (
      <circle
        key={i}
        cx={i * 20}
        cy={12}
        r={10}
        fill={color}
      />
    ))}
  </svg>
);
