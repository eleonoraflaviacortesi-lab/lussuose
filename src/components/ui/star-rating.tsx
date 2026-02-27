import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number | null;
  onChange: (value: number | null) => void;
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export const StarRating = ({ value, onChange, max = 5, size = 'md', className }: StarRatingProps) => {
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  const handleClick = (star: number) => {
    // If clicking the same star, remove rating
    onChange(value === star ? null : star);
  };

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          className="p-0.5 transition-transform active:scale-90 hover:scale-110"
        >
          <Star
            className={cn(
              iconSize,
              "transition-colors",
              (value ?? 0) >= star
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground/30 hover:text-amber-300"
            )}
          />
        </button>
      ))}
    </div>
  );
};
