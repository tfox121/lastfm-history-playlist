/* eslint-disable camelcase */
import axios from 'axios';
import axiosRetry from 'axios-retry';

const authEndpoint = 'https://accounts.spotify.com/api/token';
const authString = `${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}:${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET}`;

export const spotify = axios.create({
  baseURL: 'https://api.spotify.com/v1',
});

axiosRetry(spotify, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
});

// Credentials for obtaining album art
export const spotifyAuth = async () => {
  const authorisation = Buffer.from(authString).toString('base64');

  const res = await axios.post(
    authEndpoint,
    {
      grant_type: 'client_credentials',
    },
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${authorisation}`,
      },
    },
  );

  return res.data.access_token;
};

export const initiateSpotifyWebPlayer = async (token) => {
  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    )
  ) {
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
      // player.addListener('player_state_changed', (state) => {
      //    console.log(state);
      // });

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
    params: {
      market: 'from_token',
    },
  });
