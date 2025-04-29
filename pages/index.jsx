import React, { useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import Typography from '@mui/material/Typography';
import Backdrop from '@mui/material/Backdrop';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import { useAsyncEffect } from 'rooks';
import InfiniteScroll from 'react-infinite-scroll-component';

import {
  getLastfmUser,
  getValidMonths,
  getMonthlyTopTracksPage,
  arrToChunks,
  isMobileDevice,
} from '@/src/lib/utils';
import { SpotifyAuthLink, SpotifyPlayer, Track } from '@/src/lib/components';
import { useSpotifyToken } from '@/src/lib/hooks';

import theme from '../src/theme';

export default function Home() {
  const router = useRouter();
  const [userName, setUserName] = useState('foxtrapper121');
  const [chunks, setChunks] = useState([]);
  const topTrackMonthsConcat = useRef(null);
  const { spotifyToken } = useSpotifyToken();

  const spotifyConfigured =
    process.env.NEXT_PUBLIC_CALLBACK_URL &&
    process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;

  if (!spotifyConfigured) {
    console.warn(
      'Spotify environment variables not set - features unavailable',
    );
  }

  const {
    isLoading: isLoadingUser,
    error: errorUser,
    data: user,
  } = useQuery({
    queryKey: [('userData', userName)],
    queryFn: () => getLastfmUser(userName),
  });

  const {
    isLoading: isLoadingTopTrackMonths,
    error: errorTopTrackMonths,
    data: topTrackMonths,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['topTrackData', user?.name, chunks],
    queryFn: ({ pageParam = 0 }) =>
      getMonthlyTopTracksPage({ user, chunks, pageParam }),
    getNextPageParam: (lastPage) => lastPage?.next,
    useErrorBoundary: true,
  });

  useAsyncEffect(async () => {
    if (!user) return;
    const monthPeriods = await getValidMonths(user);
    setChunks(arrToChunks(monthPeriods, 14));
  }, [user]);

  if (errorUser || errorTopTrackMonths) {
    return (
      <Backdrop sx={{ color: '#fff', zIndex: 1 }} open>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Typography>An error occurred, please reload.</Typography>
          <Button
            onClick={() => router.reload(window.location.pathname)}
            sx={{ width: 'fit-content' }}
          >
            Reload
          </Button>
        </Box>
      </Backdrop>
    );
  }

  topTrackMonthsConcat.current = topTrackMonths?.pages?.reduce(
    (acc, curr) => acc.concat(curr?.data ?? []),
    [],
  );

  const headingHeight = 4;
  const headingWidthRatio = 3.46698113;

  return (
    <>
      <Head>
        <title>Top Track Time Warp</title>
        <meta name="description" content="Top Track Time Warp" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        {spotifyConfigured && !spotifyToken && !isMobileDevice() && (
          <Box
            width="100%"
            height="1.5em"
            bgcolor="#1DB954"
            display="flex"
            justifyContent="center"
            alignItems="center"
            position="sticky"
            top={0}
            zIndex={2}
          >
            <Typography variant="caption">
              <SpotifyAuthLink>Login to Spotify</SpotifyAuthLink> to play tracks
              and create playlists
            </Typography>
          </Box>
        )}
        <Container maxWidth="md">
          <Box py={2}>
            <Box
              width={`${headingHeight * headingWidthRatio}em`}
              height={`${headingHeight}em`}
              position="relative"
            >
              <Image
                alt="Top Track Time Warp"
                src="/TopTrackTimeWarpTspt.png"
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </Box>
            <form
              onSubmit={(evt) => {
                evt.preventDefault();
                setUserName(evt.target[0].value);
              }}
            >
              <TextField
                fullWidth
                sx={{
                  my: 2,
                }}
                // value={userName}
                // onChange={(evt) => setUserName(evt.target.value)}
                label="Last.fm username"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="submit"
                        aria-label="load user's tracks"
                        edge="end"
                      >
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {/* <Stats topTrackMonthsConcat={topTrackMonthsConcat.current} /> */}
            </form>
            {isLoadingUser || isLoadingTopTrackMonths ? (
              <div>
                <Backdrop
                  sx={{
                    color: '#fff',
                    zIndex: theme.zIndex.drawer + 1,
                  }}
                  open
                >
                  <CircularProgress color="inherit" />
                </Backdrop>
              </div>
            ) : (
              <InfiniteScroll
                dataLength={topTrackMonthsConcat.current?.length}
                next={fetchNextPage}
                hasMore={!!topTrackMonths.pages.at(-1)?.next}
                loader={
                  <Typography variant="subtitle1" textAlign="center">
                    Loading...
                  </Typography>
                }
                endMessage={
                  <Typography variant="subtitle1" textAlign="center">
                    This is the beginning of your Last.fm history
                  </Typography>
                }
              >
                <Grid container rowSpacing={1} columnSpacing={{ xs: 1 }}>
                  {topTrackMonths?.pages[0]?.data &&
                    topTrackMonthsConcat.current?.map((month) => (
                      <Track key={month['@attr'].from} month={month} />
                    ))}
                </Grid>
              </InfiniteScroll>
            )}
          </Box>
        </Container>
        {spotifyToken && <SpotifyPlayer />}
      </main>
    </>
  );
}
