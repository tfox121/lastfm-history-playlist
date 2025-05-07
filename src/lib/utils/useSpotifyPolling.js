import { useEffect, useRef } from 'react';
import { getSpotifyPlayingState } from './spotify';

export default function useSpotifyPolling({
  spotifyToken,
  setSpotifyToken,
  setMediaItem,
  setIsPlaying,
  setProgressMs,
}) {
  const intervalRef = useRef(null);
  const failureRef = useRef(0); // consecutive‑failure counter

  useEffect(() => {
    if (!spotifyToken) return;

    const poll = async () => {
      try {
        const { data } = await getSpotifyPlayingState(spotifyToken);

        const { item, is_playing, progress_ms } = data;
        setMediaItem(item);
        setIsPlaying(is_playing);
        setProgressMs(progress_ms);

        failureRef.current = 0; // success ⇒ reset counter
      } catch (err) {
        console.error(err);
        failureRef.current += 1; // count the failure

        if (failureRef.current >= 2 && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        if (
          err?.response?.data?.error?.message === 'The access token expired'
        ) {
          setSpotifyToken('');
        }
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [
    intervalRef,
    setIsPlaying,
    setMediaItem,
    setProgressMs,
    setSpotifyToken,
    spotifyToken,
  ]);
}
