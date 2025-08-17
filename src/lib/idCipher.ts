// src/lib/idCipher.ts
import Hashids from 'hashids';
const hashids = new Hashids(import.meta.env.VITE_HASHID_SALT, 10);

// encode for URL
export const encodeId = (id: number) => hashids.encode(id);

// decode if you ever need the raw number on client
export const decodeId = (hash: string) => {
  const arr = hashids.decode(hash);
  if (!arr.length) throw new Error('Invalid ID');
  return arr[0];
};
