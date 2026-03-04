import { useRef, useCallback, useEffect, memo } from 'react';
import { Bold, Italic, Underline, List, ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  rows?: number;
}

const ToolbarButton = memo(({ 
  onClick, 
  icon: Icon, 
  title,
  command,
}: { 
  onClick: () => void; 
  icon: React.ElementType; 
  title: string;
  command: string;
}) => (
  <button
    type="button"
    onMouseDown={(e) => {
      e.preventDefault(); // Prevent losing focus from contentEditable
      onClick();
    }}
    title={title}
    className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 active:scale-95 transition-all"
  >
    <Icon className="w-3.5 h-3.5" />
  </button>
));
ToolbarButton.displayName = 'ToolbarButton';

export const RichTextEditor = memo(({
  value,
  onChange,
  onBlur,
  placeholder = 'Scrivi...',
  className,
  minHeight = '80px',
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  // Sync external value changes into the editor
  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
    isInternalUpdate.current = false;
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput();
  }, [handleInput]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Cmd/Ctrl + B = Bold
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      execCommand('bold');
    }
    // Cmd/Ctrl + I = Italic
    if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
      e.preventDefault();
      execCommand('italic');
    }
    // Cmd/Ctrl + U = Underline
    if ((e.metaKey || e.ctrlKey) && e.key === 'u') {
      e.preventDefault();
      execCommand('underline');
    }
  }, [execCommand]);

  return (
    <div className={cn("rounded-2xl bg-white overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-border/40">
        <ToolbarButton
          command="bold"
          onClick={() => execCommand('bold')}
          icon={Bold}
          title="Grassetto (⌘B)"
        />
        <ToolbarButton
          command="italic"
          onClick={() => execCommand('italic')}
          icon={Italic}
          title="Corsivo (⌘I)"
        />
        <ToolbarButton
          command="underline"
          onClick={() => execCommand('underline')}
          icon={Underline}
          title="Sottolineato (⌘U)"
        />
        <div className="w-px h-4 bg-border/40 mx-1" />
        <ToolbarButton
          command="insertUnorderedList"
          onClick={() => execCommand('insertUnorderedList')}
          icon={List}
          title="Elenco puntato"
        />
        <ToolbarButton
          command="insertOrderedList"
          onClick={() => execCommand('insertOrderedList')}
          icon={ListOrdered}
          title="Elenco numerato"
        />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className={cn(
          "px-4 py-2.5 text-sm text-foreground focus:outline-none",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60 empty:before:pointer-events-none",
          "[&_b]:font-bold [&_i]:italic [&_u]:underline",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1",
          "[&_li]:py-0.5",
        )}
        style={{ minHeight }}
        suppressContentEditableWarning
      />
    </div>
  );
});
RichTextEditor.displayName = 'RichTextEditor';

/** Display rich text HTML content (read-only) */
export const RichTextDisplay = memo(({ html, className }: { html: string; className?: string }) => {
  if (!html) return null;
  
  return (
    <div
      className={cn(
        "text-sm text-foreground",
        "[&_b]:font-bold [&_i]:italic [&_u]:underline",
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1",
        "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1",
        "[&_li]:py-0.5",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});
RichTextDisplay.displayName = 'RichTextDisplay';

export default RichTextEditor;
