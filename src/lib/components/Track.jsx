import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import { format } from 'date-fns';

import theme from '../../theme';
import { spotify, spotifyAuth } from '../utils';
import TrackImage from './TrackImage';

export default function Track({ month }) {
  const track = useRef(null);
  const { data: spotifyToken } = useQuery(['spotifyAuthToken'], () =>
    spotifyAuth(),
  );
  const dateFromUnix = new Date(Number(month['@attr'].from) * 1000);
  const formattedDate = format(dateFromUnix, 'MMMM Y');

  const topTrack = month.track[0];
  if (!topTrack) return null;

  const query = `track:${encodeURIComponent(
    month.track[0].name,
  )}%20artist:${encodeURIComponent(
    month.track[0].artist['#text'],
  )}&type=track&limit=1`;

  spotify
    .get(`/search?q=${query}`, {
      headers: { Authorization: `Bearer ${spotifyToken}` },
    })
    .then(({ data }) => {
      [track.current] = data.tracks.items;
    })
    .catch(() => {
      console.warn(
        `Cannot find artwork for ${month.track[0].name} by ${month.track[0].artist['#text']}`,
      );
    });

  return (
    <>
      <Grid item xs={1}>
        <TrackImage
          track={track.current}
          fallbackArt={month.track[0].image[2]['#text']}
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
              href={month.track[0].url}
              variant="p"
              underline="hover"
              target="_blank"
              sx={{
                textDecorationColor: theme.palette.secondary.contrastText,
                color: theme.palette.secondary.contrastText,
              }}
            >
              {month.track[0].name} - {month.track[0].artist['#text']}
            </Link>
          </Box>
        </Box>
      </Grid>
    </>
  );
}
