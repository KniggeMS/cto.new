import { extendTheme } from 'native-base';

export const colors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764',
  },
};

export const theme = extendTheme({
  colors: {
    ...colors,
    brand: colors.primary,
  },
  config: {
    useSystemColorMode: false,
    initialColorMode: 'light',
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'primary',
      },
      variants: {
        solid: ({ colorScheme }: { colorScheme: string }) => ({
          bg: `${colorScheme}.600`,
          _pressed: {
            bg: `${colorScheme}.700`,
          },
        }),
      },
    },
    Input: {
      defaultProps: {
        size: 'lg',
      },
      variants: {
        outline: {
          borderColor: 'gray.300',
          _focus: {
            borderColor: 'primary.500',
            bg: 'white',
          },
        },
      },
    },
  },
  fontConfig: {
    Roboto: {
      100: {
        normal: 'Roboto-Light',
      },
      300: {
        normal: 'Roboto-Light',
      },
      400: {
        normal: 'Roboto-Regular',
      },
      500: {
        normal: 'Roboto-Medium',
      },
      700: {
        normal: 'Roboto-Bold',
      },
    },
  },
  fonts: {
    heading: 'Roboto',
    body: 'Roboto',
    mono: 'Roboto',
  },
});

export type Theme = typeof theme;
