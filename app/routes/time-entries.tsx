import { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Paper,
  Text,
  Menu,
  ActionIcon,
  Textarea,
  Pagination,
  NativeSelect,
  Group,
  Divider,
  useMantineTheme,
  Progress,
  Badge,
  ThemeIcon,
  Alert,
  Box
} from '@mantine/core';
import { json, LoaderArgs, MetaFunction, redirect } from '@remix-run/node';
import {
  Form,
  Link,
  Outlet,
  useCatch,
  useLoaderData,
  useSearchParams
} from '@remix-run/react';
import {
  AlertTriangle,
  Edit,
  Edit3,
  Play,
  Power,
  Settings,
  Square,
  Trash
} from 'react-feather';
import { requireUserId } from '~/session.server';
import { getTimeEntries, TimeEntry } from '~/models/timeEntry.server';
import TimeElapsed from '~/components/TimeElapsed';
import SectionTimeElapsed from '~/components/SectionTimeElapsed';

export const meta: MetaFunction = () => {
  return {
    title: 'Time entries | WorkTimer',
    description: 'Manage your time entries. You must be logged in to do this.'
  };
};

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request);
  if (!userId) return redirect('/login');

  const url = new URL(request.url);
  const page = url.searchParams.get('page')
    ? parseInt(url.searchParams.get('page')!, 10)
    : 1;
  const size = url.searchParams.get('size')
    ? parseInt(url.searchParams.get('size')!, 10)
    : 25;
  const orderBy = url.searchParams.get('orderBy') || 'createdAt';
  const order = url.searchParams.get('order') || 'desc';

  return json({
    ...(await getTimeEntries({
      page,
      size,
      userId,
      orderBy,
      order: order === 'asc' ? 'asc' : 'desc'
    }))
  });
}

