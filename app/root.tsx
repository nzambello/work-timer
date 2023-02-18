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
  ThemeIcon
} from '@mantine/core';
import { useColorScheme, useLocalStorage } from '@mantine/hooks';
import { StylesPlaceholder } from '@mantine/remix';
import {
  NavigationProgress,
  startNavigationProgress,
  completeNavigationProgress
} from '@mantine/nprogress';
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
  Upload
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
    console.log(value);
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
  let user = useMatches().find((m) => m.id === 'root')?.data?.user;
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
      navbar={
        user && (
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
                  <Group position="apart" align="center">
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
                  </Group>
                </Box>
              </Navbar.Section>
            </MediaQuery>
            {user && (
              <Navbar.Section grow mt="md">
                <UnstyledButton
                  component={Link}
                  to="/"
                  sx={(theme) => ({
                    display: 'block',
                    width: '100%',
                    padding: theme.spacing.xs,
                    borderRadius: theme.radius.sm,
                    color:
                      theme.colorScheme === 'dark'
                        ? theme.colors.dark[0]
                        : theme.black,

                    '&:hover': {
                      backgroundColor:
                        theme.colorScheme === 'dark'
                          ? theme.colors.dark[6]
                          : theme.colors.gray[0]
                    }
                  })}
                >
                  <Group>
                    <ThemeIcon variant="light">
                      <Home size={16} />
                    </ThemeIcon>

                    <Text size="sm">Home</Text>
                  </Group>
                </UnstyledButton>
                <UnstyledButton
                  component={Link}
                  to="/time-entries"
                  sx={(theme) => ({
                    display: 'block',
                    width: '100%',
                    padding: theme.spacing.xs,
                    borderRadius: theme.radius.sm,
                    color:
                      theme.colorScheme === 'dark'
                        ? theme.colors.dark[0]
                        : theme.black,

                    '&:hover': {
                      backgroundColor:
                        theme.colorScheme === 'dark'
                          ? theme.colors.dark[6]
                          : theme.colors.gray[0]
                    }
                  })}
                >
                  <Group>
                    <ThemeIcon variant="light">
                      <Clock size={16} />
                    </ThemeIcon>

                    <Text size="sm">Time entries</Text>
                  </Group>
                </UnstyledButton>
                <UnstyledButton
                  component={Link}
                  to="/projects"
                  sx={(theme) => ({
                    display: 'block',
                    width: '100%',
                    padding: theme.spacing.xs,
                    borderRadius: theme.radius.sm,
                    color:
                      theme.colorScheme === 'dark'
                        ? theme.colors.dark[0]
                        : theme.black,

                    '&:hover': {
                      backgroundColor:
                        theme.colorScheme === 'dark'
                          ? theme.colors.dark[6]
                          : theme.colors.gray[0]
                    }
                  })}
                >
                  <Group>
                    <ThemeIcon variant="light">
                      <Briefcase size={16} />
                    </ThemeIcon>

                    <Text size="sm">Projects</Text>
                  </Group>
                </UnstyledButton>
                <UnstyledButton
                  component={Link}
                  to="/"
                  sx={(theme) => ({
                    display: 'block',
                    width: '100%',
                    padding: theme.spacing.xs,
                    borderRadius: theme.radius.sm,
                    color:
                      theme.colorScheme === 'dark'
                        ? theme.colors.dark[0]
                        : theme.black,

                    '&:hover': {
                      backgroundColor:
                        theme.colorScheme === 'dark'
                          ? theme.colors.dark[6]
                          : theme.colors.gray[0]
                    }
                  })}
                >
                  <Group>
                    <ThemeIcon variant="light">
                      <FileText size={16} />
                    </ThemeIcon>

                    <Text size="sm">Report</Text>
                  </Group>
                </UnstyledButton>
                <UnstyledButton
                  component={Link}
                  to="/importexport"
                  sx={(theme) => ({
                    display: 'block',
                    width: '100%',
                    padding: theme.spacing.xs,
                    borderRadius: theme.radius.sm,
                    color:
                      theme.colorScheme === 'dark'
                        ? theme.colors.dark[0]
                        : theme.black,

                    '&:hover': {
                      backgroundColor:
                        theme.colorScheme === 'dark'
                          ? theme.colors.dark[6]
                          : theme.colors.gray[0]
                    }
                  })}
                >
                  <Group>
                    <ThemeIcon variant="light">
                      <Upload size={16} />
                    </ThemeIcon>

                    <Text size="sm">Import/Export</Text>
                  </Group>
                </UnstyledButton>
                <UnstyledButton
                  component={Link}
                  to="/"
                  sx={(theme) => ({
                    display: 'block',
                    width: '100%',
                    padding: theme.spacing.xs,
                    borderRadius: theme.radius.sm,
                    color:
                      theme.colorScheme === 'dark'
                        ? theme.colors.dark[0]
                        : theme.black,

                    '&:hover': {
                      backgroundColor:
                        theme.colorScheme === 'dark'
                          ? theme.colors.dark[6]
                          : theme.colors.gray[0]
                    }
                  })}
                >
                  <Group>
                    <ThemeIcon variant="light">
                      <BarChart2 size={16} />
                    </ThemeIcon>

                    <Text size="sm">Statistics</Text>
                  </Group>
                </UnstyledButton>
              </Navbar.Section>
            )}
            {user && (
              <Navbar.Section>
                <Form action="/logout" method="post">
                  <UnstyledButton type="submit" ml="sm" title="Logout">
                    <Group>
                      <ThemeIcon variant="light">
                        <LogOut size={16} />
                      </ThemeIcon>
                      <div>
                        <Text>{user.email.split('@')[0]}</Text>
                        <Text size="xs" color="dimmed">
                          Click to logout
                        </Text>
                      </div>
                    </Group>
                  </UnstyledButton>
                </Form>
              </Navbar.Section>
            )}
          </Navbar>
        )
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
              <span>WorkTimer</span>
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
                  Login
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
