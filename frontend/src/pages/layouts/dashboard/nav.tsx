import { Fragment, useEffect, useState } from 'react';
import type { Breakpoint, SxProps, Theme } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import { Box, Collapse, Drawer, IconButton, ListItem, ListItemButton, drawerClasses } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { usePathname } from '../../../routes/hooks';
import { RouterLink } from '../../../routes/components';
import { Scrollbar } from '../../../components/scrollbar';
import { bgBlur, varAlpha } from '../../../theme/styles';

export type NavContentProps = {
  data: {
    path: string;
    title: string;
    icon: React.ReactNode;
    info?: React.ReactNode;
    subItems?: {
      path: string;
      title: string;
      icon: React.ReactNode;
    }[];
  }[];
  slots?: {
    topArea?: React.ReactNode;
    bottomArea?: React.ReactNode;
  };
  sx?: SxProps<Theme>;
};

export function NavDesktop({
  sx,
  data,
  slots,
  layoutQuery,
}: NavContentProps & { layoutQuery: Breakpoint }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        px: 0,
        top: 71,
        left: 0,
        height: '100vh',
        position: 'fixed',
        flexDirection: 'column',
        ...bgBlur({ color: varAlpha(theme.vars.palette.background.defaultChannel, 0.8) }),
        zIndex: 'var(--layout-nav-zIndex)',
        width: '20%',
        [theme.breakpoints.up(layoutQuery)]: {
          display: 'flex',
        },
        ...sx,
      }}
    >
      <NavContent data={data} slots={slots} />
    </Box>
  );
}

export function NavMobile({
  sx,
  data,
  open,
  slots,
  onClose,
}: NavContentProps & { open: boolean; onClose: () => void }) {
  const theme = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    if (open) {
      onClose();
    }
  }, [pathname, open, onClose]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      sx={{
        [`& .${drawerClasses.paper}`]: {
          pt: 2,
          px: 2,
          overflow: 'unset',
          ...bgBlur({ color: varAlpha(theme.vars.palette.background.defaultChannel, 0.8), blur: 5 }),
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          width: 'var(--layout-nav-mobile-width)',
          backgroundColor: varAlpha(theme.vars.palette.background.defaultChannel, 0.8),
          ...sx,
        },
      }}
    >
      <NavContent data={data} slots={slots} />
    </Drawer>
  );
}

export function NavContent({ data, slots, sx }: NavContentProps) {
  const theme = useTheme();
  const pathname = usePathname();
  const [open, setOpen] = useState<{ [key: string]: boolean }>({});

  const handleToggle = (title: string) => {
    setOpen((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <Box
      sx={{
        ...bgBlur({ color: varAlpha(theme.vars.palette.background.defaultChannel, 0.) }),
        height: '100vh',
        width: '100%',
      }}
    >
      {slots?.topArea}
      <Scrollbar fillContent>
        <Box component="nav" display="flex" flex="1 1 auto" flexDirection="column" sx={sx}>
          <Box component="ul" gap={0.5} display="flex" flexDirection="column">
            {data.map((item) => (
              <Fragment key={item.title}>
                <ListItem disableGutters disablePadding>
                  <ListItemButton
                    disableGutters
                    component={RouterLink}
                    href={item.path}
                    sx={{
                      pl: 2,
                      py: 2.6,
                      gap: 2,
                      pr: 1.5,
                      borderRadius: 0.75,
                      typography: 'body2',
                      fontWeight: 'fontWeightMedium',
                      color: theme.palette.text.primary,
                      minHeight: 'var(--layout-nav-item-height)',
                      ...(item.path === pathname && {
                        fontWeight: 'fontWeightSemiBold',
                        backgroundColor: varAlpha(theme.vars.palette.background.defaultChannel, 0.2),
                        color: theme.palette.text.primary,
                        '&:hover': {
                          backgroundColor: varAlpha(theme.vars.palette.background.defaultChannel, 0.3),
                        },
                      }),
                    }}
                  >
                    <Box component="span" sx={{ width: 24, height: 24 }}>
                      {item.icon}
                    </Box>
                    <Box component="span" flexGrow={1}>
                      {item.title}
                    </Box>
                    {item.info && item.info}
                  </ListItemButton>
                  {item.subItems && (
                    <IconButton
                      onClick={(event) => {
                        event.stopPropagation();
                        handleToggle(item.title);
                      }}
                      sx={{ mr: 1 }}
                    >
                      {open[item.title] ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  )}
                </ListItem>
                {item.subItems && (
                  <Collapse in={open[item.title]} timeout="auto" unmountOnExit>
                    <Box component="ul" sx={{ pl: 4 }}>
                      {item.subItems.map((subItem) => (
                        <ListItem disableGutters disablePadding key={subItem.title}>
                          <ListItemButton
                            disableGutters
                            component={RouterLink}
                            href={subItem.path}
                            sx={{
                              pl: 2,
                              py: 2,
                              gap: 2,
                              pr: 1.5,
                              borderRadius: 0.75,
                              typography: 'body2',
                              fontWeight: 'fontWeightMedium',
                              color: theme.palette.text.secondary,
                              ...(subItem.path === pathname && {
                                fontWeight: 'fontWeightSemiBold',
                                backgroundColor: varAlpha(theme.vars.palette.background.defaultChannel, 0.2),
                                color: theme.palette.text.primary,
                                '&:hover': {
                                  backgroundColor: varAlpha(theme.vars.palette.background.defaultChannel, 0.3),
                                },
                              }),
                            }}
                          >
                            <Box component="span" sx={{ width: 24, height: 24 }}>
                              {subItem.icon}
                            </Box>
                            <Box component="span" flexGrow={1}>
                              {subItem.title}
                            </Box>
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </Box>
                  </Collapse>
                )}
              </Fragment>
            ))}
          </Box>
        </Box>
      </Scrollbar>
      {slots?.bottomArea}
    </Box>
  );
}