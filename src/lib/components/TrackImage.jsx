import React, { useState } from 'react';
import Image from 'next/image';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { changeSpotifyMusic } from '../utils';
import { useSpotifyToken } from '../hooks';

export default function TrackImage({ track, fallbackArt, interactive }) {
  const { spotifyToken } = useSpotifyToken();
  const [displayPlayIcon, setDisplayPlayIcon] = useState(false);
  const dimensions = 50;

  const handlePlay = () => {
    changeSpotifyMusic(track.uri, track.external_urls.spotify, spotifyToken);
  };

  return (
    <Box
      position="relative"
      width={dimensions}
      height={dimensions}
      onMouseOver={() => setDisplayPlayIcon(true)}
      onMouseOut={() => setDisplayPlayIcon(false)}
      sx={{
        '@media (max-width:400px)': {
          width: '65px',
          height: '65px',
        },
      }}
    >
      <Image
        alt="track image"
        src={track?.album?.images[1].url || fallbackArt}
        sizes="100%"
        fill
      />
      {interactive && displayPlayIcon && (
        <Box
          position="absolute"
          zIndex={2}
          width="100%"
          height="100%"
          display="flex"
          justifyContent="center"
          alignItems="center"
          sx={{
            opacity: '90%',
          }}
        >
          <IconButton onClick={handlePlay}>
            <PlayArrowIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}
