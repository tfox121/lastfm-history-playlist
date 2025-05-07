import axios from 'axios';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffectOnceWhen, useLocalstorageState } from 'rooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { initiateSpotifyWebPlayer } from '@/src/lib/utils';
import theme from '@/src/theme';

// Fixes: Hydration failed because the initial UI does not match what was rendered on the server.
const SpotifyTokenProvider = dynamic(
  () => import('../src/lib/hooks').then((mod) => mod.SpotifyTokenProvider),
  {
    ssr: false,
  },
);

export default function App({ Component, pageProps }) {
  const { push, query } = useRouter();

  const [spotifyToken, setSpotifyToken] = useLocalstorageState(
    'lastfm-top-tracks:spotify-token',
    '',
  );
  const [spotifyRefreshToken, setSpotifyRefreshToken] = useLocalstorageState(
    'lastfm-top-tracks:spotify-refresh-token',
    '',
  );
  const [tokenTimeout, setTokenTimeout] = useLocalstorageState(
    'lastfm-top-tracks:spotify-token-timeout',
    0,
  );
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnmount: false,
        refetchOnReconnect: false,
        retry: false,
        staleTime: 5 * 60 * 1000,
      },
    },
  });

  useEffect(() => {
    // only run when we've got a code+state and no token yet
    if (!spotifyToken && query.code && query.state) {
      const storedState = sessionStorage.getItem('spotify_pkce_state');
      if (query.state !== storedState) {
        push('/', undefined, { shallow: true });
        return;
      }

      const codeVerifier = sessionStorage.getItem('spotify_pkce_verifier');
      const body = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
        grant_type: 'authorization_code',
        code: query.code,
        redirect_uri: window.location.origin + '/',
        code_verifier: codeVerifier,
      }).toString();

      // wrap everything in an async IIFE with try/catch
      (async () => {
        try {
          const res = await axios.post(
            'https://accounts.spotify.com/api/token',
            body,
            {
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            },
          );
          const { access_token, refresh_token, expires_in } = res.data;

          setSpotifyToken(access_token);
          setSpotifyRefreshToken(refresh_token);
          // TODO: Create refresh flow
          setTokenTimeout(Date.now() + expires_in * 1000);

          push('/', undefined, { shallow: true });
        } catch (err) {
          // **this catch** will swallow the 400 and prevent a runtime crash
          console.error('Token exchange failed', err.response?.data || err);
          // optionally show a user‑friendly message, or push back to “retry”
        }
      })();
    }
  }, [query, spotifyToken, push]);

  useEffectOnceWhen(() => {
    initiateSpotifyWebPlayer(spotifyToken);
  }, spotifyToken);

  useEffect(() => {
    let timeout;
    if (tokenTimeout) {
      const now = new Date();
      const timeLeft = tokenTimeout - now.getTime();
      timeout = setTimeout(() => {
        setSpotifyToken('');
        setTokenTimeout(0);
      }, timeLeft);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [setSpotifyToken, setTokenTimeout, tokenTimeout]);

  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <SpotifyTokenProvider
          spotifyToken={spotifyToken}
          setSpotifyToken={setSpotifyToken}
        >
          <CssBaseline />
          <Component {...pageProps} />
        </SpotifyTokenProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
