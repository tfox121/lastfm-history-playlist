import { createContext, useContext, useMemo } from 'react';

const SpotifyTokenContext = createContext();

export function SpotifyTokenProvider({
  children,
  spotifyToken,
  setSpotifyToken,
}) {
  const context = useMemo(
    () => ({ spotifyToken, setSpotifyToken }),
    [spotifyToken, setSpotifyToken],
  );

  return (
    <SpotifyTokenContext.Provider value={context}>
      {children}
    </SpotifyTokenContext.Provider>
  );
}

export function useSpotifyToken() {
  return useContext(SpotifyTokenContext);
}
