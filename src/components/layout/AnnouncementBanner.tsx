import { useBannerSettings } from '@/hooks/useBannerSettings';
import { useKPIs } from '@/hooks/useKPIs';

const formatCurrency = (n: number) =>
  n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

function Star8({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 0 L14.1 8.5 L21.6 4.4 L16.5 11 L24 12 L16.5 13 L21.6 19.6 L14.1 15.5 L12 24 L9.9 15.5 L2.4 19.6 L7.5 13 L0 12 L7.5 11 L2.4 4.4 L9.9 8.5 Z" />
    </svg>
  );
}

function StarSep() {
  return <Star8 className="inline-block h-2.5 w-2.5 mx-3 opacity-80 shrink-0 text-white" />;
}

export default function AnnouncementBanner() {
  const { settings, isLoading } = useBannerSettings();
  const { kpis: yearKpis } = useKPIs('year');
  const { kpis: monthKpis } = useKPIs('month');

  if (isLoading) return null;

  const target = yearKpis?.fatturato?.target || 0;
  const fatturatoCredito = yearKpis?.fatturatoCredito?.value || 0;
  const remaining = Math.max(0, target - fatturatoCredito);

  const venditeValue = yearKpis?.vendite?.value || 0;
  const venditeTarget = yearKpis?.vendite?.target || 0;
  const incarichiValue = monthKpis?.incarichi?.value || 0;
  const incarichiTarget = monthKpis?.incarichi?.target || 0;

  const interpolate = (t: string) =>
    t
      .replace(/\{remaining\}/g, formatCurrency(remaining))
      .replace(/\{target\}/g, formatCurrency(target))
      .replace(/\{fatturatoCredito\}/g, formatCurrency(fatturatoCredito));

  const texts = [settings.text1, settings.text2, settings.text3, settings.text4]
    .filter(Boolean)
    .map(interpolate);

  texts.push(`Vendite ${venditeValue}/${venditeTarget}`);
  texts.push(`Incarichi mese ${incarichiValue}/${incarichiTarget}`);

  if (texts.length === 0) return null;

  const duration = `${settings.speed}s`;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] overflow-hidden select-none"
      style={{
        backgroundColor: settings.bgColor,
        color: settings.textColor,
        height: 'var(--banner-height, 34px)',
      }}
    >
      <div
        className="flex items-center whitespace-nowrap h-full animate-ticker"
        style={{
          animationDuration: duration,
          fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.15em',
        }}
      >
        {[0, 1].map((dup) => (
          <span key={dup} className="flex items-center px-4 uppercase">
            {texts.map((t, i) => (
              <span key={i} className="flex items-center">
                {i > 0 && <StarSep />}
                <span>{t}</span>
              </span>
            ))}
            <StarSep />
          </span>
        ))}
      </div>
    </div>
  );
}
