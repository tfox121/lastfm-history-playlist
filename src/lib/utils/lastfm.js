import { subMonths } from 'date-fns/fp';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
import axios from 'axios';
import axiosRetry from 'axios-retry';

const subOneMonth = subMonths(1);

export const lastfm = axios.create({
  baseURL: 'https://ws.audioscrobbler.com/2.0',
  params: {
    api_key: process.env.NEXT_PUBLIC_LASTFM_API,
    format: 'json',
  },
});

axiosRetry(lastfm, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
});

export const getLastfmUser = async (user) => {
  if (!user) return null;
  const { data } = await lastfm.get('/', {
    params: {
      user,
      method: 'user.getInfo',
      api_key: process.env.NEXT_PUBLIC_LASTFM_API,
      format: 'json',
    },
  });
  return data.user;
};

export const getValidMonths = async (user) => {
  const registeredDate = Number(user.registered.unixtime);

  const {
    data: { weeklychartlist: charts },
  } = await lastfm.get('/', {
    params: {
      user,
      method: 'user.getWeeklyChartList',
      api_key: process.env.NEXT_PUBLIC_LASTFM_API,
      format: 'json',
    },
  });

  const latestChartEndDate = new Date(charts.chart.slice(-1)[0].to * 1000);

  let monthStart = startOfMonth(subOneMonth(latestChartEndDate));
  let monthEnd = endOfMonth(monthStart);
  const monthPeriods = [];

  while (registeredDate < monthStart.getTime() / 1000) {
    monthPeriods.push({
      from: monthStart.getTime() / 1000,
      to: (monthEnd.getTime() + 1) / 1000,
    });
    monthStart = subOneMonth(monthStart);
    monthEnd = endOfMonth(subOneMonth(monthEnd));
  }

  return monthPeriods;
};

export const getTopTracksByMonth = async (user, from, to) => {
  const {
    data: { weeklytrackchart: topTracks },
  } = await lastfm.get('/', {
    params: {
      user: user.name,
      from,
      to,
      method: 'user.getWeeklyTrackChart',
      api_key: process.env.NEXT_PUBLIC_LASTFM_API,
      format: 'json',
    },
  });

  return topTracks;
};

export const monthlyTopTracks = async (user) => {
  if (!user) return null;

  const monthPeriods = await getValidMonths(user);

  return Promise.all(
    monthPeriods.map(async ({ from, to }) =>
      getTopTracksByMonth(user, from, to),
    ),
  );
};

export const getMonthlyTopTracksPage = async ({
  user,
  chunks,
  pageParam = 0,
}) => {
  if (!user || !chunks.length) return null;
  const data = await Promise.all(
    chunks[pageParam].map(async ({ from, to }) =>
      getTopTracksByMonth(user, from, to),
    ),
  );

  return { data, next: chunks.length > pageParam + 1 ? pageParam + 1 : null };
};
