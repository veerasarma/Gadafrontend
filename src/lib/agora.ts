import AgoraRTC, { ILocalAudioTrack, ILocalVideoTrack, IRemoteVideoTrack, IRemoteAudioTrack } from "agora-rtc-sdk-ng";

export type AgoraTracks = {
  mic?: ILocalAudioTrack | null;
  cam?: ILocalVideoTrack | null;
};

export function createClient() {
  return AgoraRTC.createClient({ mode: "live", codec: "vp8" });
}

export async function createLocalTracks(): Promise<AgoraTracks> {
  const mic = await AgoraRTC.createMicrophoneAudioTrack();
  const cam = await AgoraRTC.createCameraVideoTrack();
  return { mic, cam };
}

export function stopTracks(tracks?: AgoraTracks) {
  try { tracks?.mic?.stop(); tracks?.mic?.close(); } catch {}
  try { tracks?.cam?.stop(); tracks?.cam?.close(); } catch {}
}
