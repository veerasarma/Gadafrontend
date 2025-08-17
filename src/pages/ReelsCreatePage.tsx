import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import Sidebar from '@/components/ui/Sidebar1';
import ReelUpload from '@/components/reels/ReelUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader,useAuthHeaderupload } from '@/hooks/useAuthHeader';
import { uploadReelVideo, createReel } from '@/services/reelService';

export default function ReelsCreatePage() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headers1 = useAuthHeaderupload(accessToken);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [duration, setDuration] = useState<number | undefined>();
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSelected = (f: File, url: string, d?: number) => {
    setFile(f); setPreview(url); setDuration(d);
  };

  const submit = async () => {
    if (!file) return;
    setSubmitting(true);
    try {
      const  url  = await uploadReelVideo(file, headers1);
      console.log(url,'urlurlurlurl')
      await createReel({ videoUrl: url, caption }, headers);
      window.location.href = '/reels'; // go to feed
    } catch (e) {
      console.error(e);
      // alert('Failed to create reel');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="flex flex-col h-screen bg-cus">
      <Navbar />
      <div className="flex flex-1 overflow-hidden px-4 lg:px-8 py-6">
        <div className="flex flex-1 max-w-[1600px] w-full mx-auto gap-6">
          <aside className="hidden lg:block lg:w-1/5">
            <div className="sticky top-16"><Sidebar /></div>
          </aside>

          <main className="flex-1 flex flex-col overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <ReelUpload onSelected={onSelected} />
                <div className="mt-4">
                  <label className="block text-sm text-gray-600 mb-1">Caption</label>
                  <Input value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Say something…" />
                </div>
                <Button onClick={submit} disabled={!file || submitting} className="mt-4 w-full">
                  {submitting ? 'Uploading…' : 'Next'}
                </Button>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl p-4">
                  <div className="font-semibold mb-2">Preview</div>
                  <div className="flex items-center justify-center bg-gray-100 rounded-xl min-h-[420px]">
                    {preview ? (
                      <video src={preview} className="max-h-[80vh] aspect-[9/16]" controls playsInline />
                    ) : (
                      <div className="text-gray-500">Upload your video to see preview here.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}
