import { memo } from 'react';
import { Bold, Italic, Underline, Strikethrough } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TitleFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string | null;
}

const TITLE_COLORS = [
  null, '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4',
];

interface TitleFormatControlsProps {
  format: TitleFormat;
  onChange: (format: TitleFormat) => void;
}

export const TitleFormatControls = memo(({ format, onChange }: TitleFormatControlsProps) => {
  return (
    <div>
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Formato titolo</span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange({ ...format, bold: !format.bold })}
          className={cn(
            "w-7 h-7 rounded-md flex items-center justify-center transition-all active:scale-90 border",
            format.bold ? "bg-foreground text-background border-foreground" : "bg-card border-border hover:bg-muted"
          )}
          title="Grassetto"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onChange({ ...format, italic: !format.italic })}
          className={cn(
            "w-7 h-7 rounded-md flex items-center justify-center transition-all active:scale-90 border",
            format.italic ? "bg-foreground text-background border-foreground" : "bg-card border-border hover:bg-muted"
          )}
          title="Corsivo"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onChange({ ...format, underline: !format.underline })}
          className={cn(
            "w-7 h-7 rounded-md flex items-center justify-center transition-all active:scale-90 border",
            format.underline ? "bg-foreground text-background border-foreground" : "bg-card border-border hover:bg-muted"
          )}
          title="Sottolineato"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onChange({ ...format, strikethrough: !format.strikethrough })}
          className={cn(
            "w-7 h-7 rounded-md flex items-center justify-center transition-all active:scale-90 border",
            format.strikethrough ? "bg-foreground text-background border-foreground" : "bg-card border-border hover:bg-muted"
          )}
          title="Barrato"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>
        
        <div className="w-px h-5 bg-border mx-0.5" />
        
        {TITLE_COLORS.map((color) => (
          <button
            key={color || 'default'}
            onClick={() => onChange({ ...format, color })}
            className={cn(
              "w-5 h-5 rounded-full border transition-transform hover:scale-110 active:scale-90",
              !color && "bg-foreground",
              format.color === color && "ring-2 ring-foreground ring-offset-1",
              !format.color && !color && "ring-2 ring-foreground ring-offset-1"
            )}
            style={color ? { backgroundColor: color, borderColor: color } : { borderColor: 'var(--border)' }}
            title={color || 'Default'}
          />
        ))}
      </div>
    </div>
  );
});
TitleFormatControls.displayName = 'TitleFormatControls';

export function getTitleFormat(customFields: any): TitleFormat {
  if (!customFields || typeof customFields !== 'object') return {};
  return {
    bold: customFields.title_bold || false,
    italic: customFields.title_italic || false,
    underline: customFields.title_underline || false,
    strikethrough: customFields.title_strikethrough || false,
    color: customFields.title_color || null,
  };
}

export function titleFormatToCustomFields(format: TitleFormat): Record<string, any> {
  return {
    title_bold: format.bold || false,
    title_italic: format.italic || false,
    title_underline: format.underline || false,
    title_strikethrough: format.strikethrough || false,
    title_color: format.color || null,
  };
}

export function titleStyle(format: TitleFormat): React.CSSProperties {
  const decorations: string[] = [];
  if (format.underline) decorations.push('underline');
  if (format.strikethrough) decorations.push('line-through');
  
  return {
    fontWeight: format.bold ? 700 : undefined,
    fontStyle: format.italic ? 'italic' : undefined,
    textDecoration: decorations.length > 0 ? decorations.join(' ') : undefined,
    color: format.color || undefined,
  };
}
