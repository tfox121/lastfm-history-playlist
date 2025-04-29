import React, { useEffect, useState } from 'react';
import Link from '@mui/material/Link';
import { buildPkceAuthoriseUrl } from '../utils';

export default function SpotifyAuthLink({ children }) {
  const [auth_url, set_auth_url] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // don’t run during SSR – window is undefined there
      if (typeof window === 'undefined') return;

      const url = await buildPkceAuthoriseUrl();
      if (!cancelled) set_auth_url(url);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link color="#fff" href={auth_url ?? '#'}>
      {children}
    </Link>
  );
}
