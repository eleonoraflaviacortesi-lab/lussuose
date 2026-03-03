import { useBannerSettings } from '@/hooks/useBannerSettings';
import { useKPIs } from '@/hooks/useKPIs';
import starIcon from '@/assets/star_icon.png';

const formatCurrency = (n: number) =>
  n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

function StarSep() {
  return <img src={starIcon} alt="✦" className="inline-block h-2.5 w-2.5 mx-3 opacity-60" style={{ verticalAlign: 'middle' }} />;
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

  // Add vendite and incarichi
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
        className="flex items-center whitespace-nowrap h-full text-[11px] font-semibold tracking-wider animate-ticker"
        style={{ animationDuration: duration }}
      >
        {[0, 1].map((dup) => (
          <span key={dup} className="flex items-center px-4">
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
