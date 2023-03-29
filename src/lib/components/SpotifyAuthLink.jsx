import React from 'react';
import Link from '@mui/material/Link';

export default function SpotifyAuthLink({ children }) {
  const url = `https://accounts.spotify.com/authorize?client_id=${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=${process.env.NEXT_PUBLIC_CALLBACK_URL}&scope=streaming%20user-read-playback-state%20user-modify-playback-state%20user-read-currently-playing%20user-read-email%20user-read-private`;

  return (
    <Link color="#fff" href={url}>
      {children}
    </Link>
  );
}