export default function TimeEntriesPage() {
  const data = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useMantineTheme();

  const pageSize = useMemo(() => {
    return parseInt(searchParams.get('size') || '25', 10);
  }, [searchParams]);
  const page = useMemo(() => {
    return parseInt(searchParams.get('page') || '1', 10);
  }, [searchParams]);

  const timeEntriesPerDay = useMemo(() => {
    const timeEntriesPerDay: Record<
      string,
      { entries: typeof data.timeEntries; total: number }
    > = {};
    data.timeEntries.forEach((timeEntry) => {
      const date = Intl.DateTimeFormat('it-IT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date(timeEntry.startTime));

      if (!timeEntriesPerDay[date])
        timeEntriesPerDay[date] = { entries: [], total: 0 };
      timeEntriesPerDay[date].total +=
        (timeEntry.endTime
          ? new Date(timeEntry.endTime).getTime() -
            new Date(timeEntry.startTime).getTime()
          : Date.now() - new Date(timeEntry.startTime).getTime()) / 1000;
      timeEntriesPerDay[date].entries.push(timeEntry);
    });
    return timeEntriesPerDay;
  }, [data.timeEntries]);

  return (
    <div>
      <Paper
        component="fieldset"
        aria-controls="time-entries"
        p="sm"
        shadow="sm"
        radius="md"
        withBorder
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap'
        }}
      >
        <Button
          component={Link}
          to="/time-entries/new"
          variant="light"
          radius={theme.radius.md}
          leftIcon={<Play />}
          sx={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.sm }}
        >
          New
        </Button>
        <NativeSelect
          sx={{
            marginLeft: 'auto',
            marginRight: '0.5rem',
            marginTop: theme.spacing.sm,
            marginBottom: theme.spacing.sm
          }}
          data={[
            { label: '25 / page', value: '25' },
            { label: '50 / page', value: '50' },
            { label: '100 / page', value: '100' }
          ]}
          value={pageSize}
          onChange={(event) => {
            setSearchParams({
              page: page.toString(),
              size: event.currentTarget.value
            });
          }}
        />
        {data.total / pageSize > 1 && (
          <Pagination
            sx={{
              marginLeft: '0.5rem',
              marginTop: theme.spacing.sm,
              marginBottom: theme.spacing.sm
            }}
            aria-label="Navigate through time entries pages"
            siblings={1}
            boundaries={1}
            page={page}
            total={Math.ceil(data.total / pageSize)}
            onChange={(page) => {
              setSearchParams({
                page: page.toString(),
                size: pageSize.toString()
              });
            }}
          />
        )}
      </Paper>
      <Group
        mt="lg"
        mb="md"
        mx="auto"
        maw={500}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',

          '@media (max-width: 600px)': {
            flexWrap: 'wrap',
            justifyContent: 'space-evenly'
          }
        }}
      >
        <Text size="sm" color="darkgray">
          {data.total} entries
        </Text>
        <Divider
          orientation="vertical"
          sx={{
            '@media (max-width: 600px)': {
              display: 'none'
            }
          }}
        />
        <SectionTimeElapsed
          timeEntries={
            data.timeEntries.filter(
              (t) =>
                new Date(t.startTime) >=
                new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  new Date().getDate(),
                  0,
                  0,
                  0
                )
            ) as any as TimeEntry[]
          }
          size="sm"
          additionalLabel="today"
        />
        <Divider
          orientation="vertical"
          sx={{
            '@media (max-width: 600px)': {
              display: 'none'
            }
          }}
        />
        <SectionTimeElapsed
          timeEntries={
            data.timeEntries.filter(
              (t) =>
                new Date(t.startTime) >=
                new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            ) as any as TimeEntry[]
          }
          size="sm"
          additionalLabel="this month"
        />
      </Group>

      <div role="region" id="time-entries">
        {Object.entries(timeEntriesPerDay).map(([date, timeEntries]) => (
          <section key={date}>
            <header
              style={{
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <h2
                style={{
                  marginRight: 'auto'
                }}
              >
                {date}
              </h2>

              <SectionTimeElapsed
                timeEntries={timeEntries.entries as any as TimeEntry[]}
                size="md"
                total={timeEntries.total}
              />
            </header>

            {timeEntries.entries.map((timeEntry) => (
              <Paper
                key={timeEntry.id}
                shadow="sm"
                p="md"
                radius="md"
                mb="sm"
                display="flex"
                sx={() => ({
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexDirection: 'row'
                })}
              >
                <Box
                  sx={() => ({
                    display: 'flex',
                    alignItems: 'flex-start',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    flexGrow: 1,
                    width: '100%',

                    '@media (min-width: 601px)': {
                      alignItems: 'center',
                      flexDirection: 'row'
                    }
                  })}
                >
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-block',
                      marginRight: 'auto',

                      '@media (max-width: 600px)': {
                        marginBottom: '0.33rem'
                      }
                    }}
                  >
                    {timeEntry.description}
                  </Box>
                  {timeEntry.projectId && timeEntry.project && (
                    <Badge color={timeEntry.project.color}>
                      {timeEntry.project.name}
                    </Badge>
                  )}
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    flexShrink: 1,
                    flexGrow: 0,

                    '@media (min-width: 601px)': {
                      flexDirection: 'row',
                      paddingLeft: '1rem'
                    }
                  }}
                >
                  <TimeElapsed
                    startTime={timeEntry.startTime}
                    endTime={timeEntry.endTime}
                  />
                  <Box
                    sx={{
                      display: 'flex',
                      flexShrink: 0,
                      marginLeft: '1rem',

                      '@media (max-width: 600px)': {
                        marginLeft: '0',
                        marginTop: '0.33rem'
                      }
                    }}
                  >
                    <Menu shadow="md" width={200}>
                      <Menu.Target>
                        <ActionIcon
                          title="Edit"
                          mr="xs"
                          sx={{
                            marginLeft: 'auto'
                          }}
                        >
                          <Settings size={14} />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Label>Edit time entry</Menu.Label>
                        <Menu.Item
                          component={Link}
                          to={`/time-entries/${timeEntry.id}`}
                          icon={
                            <Edit3 size={14} color={theme.colors.yellow[8]} />
                          }
                        >
                          Edit
                        </Menu.Item>
                        <Form
                          method="delete"
                          action={`/time-entries/${timeEntry.id}`}
                        >
                          <Menu.Item
                            component="button"
                            type="submit"
                            icon={
                              <Trash size={14} color={theme.colors.red[8]} />
                            }
                          >
                            Delete
                          </Menu.Item>
                        </Form>
                      </Menu.Dropdown>
                    </Menu>
                    {timeEntry.endTime ? (
                      <Form method="post" action="/time-entries/new">
                        <input type="hidden" name="startTime" value="now" />
                        <input
                          type="hidden"
                          name="description"
                          value={timeEntry.description}
                        />
                        <input
                          type="hidden"
                          name="projectId"
                          value={timeEntry.projectId}
                        />
                        <input
                          type="hidden"
                          name="userId"
                          value={timeEntry.userId}
                        />
                        <ActionIcon
                          type="submit"
                          title="Start new entry with same description"
                        >
                          <ThemeIcon variant="light">
                            <Play size={14} color={theme.colors.blue[7]} />
                          </ThemeIcon>
                        </ActionIcon>
                      </Form>
                    ) : (
                      <Form
                        method="patch"
                        action={`/time-entries/${timeEntry.id}`}
                      >
                        <input type="hidden" name="endTime" value="now" />
                        <ActionIcon
                          type="submit"
                          variant="filled"
                          title="Stop"
                          style={{
                            backgroundColor: theme.colors.red[7],
                            color: 'white',
                            borderRadius: '50%'
                          }}
                        >
                          <Square size={12} fill="currentColor" />
                        </ActionIcon>
                      </Form>
                    )}
                  </Box>
                </Box>
              </Paper>
            ))}
          </section>
        ))}
      </div>
      <Outlet />
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return (
    <Alert icon={<AlertTriangle size={14} />} title="Error" color="red">
      An unexpected error occurred: {error.message}
    </Alert>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return (
      <Alert icon={<AlertTriangle size={14} />} title="Error" color="red">
        Not found
      </Alert>
    );
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}
