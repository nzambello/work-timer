import { useMemo } from 'react';
import {
  Button,
  Paper,
  Text,
  Menu,
  ActionIcon,
  Pagination,
  NativeSelect,
  Group,
  useMantineTheme,
  Alert,
  ColorSwatch
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
import { AlertTriangle, Edit3, Plus, Settings, Trash } from 'react-feather';
import { requireUserId } from '~/session.server';
import { getProjects } from '~/models/project.server';

export const meta: MetaFunction = () => {
  return {
    title: 'Projects | WorkTimer',
    description: 'Manage your projects. You must be logged in to do this.'
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
    ...(await getProjects({
      page,
      size,
      userId,
      orderBy,
      order: order === 'asc' ? 'asc' : 'desc'
    }))
  });
}

export default function Projects() {
  const data = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useMantineTheme();

  const pageSize = useMemo(() => {
    return parseInt(searchParams.get('size') || '25', 10);
  }, [searchParams]);
  const page = useMemo(() => {
    return parseInt(searchParams.get('page') || '1', 10);
  }, [searchParams]);

  return (
    <div>
      <Paper
        component="fieldset"
        aria-controls="projects"
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
          to="/projects/new"
          variant="light"
          radius={theme.radius.md}
          leftIcon={<Plus />}
        >
          New project
        </Button>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between'
          }}
        >
          <NativeSelect
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
              style={{ marginLeft: 10 }}
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
        </div>
      </Paper>
      <Group mt="lg" mb="md" mx="auto">
        <Text size="sm" color="darkgray">
          {data.total} entries
        </Text>
      </Group>

      <div role="region" id="projects">
        {data.projects.map((project) => (
          <Paper
            key={project.id}
            shadow="sm"
            p="md"
            radius="md"
            mb="sm"
            display="flex"
            style={{
              alignItems: 'center',
              flexDirection: 'column'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%'
              }}
            >
              <ColorSwatch color={project.color} />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  marginRight: 'auto',
                  marginLeft: '1rem'
                }}
              >
                <strong>{project.name}</strong>
                <span
                  style={{
                    fontSize: '0.8em'
                  }}
                >
                  {project.description}
                </span>
              </div>
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <ActionIcon title="Edit" mr="xs">
                    <Settings size={14} />
                  </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>Edit project</Menu.Label>
                  <Menu.Item
                    component={Link}
                    to={`/projects/${project.id}`}
                    icon={<Edit3 size={14} color={theme.colors.yellow[8]} />}
                  >
                    Edit
                  </Menu.Item>
                  <Form method="delete" action={`/projects/${project.id}`}>
                    <Menu.Item
                      component="button"
                      type="submit"
                      icon={<Trash size={14} color={theme.colors.red[8]} />}
                    >
                      Delete
                    </Menu.Item>
                  </Form>
                </Menu.Dropdown>
              </Menu>
            </div>
          </Paper>
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
