import { MetaFunction, LoaderArgs, LinksFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  Link,
  useCatch,
  useMatches,
  useTransition,
  Form,
  useLocation
} from '@remix-run/react';
import { useEffect, useState } from 'react';
import {
  MantineProvider,
  createEmotionCache,
  useMantineTheme,
  ColorScheme,
  ColorSchemeProvider,
  AppShell,
  Navbar,
  Header,
  Text,
  MediaQuery,
  Burger,
  ActionIcon,
  useMantineColorScheme,
  Button,
  Box,
  Group,
  UnstyledButton,
  ThemeIcon,
  NavLink,
  Menu,
  Badge
} from '@mantine/core';
import { useColorScheme, useLocalStorage } from '@mantine/hooks';
import { StylesPlaceholder } from '@mantine/remix';
import {
  NavigationProgress,
  startNavigationProgress,
  completeNavigationProgress
} from '@mantine/nprogress';
import type { User as UserType } from './models/user.server';
import { getUser } from './session.server';
import {
  Sun,
  Moon,
  Clock,
  LogOut,
  LogIn,
  Home,
  Briefcase,
  BarChart2,
  FileText,
  Upload,
  Settings,
  Lock,
  User,
  Users
} from 'react-feather';
import { NotificationsProvider } from '@mantine/notifications';

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'WorkTimer',
  description:
    'WorkTimer is a time tracking app. Helps you track your time spent on projects.',
  viewport: 'width=device-width,initial-scale=1'
});

export let links: LinksFunction = () => {
  return [];
};

export async function loader({ request }: LoaderArgs) {
  return json({
    user: await getUser(request)
  });
}

createEmotionCache({ key: 'mantine' });

export default function App() {
  let transition = useTransition();
  useEffect(() => {
    if (transition.state === 'idle') completeNavigationProgress();
    else startNavigationProgress();
  }, [transition.state]);

  return (
    <Document>
      <Layout>
        <Outlet />
      </Layout>
    </Document>
  );
}

function Document({
  children,
  title
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const preferredColorScheme = useColorScheme();
  const toggleColorScheme = (value?: ColorScheme) => {
    setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));
  };

  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: 'mantine-color-scheme',
    defaultValue: preferredColorScheme,
    getInitialValueInEffect: true
  });

  return (
    <ColorSchemeProvider
      colorScheme={colorScheme}
      toggleColorScheme={toggleColorScheme}
    >
      <MantineProvider
        theme={{ colorScheme }}
        withGlobalStyles
        withNormalizeCSS
      >
        <NotificationsProvider>
          <html lang="en">
            <head>
              <meta charSet="utf-8" />
              <meta
                httpEquiv="Content-Type"
                content="text/html; charset=utf-8"
              />
              <meta name="application-name" content="Work Timer" />
              <meta
                name="viewport"
                content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover"
              />
              <meta name="apple-mobile-web-app-capable" content="yes" />
              <meta
                name="apple-mobile-web-app-status-bar-style"
                content="default"
              />
              <meta name="format-detection" content="telephone=no" />
              <meta name="mobile-web-app-capable" content="yes" />

              <link rel="icon" href="/favicon.ico" />
              <link
                rel="apple-touch-icon"
                sizes="180x180"
                href={`/apple-touch-icon.png`}
              />
              <link
                rel="icon"
                type="image/png"
                sizes="32x32"
                href={`/favicon-32x32.png`}
              />
              <link
                rel="icon"
                type="image/png"
                sizes="16x16"
                href={`/favicon-32x32.png`}
              />
              <link
                rel="icon"
                type="image/png"
                sizes="512x512"
                href={`/android-chrome-512x512.png`}
              />
              <link
                rel="icon"
                type="image/png"
                sizes="192x192"
                href={`/android-chrome-192x192.png`}
              />

              {title ? <title>{title}</title> : null}

              <StylesPlaceholder />
              <Meta />
              <Links />
            </head>
            <body>
              <NavigationProgress />
              {children}
              <ScrollRestoration />
              <Scripts />
              {process.env.NODE_ENV === 'development' && <LiveReload />}
            </body>
          </html>
        </NotificationsProvider>
      </MantineProvider>
    </ColorSchemeProvider>
  );
}

