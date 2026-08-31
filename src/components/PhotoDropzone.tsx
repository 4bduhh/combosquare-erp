import { useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UploadCloud, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface PhotoDropzoneProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function PhotoDropzone({ value, onChange, label = 'Photo' }: PhotoDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File) => {
    setError(null);

    if (!ALLOWED.includes(file.type)) {
      setError('Please use JPG, PNG, WebP, or GIF.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File is too large. Maximum 2 MB.');
      return;
    }

    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const ext = file.name.split('.').pop() ?? 'png';
      const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('employee-photos')
        .upload(filePath, file, { contentType: file.type, upsert: false });

      if (upErr) throw upErr;

      const { data: urlData } = await supabase.storage
        .from('employee-photos')
        .getPublicUrl(filePath);

      onChange(urlData.publicUrl);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }, [upload]);

  const handleSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  }, [upload]);

  const clear = useCallback(() => onChange(''), [onChange]);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[#4B2A87]">{label}</span>
      {value ? (
        <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-[#E8E5F0] group">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={clear}
            className="absolute top-1 right-1 p-1 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
            dragging
              ? 'border-[#7653B8] bg-[#7653B8]/5'
              : 'border-[#D5D0E5] bg-[#F8F7FC] hover:border-[#C4B5FD] hover:bg-[#F0EEF8]'
          }`}
        >
          {uploading ? (
            <Loader2 className="animate-spin text-[#7653B8]" size={28} />
          ) : (
            <>
              <UploadCloud className="text-[#9B95A8]" size={28} />
              <p className="text-sm text-[#6B6580]">Drag & drop or click to upload</p>
              <p className="text-xs text-[#9B95A8]">JPG, PNG, WebP — max 2 MB</p>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleSelect}
        className="hidden"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {value && (
        <button type="button" onClick={() => inputRef.current?.click()} className="text-xs text-[#7653B8] hover:underline flex items-center gap-1 w-fit">
          <ImageIcon size={12} /> Change photo
        </button>
      )}
    </div>
  );
}
