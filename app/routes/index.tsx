import type { LoaderArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import {
  createStyles,
  Title,
  SimpleGrid,
  Text,
  Button,
  ThemeIcon,
  Grid,
  Col,
  Image,
  Container,
  Group,
  Box
} from '@mantine/core';
import { Server, Lock, Users, FileText, GitHub } from 'react-feather';
import { getUserId } from '~/session.server';
import { Link } from '@remix-run/react';

export async function loader({ request }: LoaderArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect('/time-entries');
  return json({});
}

const features = [
  {
    icon: FileText,
    title: 'Free and open source',
    description:
      'All packages are published under GNU Public license v3, you can self host this app and use it for free forever'
  },
  {
    icon: Server,
    title: 'Host anywhere',
    description:
      'You can host this app on your own server or using any cloud provider, your choice'
  },
  {
    icon: Lock,
    title: 'Privacy friendly, you own your data',
    description:
      'No analytics or tracking scripts, no ads, no data sharing. You are in control of your data'
  },
  {
    icon: Users,
    title: 'Flexible',
    description:
      'Use it for yourself as single user or invite your team to collaborate, you can also use it as a public service as admin'
  }
];

const items = features.map((feature) => (
  <div key={feature.title}>
    <ThemeIcon
      size={44}
      radius="md"
      variant="gradient"
      gradient={{ deg: 133, from: 'blue', to: 'cyan' }}
    >
      <feature.icon />
    </ThemeIcon>
    <Text fz="lg" mt="sm" fw={500}>
      {feature.title}
    </Text>
    <Text c="dimmed" fz="sm">
      {feature.description}
    </Text>
  </div>
));

const rem = (value: number) => `${value / 16}rem`;

const useStyles = createStyles((theme) => ({
  wrapper: {
    position: 'relative',
    boxSizing: 'border-box',
    backgroundColor:
      theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.white
  },

  inner: {
    position: 'relative',
    paddingTop: rem(32),
    paddingBottom: rem(32),

    [theme.fn.smallerThan('sm')]: {
      paddingBottom: rem(16),
      paddingTop: rem(16)
    }
  },

  title: {
    fontSize: rem(62),
    fontWeight: 900,
    lineHeight: 1.1,
    margin: 0,
    padding: 0,
    color: theme.colorScheme === 'dark' ? theme.white : theme.black,

    [theme.fn.smallerThan('sm')]: {
      fontSize: rem(42),
      lineHeight: 1.2
    }
  },

  description: {
    marginTop: theme.spacing.xl,
    fontSize: rem(24),

    [theme.fn.smallerThan('sm')]: {
      fontSize: rem(18)
    }
  },

  controls: {
    marginTop: `calc(${theme.spacing.xl}px * 2)`,

    [theme.fn.smallerThan('sm')]: {
      marginTop: theme.spacing.xl
    }
  },

  control: {
    height: rem(54),
    paddingLeft: rem(38),
    paddingRight: rem(38),

    [theme.fn.smallerThan('sm')]: {
      height: rem(54),
      paddingLeft: rem(18),
      paddingRight: rem(18),
      flex: 1
    }
  }
}));

export default function Index() {
  const { classes } = useStyles();

  return (
    <>
      <Container size="md" px="md" className={classes.inner}>
        <h1 className={classes.title}>
          A{' '}
          <Text
            component="span"
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan' }}
            inherit
          >
            self-hosted
          </Text>{' '}
          privacy friendly time tracking app
        </h1>
        <Text className={classes.description} color="dimmed">
          Time tracking app built with Remix, supports authentication, projects
          management, and monthly or custom reports
        </Text>

        <Group className={classes.controls}>
          <Button
            component={Link}
            to="/login"
            size="xl"
            className={classes.control}
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan' }}
          >
            Get started
          </Button>

          <Button
            component="a"
            href="https://github.com/nzambello/work-timer"
            target="_blank"
            rel="noopener noreferrer"
            size="xl"
            variant="default"
            className={classes.control}
            leftIcon={<GitHub />}
          >
            GitHub
          </Button>
        </Group>
      </Container>

      <Container size="md" px="md" mt={120}>
        <Title mt="xl" mb="md" order={2}>
          Features
        </Title>
        <SimpleGrid
          mb="xl"
          cols={2}
          spacing={30}
          breakpoints={[{ maxWidth: 'md', cols: 1 }]}
        >
          {items}
        </SimpleGrid>

        <Grid gutter="lg" mt={120} align="flex-start">
          <Col span={12} md={7}>
            <Title order={3} mb="sm">
              Light/dark theme
            </Title>
            <Group noWrap>
              <Image
                maw="50%"
                mx="auto"
                radius="md"
                src="/images/00-time-entries-light.png"
                alt="Time entries (light theme)"
              />
              <Image
                maw="50%"
                mx="auto"
                radius="md"
                src="/images/01-time-entries-dark.png"
                alt="Time entries (dark theme)"
              />
            </Group>
          </Col>
          <Col span={12} md={5}>
            <Title order={3} mb="sm">
              Time entries management
            </Title>
            <Group noWrap>
              <Image
                maw="100%"
                mx="auto"
                radius="md"
                src="/images/02-new-time-entry.png"
                alt="Time entries editing"
              />
            </Group>
          </Col>
          <Col span={12} md={5}>
            <Title order={3} mb="sm">
              Reports
            </Title>
            <Group noWrap>
              <Image
                maw="100%"
                mx="auto"
                radius="md"
                src="/images/05-reports.png"
                alt="Reports"
              />
            </Group>
          </Col>
          <Col span={12} md={7}>
            <Title order={3} mb="sm">
              Projects
            </Title>
            <Group noWrap>
              <Image
                maw="50%"
                mx="auto"
                radius="md"
                src="/images/03-projects.png"
                alt="Projects management"
              />
              <Image
                maw="50%"
                mx="auto"
                radius="md"
                src="/images/04-new-project.png"
                alt="Projects management: new project"
              />
            </Group>
          </Col>
        </Grid>
      </Container>
    </>
  );
}