export function CatchBoundary() {
  let caught = useCatch();

  let message;
  switch (caught.status) {
    case 401:
      message =
        'Oops! Looks like you tried to visit a page that you do not have access to.';

      break;
    case 404:
      message =
        'Oops! Looks like you tried to visit a page that does not exist.';

      break;

    default:
      throw new Error(caught.data || caught.statusText);
  }

  return (
    <Document title={`${caught.status} ${caught.statusText}`}>
      <Layout>
        <div>
          <h1>
            {caught.status}: {caught.statusText}
          </h1>
          <p>{message}</p>
        </div>
      </Layout>
    </Document>
  );
}

function Layout({ children }: React.PropsWithChildren<{}>) {
  let user = useMatches().find((m) => m.id === 'root')?.data?.user as
    | UserType
    | undefined;
  const [opened, setOpened] = useState(false);
  const location = useLocation();
  const theme = useMantineTheme();

  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  useEffect(() => {
    setOpened(false);
  }, [location]);

  return (
    <AppShell
      padding="md"
      navbarOffsetBreakpoint="sm"
      asideOffsetBreakpoint="sm"
      fixed={false}
      navbar={
        user ? (
          <Navbar
            p="xs"
            hiddenBreakpoint="sm"
            hidden={!opened}
            width={{ sm: 200, lg: 250 }}
          >
            <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
              <Navbar.Section>
                <Box
                  sx={(theme) => ({
                    paddingLeft: theme.spacing.xs,
                    paddingRight: theme.spacing.xs,
                    paddingBottom: theme.spacing.lg,
                    borderBottom: `1px solid ${
                      theme.colorScheme === 'dark'
                        ? theme.colors.dark[4]
                        : theme.colors.gray[2]
                    }`
                  })}
                >
                  <Group position="left" align="center">
                    <ActionIcon
                      variant="default"
                      onClick={() => toggleColorScheme()}
                      size={30}
                      title="Toggle color scheme"
                    >
                      {colorScheme === 'dark' ? (
                        <Sun size={16} />
                      ) : (
                        <Moon size={16} />
                      )}
                    </ActionIcon>
                    <Text size="sm">Toggle theme</Text>
                  </Group>
                </Box>
              </Navbar.Section>
            </MediaQuery>
            {user && (
              <Navbar.Section mt="md" grow={!user.admin}>
                <NavLink
                  component={Link}
                  to="/"
                  label="Home"
                  icon={
                    <ThemeIcon variant="light">
                      <Home size={16} />
                    </ThemeIcon>
                  }
                  active={location.pathname === '/'}
                />
                <NavLink
                  component={Link}
                  to="/time-entries"
                  label="Time entries"
                  icon={
                    <ThemeIcon variant="light">
                      <Clock size={16} />
                    </ThemeIcon>
                  }
                  variant="light"
                  active={location.pathname.includes('/time-entries')}
                />
                <NavLink
                  component={Link}
                  to="/projects"
                  label="Projects"
                  icon={
                    <ThemeIcon variant="light">
                      <Briefcase size={16} />
                    </ThemeIcon>
                  }
                  variant="light"
                  active={location.pathname.includes('/projects')}
                />
                <NavLink
                  component={Link}
                  to="/reports"
                  label="Reports"
                  icon={
                    <ThemeIcon variant="light">
                      <BarChart2 size={16} />
                    </ThemeIcon>
                  }
                  variant="light"
                  active={location.pathname.includes('/report')}
                />
                <NavLink
                  component={Link}
                  to="/importexport"
                  label="Import/Export"
                  icon={
                    <ThemeIcon variant="light">
                      <Upload size={16} />
                    </ThemeIcon>
                  }
                  variant="light"
                  active={location.pathname.includes('/importexport')}
                />
              </Navbar.Section>
            )}
            {!!user?.admin && (
              <Navbar.Section
                grow
                sx={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: `1px solid ${
                    theme.colorScheme === 'dark'
                      ? theme.colors.dark[4]
                      : theme.colors.gray[2]
                  }`
                }}
              >
                <Badge variant="light">ADMIN</Badge>
                <NavLink
                  component={Link}
                  to="/users"
                  label="Users"
                  icon={
                    <ThemeIcon variant="light">
                      <Users size={16} />
                    </ThemeIcon>
                  }
                  variant="light"
                  active={location.pathname.includes('/users')}
                />
                <NavLink
                  component={Link}
                  to="/settings"
                  label="Settings"
                  icon={
                    <ThemeIcon variant="light">
                      <Settings size={16} />
                    </ThemeIcon>
                  }
                  variant="light"
                  active={location.pathname.includes('/settings')}
                />
              </Navbar.Section>
            )}
            {user && (
              <Navbar.Section mt="lg">
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <UnstyledButton w="100%" title="Account / Logout" p="xs">
                      <Group w="100%">
                        <ThemeIcon
                          variant="light"
                          sx={{
                            flexShrink: 1
                          }}
                        >
                          <User size={16} />
                        </ThemeIcon>
                        <div>
                          <Text
                            sx={{
                              flex: 1
                            }}
                          >
                            {user.email.split('@')[0]}
                          </Text>
                          <Text size="xs" color="dimmed">
                            {user.email.split('@')[1]}
                          </Text>
                        </div>
                      </Group>
                    </UnstyledButton>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Label>Account</Menu.Label>
                    <Menu.Item
                      icon={<Settings size={14} />}
                      component={Link}
                      to="/account"
                    >
                      Settings
                    </Menu.Item>
                    <Form action="/logout" method="post" noValidate>
                      <Menu.Item icon={<LogOut size={14} />} type="submit">
                        Logout
                      </Menu.Item>
                    </Form>
                  </Menu.Dropdown>
                </Menu>
              </Navbar.Section>
            )}
          </Navbar>
        ) : undefined
      }
      header={
        <Header height={{ base: 50, md: 70 }} p="md">
          <div
            style={{ display: 'flex', alignItems: 'center', height: '100%' }}
          >
            <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
              <Burger
                opened={opened}
                onClick={() => setOpened((o) => !o)}
                size="sm"
                color={theme.colors.gray[6]}
                mr="xl"
              />
            </MediaQuery>

            <Text
              component={Link}
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ThemeIcon
                variant="light"
                size={24}
                style={{ marginRight: theme.spacing.sm }}
              >
                <Clock />
              </ThemeIcon>
              <span
                style={{
                  fontWeight: 700,
                  lineHeight: 1.2,
                  fontSize: '1.25rem'
                }}
              >
                WorkTimer
              </span>
            </Text>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginLeft: 'auto'
              }}
            >
              <MediaQuery
                smallerThan="sm"
                styles={user ? { display: 'none' } : {}}
              >
                <ActionIcon
                  variant="light"
                  onClick={() =>
                    toggleColorScheme(colorScheme === 'dark' ? 'light' : 'dark')
                  }
                  title="Toggle color scheme"
                >
                  {colorScheme === 'dark' ? (
                    <Sun size={18} />
                  ) : (
                    <Moon size={18} />
                  )}
                </ActionIcon>
              </MediaQuery>
              {!user && (
                <Button
                  variant="light"
                  ml="sm"
                  leftIcon={<LogIn />}
                  component={Link}
                  to="/login"
                >
                  Sign in
                </Button>
              )}
            </div>
          </div>
        </Header>
      }
      styles={(theme) => ({
        main: {
          backgroundColor:
            theme.colorScheme === 'dark'
              ? theme.colors.dark[8]
              : theme.colors.gray[0]
        }
      })}
    >
      {children}
    </AppShell>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  return (
    <Document title="Error!">
      <Layout>
        <div>
          <h1>There was an error</h1>
          <p>{error.message}</p>
          <hr />
          <p>
            Hey, developer, you should replace this with what you want your
            users to see.
          </p>
        </div>
      </Layout>
    </Document>
  );
}
