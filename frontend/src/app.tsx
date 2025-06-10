import 'src/global.css';

import Fab from '@mui/material/Fab';

import { Router } from './routes/sections';

import { ThemeProvider } from './theme/theme-provider';
import { useScrollToTop } from './hooks/use-scroll-to-top';

// ----------------------------------------------------------------------

export default function App() {
  useScrollToTop();

  const githubButton = (
    <Fab>
      
    </Fab>
  );

  return (
    <ThemeProvider>
      <Router />
    </ThemeProvider>
  );
}
