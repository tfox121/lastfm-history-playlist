import axios from 'axios';
import axiosRetry from 'axios-retry';

export const spotify = axios.create({
  baseURL: 'https://api.spotify.com/v1',
});

axiosRetry(spotify, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
});

export const spotifyAuth = async () => {
  const authEndpoint = 'https://accounts.spotify.com/api/token';
  const authString = `${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}:${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET}`;
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
