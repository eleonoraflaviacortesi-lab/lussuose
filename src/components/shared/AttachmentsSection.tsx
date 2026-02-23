import { useRef, useState } from 'react';
import { Paperclip, Download, Trash2, FileText, Image, File, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAttachments, Attachment } from '@/hooks/useAttachments';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AttachmentsSectionProps {
  entityType: 'cliente' | 'notizia';
  entityId: string | undefined;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const getFileIcon = (contentType: string | null) => {
  if (!contentType) return <File className="w-4 h-4" />;
  if (contentType.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500" />;
  if (contentType.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
};

export function AttachmentsSection({ entityType, entityId }: AttachmentsSectionProps) {
  const { attachments, isLoading, uploadFile, deleteFile, isUploading, isDeleting, getDownloadUrl } = useAttachments(entityType, entityId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) {
        continue; // skip files > 20MB
      }
      await uploadFile(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = async (attachment: Attachment) => {
    const url = await getDownloadUrl(attachment.file_path);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    setDeletingId(attachment.id);
    try {
      await deleteFile(attachment);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5" />
          Allegati
          {attachments.length > 0 && (
            <span className="bg-muted text-muted-foreground rounded-full px-1.5 text-[10px] font-medium">
              {attachments.length}
            </span>
          )}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Paperclip className="w-3 h-3" />}
          Allega
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {isLoading ? (
        <div className="text-xs text-muted-foreground text-center py-2">Caricamento...</div>
      ) : attachments.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-3 italic">
          Nessun allegato
        </div>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/40 group hover:bg-muted/70 transition-colors"
            >
              {getFileIcon(att.content_type)}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{att.file_name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatFileSize(att.file_size)} · {format(new Date(att.created_at), 'd MMM', { locale: it })}
                </p>
              </div>
              <button
                onClick={() => handleDownload(att)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                title="Scarica"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(att)}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                title="Elimina"
                disabled={deletingId === att.id}
              >
                {deletingId === att.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
