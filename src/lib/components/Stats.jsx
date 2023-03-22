import React from 'react';
import Typography from '@mui/material/Typography';

export default function Stats({ topTrackMonthsConcat }) {
  if (!topTrackMonthsConcat?.length) return null;
  const artists = topTrackMonthsConcat
    .map((month) => month.track[0]?.artist['#text'])
    .reduce((acc, curr) => {
      if (!acc[curr]) acc[curr] = 1;
      else acc[curr] += 1;
      return acc;
    }, {});

  const sortedArtists = Object.entries(artists)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return sortedArtists.map((artist) => (
    <Typography key={artist[0]} variant="subtitle2">
      {artist[0]} - {artist[1]}
    </Typography>
  ));
}
