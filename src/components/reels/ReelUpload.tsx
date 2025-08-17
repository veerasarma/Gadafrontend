import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
  onSelected: (file: File, previewUrl: string, durationSec?: number) => void;
};

export default function ReelUpload({ onSelected }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const pick = () => inputRef.current?.click();

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['video/mp4','video/webm','video/quicktime'].includes(f.type)) {
      setError('Only MP4, WEBM or MOV allowed'); return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError('Max 50MB'); return;
    }
    setError(null);
    const url = URL.createObjectURL(f);
    // get duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;
    video.onloadedmetadata = () => {
      const d = Math.round(video.duration || 0);
      onSelected(f, url, d);
    };
  };

  return (
    <div className="border-2 border-dashed rounded-xl p-6 text-center bg-white">
      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={onChange} />
      <p className="text-gray-600 mb-3">Upload reel (9:16, up to 90s / 50MB)</p>
      <Button onClick={pick}>Add video</Button>
      {error && <p className="text-red-600 mt-3 text-sm">{error}</p>}
    </div>
  );
}
