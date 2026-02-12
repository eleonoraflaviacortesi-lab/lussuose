import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { useProfiles } from '@/hooks/useProfiles';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  rows?: number;
}

interface ProfileOption {
  user_id: string;
  full_name: string;
  avatar_emoji: string | null;
}

/**
 * Extract @mentions from a text string.
 * Returns an array of full_name strings that were mentioned.
 */
export function extractMentions(text: string, profiles: { full_name: string; user_id: string }[]): string[] {
  const mentions: string[] = [];
  // Match @Name (word chars, spaces between parts, stopping at punctuation)
  const regex = /@([\w\s]+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const candidate = match[1].trim();
    // Find the longest matching profile name starting from the candidate
    const matched = profiles.find(p =>
      candidate.toLowerCase().startsWith(p.full_name.toLowerCase())
    );
    if (matched && !mentions.includes(matched.full_name)) {
      mentions.push(matched.full_name);
    }
  }
  return mentions;
}

/**
 * Get user_ids from mentioned names.
 */
export function getMentionedUserIds(text: string, profiles: { full_name: string; user_id: string }[]): string[] {
  const names = extractMentions(text, profiles);
  return profiles
    .filter(p => names.includes(p.full_name))
    .map(p => p.user_id);
}

const MentionInput = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  className,
  multiline = false,
  rows = 3,
}: MentionInputProps) => {
  const { profiles } = useProfiles(true);
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter out current user and match query
  const filteredProfiles: ProfileOption[] = (profiles || [])
    .filter(p => p.user_id !== user?.id)
    .filter(p => !query || p.full_name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 6);

  const detectMentionQuery = useCallback((text: string, pos: number) => {
    // Look backwards from cursor to find @ symbol
    const beforeCursor = text.slice(0, pos);
    const atIndex = beforeCursor.lastIndexOf('@');
    
    if (atIndex === -1) {
      setShowDropdown(false);
      return;
    }
    
    // Check no space before @ (or start of string)
    if (atIndex > 0 && beforeCursor[atIndex - 1] !== ' ' && beforeCursor[atIndex - 1] !== '\n') {
      setShowDropdown(false);
      return;
    }
    
    const queryText = beforeCursor.slice(atIndex + 1);
    // If there's a newline after @, close dropdown
    if (queryText.includes('\n')) {
      setShowDropdown(false);
      return;
    }
    
    setQuery(queryText);
    setSelectedIndex(0);
    setShowDropdown(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const newValue = e.target.value;
    const pos = e.target.selectionStart || 0;
    setCursorPos(pos);
    onChange(newValue);
    detectMentionQuery(newValue, pos);
  };

  const handleSelect = (profile: ProfileOption) => {
    const beforeCursor = value.slice(0, cursorPos);
    const atIndex = beforeCursor.lastIndexOf('@');
    const afterCursor = value.slice(cursorPos);
    
    const newValue = value.slice(0, atIndex) + `@${profile.full_name} ` + afterCursor;
    onChange(newValue);
    setShowDropdown(false);
    
    // Refocus input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newPos = atIndex + profile.full_name.length + 2;
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (showDropdown && filteredProfiles.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredProfiles.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSelect(filteredProfiles[selectedIndex]);
        return;
      } else if (e.key === 'Escape') {
        setShowDropdown(false);
        return;
      }
    }
    
    // Submit on Enter without shift (single line) or Cmd/Ctrl+Enter (multiline)
    if (e.key === 'Enter' && !showDropdown) {
      if (!multiline || e.metaKey || e.ctrlKey) {
        e.preventDefault();
        onSubmit?.();
      }
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const commonProps = {
    ref: inputRef as any,
    value,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    placeholder: placeholder || 'Scrivi... usa @ per taggare',
    className: cn(className),
    onClick: (e: React.MouseEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      const pos = (e.target as HTMLTextAreaElement).selectionStart || 0;
      setCursorPos(pos);
      detectMentionQuery(value, pos);
    },
  };

  return (
    <div className="relative flex-1 min-w-0">
      {multiline ? (
        <textarea
          {...commonProps}
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          rows={rows}
        />
      ) : (
        <input
          {...commonProps}
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
        />
      )}
      
      {/* Mention dropdown */}
      {showDropdown && filteredProfiles.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-xl shadow-xl border border-border z-50 overflow-hidden max-h-52 overflow-y-auto"
        >
          {filteredProfiles.map((profile, idx) => (
            <button
              key={profile.user_id}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(profile);
              }}
              className={cn(
                'w-full text-left px-3 py-2.5 flex items-center gap-2.5 text-sm transition-colors',
                idx === selectedIndex ? 'bg-muted' : 'hover:bg-muted/50'
              )}
            >
              <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-base shrink-0">
                {profile.avatar_emoji || '🖤'}
              </span>
              <span className="font-medium truncate">{profile.full_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionInput;
