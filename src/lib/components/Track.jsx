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
  const { data: spotifyToken } = useQuery({
    queryKey: ['spotifyAuthToken'],
    queryFn: spotifyAuth,
  });
  const dateFromUnix = new Date(Number(month['@attr'].from) * 1000);
  const formattedDate = format(dateFromUnix, 'MMMM Y');

  const topTrack = month.track[0];

  useEffectOnceWhen(() => {
    const query = `track:${encodeURIComponent(
      topTrack.name,
    )}%20artist:${encodeURIComponent(
      topTrack.artist['#text'],
    )}&type=track&limit=1`;

    spotify
      .get(`/search?q=${query}`, {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      })
      .then(({ data }) => {
        setTrack(data.tracks.items[0]);
      })
      .catch(() => {
        console.warn(
          `Cannot find artwork for ${topTrack.name} by ${topTrack.artist['#text']}`,
        );
      });
  }, !!spotifyToken && !!topTrack);

  if (!topTrack) return null;

  return (
    <>
      <Grid size={{ xs: 'auto' }}>
        <TrackImage
          track={track}
          fallbackArt={topTrack.image[2]['#text']}
          interactive
        />
      </Grid>
      <Grid size={{ xs: 9, sm: 11 }}>
        <Box height="100%" display="flex" alignItems="center">
          <Box>
            <Typography
              variant="subtitle2"
              color="primary"
              sx={{
                '@media (max-width:400px)': {
                  fontSize: '0.7rem',
                },
              }}
            >
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
              <Typography
                sx={{
                  '@media (max-width:400px)': {
                    fontSize: '0.85rem',
                  },
                  maxHeight: '3em',
                }}
              >
                {topTrack.name} - {topTrack.artist['#text']}
              </Typography>
            </Link>
          </Box>
        </Box>
      </Grid>
    </>
  );
}
