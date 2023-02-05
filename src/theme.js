import { createTheme } from '@mui/material/styles';
import { Barlow } from '@next/font/google';
import NextLink from 'next/link';
import { forwardRef } from 'react';

const LinkBehaviour = forwardRef((props, ref) => {
  // eslint-disable-next-line react/jsx-filename-extension
  <NextLink ref={ref} {...props} />;
});
LinkBehaviour.displayName = 'Link';

export const barlow = Barlow({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'auto',
  fallback: ['Helvetica', 'Arial', 'sans-serif'],
});

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#769686',
    },
    secondary: {
      main: '#A52422',
    },
    background: {
      default: '#080F0F',
    },
  },
  typography: {
    fontFamily: barlow.style.fontFamily,
  },
  components: {
    MuiLink: {
      defaultProps: {
        component: LinkBehaviour,
      },
    },
    MuiButtonBase: {
      defaultProps: {
        LinkComponent: LinkBehaviour,
      },
    },
  },
});

export default theme;
