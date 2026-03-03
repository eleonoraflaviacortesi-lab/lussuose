import { useBannerSettings } from '@/hooks/useBannerSettings';
import { useKPIs } from '@/hooks/useKPIs';

const formatCurrency = (n: number) =>
  n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export default function AnnouncementBanner() {
  const { settings, isLoading } = useBannerSettings();
  const { kpis } = useKPIs('year');

  if (isLoading) return null;

  const target = kpis?.fatturato?.target || 0;
  const fatturatoCredito = kpis?.fatturatoCredito?.value || 0;
  const remaining = Math.max(0, target - fatturatoCredito);

  const interpolate = (t: string) =>
    t
      .replace(/\{remaining\}/g, formatCurrency(remaining))
      .replace(/\{target\}/g, formatCurrency(target))
      .replace(/\{fatturatoCredito\}/g, formatCurrency(fatturatoCredito));

  const texts = [settings.text1, settings.text2, settings.text3, settings.text4]
    .filter(Boolean)
    .map(interpolate);

  if (texts.length === 0) return null;

  const separator = ' ★ ';
  const content = texts.join(separator) + separator;
  const duration = `${settings.speed}s`;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] overflow-hidden select-none"
      style={{
        backgroundColor: settings.bgColor,
        color: settings.textColor,
        height: 'var(--banner-height, 28px)',
      }}
    >
      <div
        className="flex items-center whitespace-nowrap h-full text-xs font-semibold tracking-wider animate-ticker"
        style={{ animationDuration: duration }}
      >
        <span className="px-4">{content}</span>
        <span className="px-4">{content}</span>
      </div>
    </div>
  );
}
