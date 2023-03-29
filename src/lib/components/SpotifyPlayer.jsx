/* eslint-disable camelcase */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';

import {
  getSpotifyPlayingState,
  millisecondsToMinsAndSecs,
  spotify,
} from '../utils';
import TrackImage from './TrackImage';
import { useSpotifyToken } from '../hooks';

export default function SpotifyPlayer() {
  const router = useRouter();
  const { spotifyToken, setSpotifyToken } = useSpotifyToken();
  const [isPlaying, setIsPlaying] = useState('Paused');
  const [progressMs, setProgressMs] = useState(0);
  const [mediaItem, setMediaItem] = useState({
    album: { images: [{ url: '' }] },
    name: '',
    artists: [{ name: '' }],
    duration_ms: 0,
  });

  useEffect(() => {
    const getCurrentlyPlaying = async () => {
      try {
        const response = await getSpotifyPlayingState(spotifyToken);
        const { item, is_playing, progress_ms } = response.data;
        setMediaItem(item);
        if (is_playing !== isPlaying) setIsPlaying(is_playing);
        setProgressMs(progress_ms);
      } catch (err) {
        console.error(err);
        if (err.response.data.error.message === 'The access token expired') {
          setSpotifyToken('');
        }
      }
    };

    let checkInterval;
    if (spotifyToken) {
      checkInterval = setInterval(getCurrentlyPlaying, 1000);
    }
    if (!spotifyToken && checkInterval) {
      clearInterval(checkInterval);
    }
    return () => {
      clearInterval(checkInterval);
    };
  }, [spotifyToken, setSpotifyToken, router, isPlaying]);

  if (!mediaItem || !mediaItem.name) {
    return null;
  }

  const progressBarStyles = {
    height: '4px',
    width: `50%`,
    borderRadius: '2px',
  };

  // const progressBarStyles = {
  //   // ,
  // };

  const skip = (direction) => {
    spotify.post(
      `/me/player/${direction}`,
      {},
      {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      },
    );
  };

  const playPause = () => {
    let action = 'play';
    if (isPlaying === true) {
      action = 'pause';
    }
    setIsPlaying(!isPlaying);
    spotify
      .put(
        `/me/player/${action}`,
        {},
        {
          headers: { Authorization: `Bearer ${spotifyToken}` },
        },
      )
      .catch(() => {
        console.error('Failed to change playing state');
        setIsPlaying(!isPlaying);
      });
  };

  const playOrPauseIcon = (playing) => {
    if (playing === true) {
      return <PauseCircleFilledIcon fontSize="large" onClick={playPause} />;
    }
    return <PlayCircleFilledIcon fontSize="large" onClick={playPause} />;
  };

  return (
    <Box
      textAlign="center"
      height="5.5em"
      bgcolor="#181818"
      px={2}
      position="sticky"
      bottom={0}
      left={0}
    >
      <Grid container height="100%" columns={10}>
        <Grid
          item
          xs={3}
          display="flex"
          justifyContent="flex-start"
          alignItems="center"
        >
          <TrackImage track={mediaItem} />
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="start"
            mx={1.75}
          >
            <Typography fontWeight="500">{mediaItem.name}</Typography>
            <Typography fontWeight="200" fontSize="0.75em">
              {mediaItem.artists[0].name}
            </Typography>
          </Box>
        </Grid>
        <Grid
          item
          xs={4}
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
        >
          <Box display="flex" alignItems="center" mb={1}>
            <SkipPreviousIcon onClick={() => skip('previous')} />
            {playOrPauseIcon(isPlaying)}
            <SkipNextIcon onClick={() => skip('next')} />
          </Box>
          <Box
            width="100%"
            display="flex"
            justifyContent="space-between"
            gap="0.5em"
            alignItems="center"
          >
            <Typography
              fontWeight="200"
              fontSize="0.75em"
              minWidth={40}
              textAlign="right"
            >
              {millisecondsToMinsAndSecs(progressMs)}
            </Typography>
            <Box width="100%" position="relative">
              <Box
                sx={{
                  ...progressBarStyles,
                  backgroundColor: '#fff',
                  width: `${(progressMs * 100) / mediaItem.duration_ms}%`,
                }}
              />
              <Box
                sx={{
                  ...progressBarStyles,
                  backgroundColor: 'hsla(0,0%,100%,.3)',
                  width: `100%`,
                  position: 'absolute',
                  top: 0,
                }}
              />
            </Box>
            <Typography
              fontWeight="200"
              fontSize="0.75em"
              minWidth={40}
              textAlign="left"
            >
              {millisecondsToMinsAndSecs(mediaItem.duration_ms)}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={3} />
      </Grid>
    </Box>
  );
}
