import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useDidMount, useLocalstorageState } from 'rooks';
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
  const { asPath, push } = useRouter();
  const hash = asPath.split('#')[1];

  const [spotifyToken, setSpotifyToken] = useLocalstorageState(
    'lastfm-top-tracks:spotify-token',
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

  useDidMount(() => {
    if (hash && hash !== spotifyToken) {
      const accessToken = hash.slice(1).split('&')[0].split('=')[1];
      setSpotifyToken(accessToken);

      const timeout = new Date();
      timeout.setHours(timeout.getHours() + 1);
      setTokenTimeout(timeout.getTime());

      push('/', undefined, { shallow: true });
    }
    if (spotifyToken) {
      initiateSpotifyWebPlayer(spotifyToken);
    }
  }, [hash, push, setSpotifyToken, setTokenTimeout, spotifyToken]);

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
