interface WaveMarqueeProps {
  color: string;
  strokeColor?: string;
}

export const WaveMarquee = ({ color, strokeColor = "currentColor" }: WaveMarqueeProps) => (
  <svg
    width={900}
    height={20}
    viewBox="0 0 900 20"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    style={{ display: 'block', flexShrink: 0 }}
  >
    {Array.from({ length: 45 }).map((_, i) => (
      <circle
        key={i}
        cx={i * 20 + 10}
        cy={0}
        r={10}
        fill={color}
        stroke={strokeColor}
        strokeWidth={1}
      />
    ))}
  </svg>
);
