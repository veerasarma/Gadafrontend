import { useAuthHeader } from '@/hooks/useAuthHeader';
const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export interface Story {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  stories: { id: string; url: string; type: 'image'|'video'; createdAt: string }[];
}

// fetch active stories
export async function fetchStories(headers): Promise<Story[]> {
    const res = await fetch(
        `${API_BASE_URL}/api/stories`,
        {
          method: 'GET',           // GET is the default, so this line is optional
          credentials: 'include',  // if you need to send cookies
          headers: headers
        }
      );
//   const res = await fetch(`${API_BASE_URL}/api/stories`,{'headers':headers});
  if (!res.ok) throw new Error('Could not load stories');
  return res.json();
}

// upload a new story
export async function uploadStory(
  file: File,
  headers: Record<string,string>
): Promise<{ id: string; url: string; type: string }> {
  const form = new FormData();
  form.append('media', file);
  const res = await fetch(`${API_BASE_URL}/api/stories`, {
    method: 'POST',
    credentials: 'include',
    headers, // only auth header
    body: form
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}
