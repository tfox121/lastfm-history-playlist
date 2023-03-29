import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import { format } from 'date-fns';
import { useEffectOnceWhen } from 'rooks';

import theme from '../../theme';
import { spotify, spotifyAuth } from '../utils';
import TrackImage from './TrackImage';

export default function Track({ month }) {
  const [track, setTrack] = useState(null);
  const { data: spotifyToken } = useQuery(['spotifyAuthToken'], () =>
    spotifyAuth(),
  );
  const dateFromUnix = new Date(Number(month['@attr'].from) * 1000);
  const formattedDate = format(dateFromUnix, 'MMMM Y');

  const topTrack = month.track[0];

  const query = `track:${encodeURIComponent(
    month.track[0].name,
  )}%20artist:${encodeURIComponent(
    month.track[0].artist['#text'],
  )}&type=track&limit=1`;

  useEffectOnceWhen(() => {
    spotify
      .get(`/search?q=${query}`, {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      })
      .then(({ data }) => {
        setTrack(data.tracks.items[0]);
      })
      .catch(() => {
        console.warn(
          `Cannot find artwork for ${month.track[0].name} by ${month.track[0].artist['#text']}`,
        );
      });
  }, !!spotifyToken);

  if (!topTrack) return null;

  return (
    <>
      <Grid item xs={1}>
        <TrackImage
          track={track}
          fallbackArt={topTrack.image[2]['#text']}
          interactive
        />
      </Grid>
      <Grid item xs={11}>
        <Box height="100%" display="flex" alignItems="center">
          <Box>
            <Typography variant="subtitle2" color="primary">
              {formattedDate}
            </Typography>
            <Link
              href={topTrack.url}
              variant="p"
              underline="hover"
              target="_blank"
              sx={{
                textDecorationColor: theme.palette.secondary.contrastText,
                color: theme.palette.secondary.contrastText,
              }}
            >
              {topTrack.name} - {topTrack.artist['#text']}
            </Link>
          </Box>
        </Box>
      </Grid>
    </>
  );
}
