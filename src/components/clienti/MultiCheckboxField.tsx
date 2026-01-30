import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface MultiCheckboxFieldProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function MultiCheckboxField({
  label,
  options,
  selected,
  onChange,
}: MultiCheckboxFieldProps) {
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        {options.map(option => (
          <label
            key={option}
            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-2 py-1.5 transition-colors"
          >
            <Checkbox
              checked={selected.includes(option)}
              onCheckedChange={() => toggleOption(option)}
            />
            <span className="text-sm leading-tight">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default MultiCheckboxField;
