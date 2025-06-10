// ThemeToggle.tsx
import React from 'react';
import { IconButton, useTheme } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useColorScheme } from '@mui/material/styles';

const ThemeToggle: React.FC = () => {
  const { mode, setMode } = useColorScheme();
  const theme = useTheme();

  const handleToggle = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  return (
    <IconButton
      onClick={handleToggle}
      color="inherit"
      sx={{
        bgcolor: theme.palette.background.default,
        '&:hover': {
          bgcolor: theme.palette.action.hover,
        },
      }}
    >
      {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
    </IconButton>
  );
};

export default ThemeToggle;