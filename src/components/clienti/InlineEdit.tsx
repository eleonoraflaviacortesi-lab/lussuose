import { useState, useRef, useEffect, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Check, X, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineEditTextProps {
  value: string | null;
  onSave: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  prefix?: ReactNode;
  formatDisplay?: (value: string) => string;
}

export function InlineEditText({
  value,
  onSave,
  placeholder = 'Clicca per modificare',
  className,
  multiline = false,
  prefix,
  formatDisplay,
}: InlineEditTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        {multiline ? (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="min-h-[60px] text-sm"
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="h-8 text-sm"
          />
        )}
      </div>
    );
  }

  const displayValue = value 
    ? (formatDisplay ? formatDisplay(value) : value)
    : placeholder;

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        'group cursor-pointer rounded px-1 -mx-1 py-0.5 hover:bg-muted/80 transition-colors flex items-center gap-1',
        !value && 'text-muted-foreground italic',
        className
      )}
    >
      {prefix}
      <span className="flex-1">{displayValue}</span>
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
    </div>
  );
}

interface InlineEditNumberProps {
  value: number | null;
  onSave: (value: number | null) => void;
  placeholder?: string;
  className?: string;
  prefix?: ReactNode;
  suffix?: string;
  formatDisplay?: (value: number) => string;
}

export function InlineEditNumber({
  value,
  onSave,
  placeholder = 'Clicca per modificare',
  className,
  prefix,
  suffix,
  formatDisplay,
}: InlineEditNumberProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value?.toString() || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value?.toString() || '');
  }, [value]);

  const handleSave = () => {
    const numValue = editValue ? parseFloat(editValue.replace(/[^\d.-]/g, '')) : null;
    onSave(isNaN(numValue as number) ? null : numValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditValue(value?.toString() || '');
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        className="h-8 text-sm w-32"
      />
    );
  }

  const displayValue = value !== null
    ? (formatDisplay ? formatDisplay(value) : value.toString()) + (suffix || '')
    : placeholder;

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        'group cursor-pointer rounded px-1 -mx-1 py-0.5 hover:bg-muted/80 transition-colors flex items-center gap-1',
        value === null && 'text-muted-foreground italic',
        className
      )}
    >
      {prefix}
      <span className="flex-1">{displayValue}</span>
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
    </div>
  );
}

interface InlineEditBadgesProps {
  values: string[];
  onSave: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  variant?: 'default' | 'secondary' | 'outline';
}

export function InlineEditBadges({
  values,
  onSave,
  placeholder = 'Clicca per aggiungere',
  className,
  variant = 'secondary',
}: InlineEditBadgesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleAddBadge = () => {
    if (editValue.trim() && !values.includes(editValue.trim())) {
      onSave([...values, editValue.trim()]);
      setEditValue('');
    }
  };

  const handleRemoveBadge = (badgeToRemove: string) => {
    onSave(values.filter(v => v !== badgeToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddBadge();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue('');
    }
    if (e.key === 'Backspace' && !editValue && values.length > 0) {
      handleRemoveBadge(values[values.length - 1]);
    }
  };

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        'group cursor-pointer rounded px-1 -mx-1 py-1 hover:bg-muted/80 transition-colors min-h-[32px]',
        className
      )}
    >
      <div className="flex flex-wrap gap-1.5 items-center">
        {values.map((v) => (
          <Badge 
            key={v} 
            variant={variant}
            className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveBadge(v);
            }}
          >
            {v}
            <X className="h-3 w-3 ml-1" />
          </Badge>
        ))}
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              handleAddBadge();
              setIsEditing(false);
            }}
            placeholder="Aggiungi..."
            className="h-6 w-24 text-xs"
          />
        ) : values.length === 0 ? (
          <span className="text-muted-foreground italic text-sm">{placeholder}</span>
        ) : (
          <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
        )}
      </div>
    </div>
  );
}

interface InlineEditSelectProps {
  value: string | null;
  options: { value: string; label: string }[];
  onSave: (value: string | null) => void;
  placeholder?: string;
  className?: string;
  prefix?: ReactNode;
}

export function InlineEditSelect({
  value,
  options,
  onSave,
  placeholder = 'Seleziona...',
  className,
  prefix,
}: InlineEditSelectProps) {
  const [isEditing, setIsEditing] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing && selectRef.current) {
      selectRef.current.focus();
    }
  }, [isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSave(e.target.value || null);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <select
        ref={selectRef}
        value={value || ''}
        onChange={handleChange}
        onBlur={() => setIsEditing(false)}
        className="h-8 text-sm border rounded px-2 bg-background"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  const displayLabel = options.find(o => o.value === value)?.label || value;

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        'group cursor-pointer rounded px-1 -mx-1 py-0.5 hover:bg-muted/80 transition-colors flex items-center gap-1',
        !value && 'text-muted-foreground italic',
        className
      )}
    >
      {prefix}
      <span className="flex-1">{displayLabel || placeholder}</span>
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
    </div>
  );
}

interface InlineEditBooleanProps {
  value: boolean;
  onSave: (value: boolean) => void;
  labelTrue?: string;
  labelFalse?: string;
  className?: string;
}

export function InlineEditBoolean({
  value,
  onSave,
  labelTrue = 'Sì',
  labelFalse = 'No',
  className,
}: InlineEditBooleanProps) {
  return (
    <div
      onClick={() => onSave(!value)}
      className={cn(
        'group cursor-pointer rounded px-1 -mx-1 py-0.5 hover:bg-muted/80 transition-colors flex items-center gap-1',
        className
      )}
    >
      <span className={value ? 'text-green-600' : 'text-muted-foreground'}>
        {value ? `✓ ${labelTrue}` : labelFalse}
      </span>
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
    </div>
  );
}
