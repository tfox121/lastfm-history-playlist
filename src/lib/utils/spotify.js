/* eslint-disable camelcase */
import axios from 'axios';
import axiosRetry from 'axios-retry';

import isMobileDevice from './isMobileDevice';

const authEndpoint = 'https://accounts.spotify.com/api/token';

export const spotify = axios.create({
  baseURL: 'https://api.spotify.com/v1',
});

axiosRetry(spotify, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
});

// Credentials for obtaining album art
export const spotifyAuth = async () => {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
    client_secret: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET,
  });
  const res = await axios.post(authEndpoint, body, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return res.data.access_token;
};

// pkce.js

/**
 * Build a Spotify /authorize URL for the “Authorisation Code + PKCE” flow
 * and stash the code_verifier + state in sessionStorage for the callback step.
 */
export async function buildPkceAuthoriseUrl() {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_CALLBACK_URL; // e.g. https://localhost:3000/callback
  const scopes = [
    'streaming',
    'user-read-private',
    'user-read-email',
    'user-read-playback-state',
    'user-read-currently-playing',
    'user-modify-playback-state',
  ].join(' ');

  // --- helpers --------------------------------------------------------------
  const randomBytes = (length) => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return array;
  };

  const base64url = (buffer) =>
    btoa(String.fromCharCode(...new Uint8Array(buffer)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  // --------------------------------------------------------------------------

  // 1. Generate verifier (64 random bytes → 88‑char base64url string).
  const codeVerifier =
    sessionStorage.getItem('spotify_pkce_verifier') ??
    base64url(randomBytes(64));

  codeVerifier;
  // 2. Derive challenge (SHA‑256 → base64url).
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(codeVerifier),
  );
  const codeChallenge = base64url(digest);

  // 3. CSRF token.
  const state =
    sessionStorage.getItem('spotify_pkce_state') ?? base64url(randomBytes(16));

  // 4. Persist for the callback page.
  sessionStorage.setItem('spotify_pkce_verifier', codeVerifier);
  sessionStorage.setItem('spotify_pkce_state', state);

  // 5. Build the /authorize URL.
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scopes,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    state,
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export const initiateSpotifyWebPlayer = async (token) => {
  if (isMobileDevice()) {
    console.log('Web playback not supported on mobile devices');
  } else {
    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Monthly Music History',
        getOAuthToken: (cb) => {
          cb(token);
        },
        volume: 0.5,
      });

      // Error handling
      player.addListener('initialization_error', ({ message }) => {
        console.error(message);
      });
      player.addListener('authentication_error', ({ message }) => {
        console.error(message);
      });
      player.addListener('account_error', ({ message }) => {
        console.error(message);
      });
      player.addListener('playback_error', ({ message }) => {
        console.error(message);
      });

      // Playback status updates
      player.addListener('player_state_changed', (state) => {
        console.log(state);
      });

      // Ready
      player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
      });

      // Not Ready
      player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
      });

      // Connect to the player!
      player.connect();
    };
    const body = document.getElementsByTagName('body')[0];
    if (body) {
      const js = document.createElement('script');

      js.src = 'https://sdk.scdn.co/spotify-player.js';

      body.appendChild(js);
    }
  }
};

const getDeviceId = async (token) => {
  const response = await spotify.get('/me/player/devices', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.data.devices[0]) {
    return response.data.devices[0].id;
  }
  throw new Error('No devices found');
};

export const changeSpotifyMusic = async (uri, href, token) => {
  const deviceId = await getDeviceId(token);
  if (
    !deviceId &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    )
  ) {
    const start = new Date().getTime();

    window.location.href = uri;

    const end = new Date().getTime();

    if (end - start < 1) {
      window.open(href);
    }
  } else {
    try {
      await spotify.put(
        '/me/player/play',
        {
          uris: [uri],
          position_ms: 0,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            device_id: deviceId,
          },
        },
      );
    } catch (err) {
      if (err.response && err.response.status === 403) {
        throw new Error('Playback failed - do you have Spotify Premium?');
      } else {
        console.error(err);
        throw new Error('There was a problem playing through your account.');
      }
    }
  }
};

export const getSpotifyPlayingState = (token) =>
  spotify.get('/me/player/currently-playing', {
    headers: { Authorization: `Bearer ${token}` },
  });
