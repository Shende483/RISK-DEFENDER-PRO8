import type { Theme, SxProps, Breakpoint } from '@mui/material/styles';

import { useState } from 'react';

import Alert from '@mui/material/Alert';
import { Box, Link } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { Main } from './main';
import { NavMobile } from './nav';
import { layoutClasses } from '../classes';
import { navData } from '../config-nav-dashboard';
import { Iconify } from '../../../components/iconify';
import HeaderLogo from './header-core/header-components/header-logo';
import { Searchbar } from './header-core/header-components/searchbar';
import { _langs, _notifications } from '../../../_mock';
import { MenuButton } from './header-core/header-components/menu-button';
import { LayoutSection } from './layout-section';
import { HeaderSection } from './header-core/header-section';
import { AccountPopover } from './header-core/header-components/account-popover';
import { ThemeButton } from './header-core/header-components/theme-button';
import { NotificationsPopover } from './header-core/header-components/notifications-popover';

// ----------------------------------------------------------------------

export type DashboardLayoutProps = {
  sx?: SxProps<Theme>;
  children: React.ReactNode;
  header?: {
    sx?: SxProps<Theme>;
  };
};

export function DashboardLayout({ sx, children, header }: DashboardLayoutProps) {
  const theme = useTheme();

  const [navOpen, setNavOpen] = useState(false);

  const layoutQuery: Breakpoint = 'lg';

  return (
    <LayoutSection
      /** **************************************
       * Header
       *************************************** */
      headerSection={
        <HeaderSection
          layoutQuery={layoutQuery}
          slotProps={{
            container: {
              maxWidth: false,
              sx: { px: { [layoutQuery]: 5 } },
            },
          }}
          sx={header?.sx}
          slots={{
            topArea: (
              <Alert severity="info" sx={{ display: 'none', borderRadius: 0 }}>
                This is an info Alert.
              </Alert>
            ),
            leftArea: (
              <>
                <MenuButton
                  onClick={() => setNavOpen(true)}
                  sx={{
                    ml: -1,
                    [theme.breakpoints.up(layoutQuery)]: { display: 'none' },
                  }}
                />
                <NavMobile
                  data={navData}
                  open={navOpen}
                  onClose={() => setNavOpen(false)}

                />
              </>
            ),
            rightArea: (
              <Box width="100%" display="flex" alignItems="center" justifyContent="space-between">
                <HeaderLogo />
                <Box gap={1} display="flex" alignItems="center">
                  <Link href="/sign-in" border={1} p={1} borderRadius={1}>
                    Sign in
                  </Link>
                  <Searchbar />
                  <ThemeButton/>
                  <NotificationsPopover data={_notifications} />
                  <AccountPopover
                    data={[
                      {
                        label: 'Home',
                        href: '/',
                        icon: <Iconify width={22} icon="solar:home-angle-bold-duotone" />,
                      },
                      {
                        label: 'Profile Update',
                        href: '/profile',
                        icon: <Iconify width={22} icon="solar:shield-keyhole-bold-duotone" />,
                      },
                      {
                        label: 'Settings',
                        href: '/profile',
                        icon: <Iconify width={22} icon="solar:settings-bold-duotone" />,
                      },
                    ]}
                  />
                </Box>
              </Box>
            ),
          }}
        />
      }
      /** **************************************
       * Footer
       *************************************** */
      footerSection={null}
      /** **************************************
       * Style
       *************************************** */
      cssVars={{
        '--layout-nav-vertical-width': '300px',
        '--layout-dashboard-content-pt': theme.spacing(1),
        '--layout-dashboard-content-pb': theme.spacing(8),
        '--layout-dashboard-content-px': theme.spacing(5),
      }}
      sx={{
        [`& .${layoutClasses.hasSidebar}`]: {
          [theme.breakpoints.up(layoutQuery)]: {
            pl: 'var(--layout-nav-vertical-width)',
          },
        },
        ...sx,
      }}
    >
      <Main>{children}</Main>
    </LayoutSection>
  );
}
