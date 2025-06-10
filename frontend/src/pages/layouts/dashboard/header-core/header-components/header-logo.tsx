import type { Breakpoint } from '@mui/material';

import { useRef, useState, useEffect } from 'react';

import { Box, Typography } from '@mui/material';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';

import { NavDesktop } from '../../nav';
import { navData } from '../../../config-nav-dashboard';

export default function HeaderLogo() {
  const [open, setOpen] = useState(false);
  const layoutQuery: Breakpoint = 'lg';

  const dropRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropRef, setOpen]);

  return (
    <Box display="flex" alignItems="center" gap={3}>
      <Box>
        <Typography fontSize="23px" fontWeight="bold" color="#00b0ff">
          RiskDefenderAI
        </Typography>
      </Box>

      <Box
        border="1px solid black"
        pt="4px"
        px="4px"
        height="fit-content"
        borderRadius="7px"
        sx={{ cursor: 'pointer' }}
      >
        <MenuOutlinedIcon fontSize="medium" onClick={() => setOpen(!open)} />
      </Box>

      {open && (
        <Box ref={dropRef}>
          <NavDesktop data={navData} layoutQuery={layoutQuery} />
        </Box>
      )}
    </Box>
  );
}
