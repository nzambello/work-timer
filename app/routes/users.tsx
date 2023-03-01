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
  ThemeIcon,
  Table,
  Indicator,
  Tooltip,
  TextInput
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
  Edit3,
  Key,
  Plus,
  Search,
  Settings,
  Trash,
  User as UserIcon,
  X,
  XCircle
} from 'react-feather';
import { requireUser } from '~/session.server';
import { getUsers, User } from '~/models/user.server';

export const meta: MetaFunction = () => {
  return {
    title: 'Users | WorkTimer',
    description: 'Manage your users. You must be logged in as admin to do this.'
  };
};

export async function loader({ request }: LoaderArgs) {
  const user = await requireUser(request);
  if (!user || !user.admin) return redirect('/login');

  const url = new URL(request.url);
  const page = url.searchParams.get('page')
    ? parseInt(url.searchParams.get('page')!, 10)
    : 1;
  const size = url.searchParams.get('size')
    ? parseInt(url.searchParams.get('size')!, 10)
    : 25;
  const orderBy = url.searchParams.get('orderBy') || 'createdAt';
  const order = url.searchParams.get('order') || 'desc';
  const search = url.searchParams.get('search') || undefined;

  return json({
    user,
    ...(await getUsers({
      search,
      page,
      size,
      orderBy,
      order: order === 'asc' ? 'asc' : 'desc'
    }))
  });
}

export default function Users() {
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
      <h1
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0
        }}
      >
        Users
      </h1>
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
          to="/users/new"
          variant="light"
          radius={theme.radius.md}
          leftIcon={<Plus />}
        >
          New User
        </Button>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between'
          }}
        >
          <NativeSelect
            name="size"
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
            marginTop: 14,
            flexGrow: 1,
            flexShrink: 0
          }}
        >
          <TextInput
            type="search"
            placeholder="Search users"
            aria-label="Type to search users by email"
            name="search"
            style={{ width: 260 }}
            icon={<Search size={16} />}
            rightSection={
              <ActionIcon
                onClick={() => setSearchParams((sp) => ({ ...sp, search: '' }))}
              >
                <X size={16} strokeWidth={1} />
              </ActionIcon>
            }
            value={searchParams.get('search') || ''}
            onChange={(event) => {
              setSearchParams({
                search: event.currentTarget.value
              });
            }}
          />
        </div>
      </Paper>
      <Group mt="lg" mb="md" mx="auto">
        <Text size="sm" color="darkgray">
          {data.total} users
        </Text>
        {data.total !== data.filteredTotal && (
          <>
            <Text size="sm" color="darkgray">
              |
            </Text>
            <Text size="sm" color="darkgray">
              {data.filteredTotal} matches
            </Text>
          </>
        )}
      </Group>

      <Outlet />

      <Table role="region" id="users">
        <thead>
          <tr>
            <th scope="col"></th>
            <th scope="col">Email</th>
            <th scope="col">Created</th>
            <th
              scope="col"
              style={{
                textAlign: 'right'
              }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {data.users.map((user) => (
            <tr key={user.id}>
              <td>
                {user.id === data.user.id ? (
                  <Indicator inline label="YOU" size={16}>
                    <ThemeIcon variant="light">
                      {user.admin ? (
                        <Tooltip label="Admin">
                          <Key />
                        </Tooltip>
                      ) : (
                        <UserIcon />
                      )}
                    </ThemeIcon>
                  </Indicator>
                ) : (
                  <ThemeIcon variant="light">
                    {user.admin ? (
                      <Tooltip label="Admin">
                        <Key />
                      </Tooltip>
                    ) : (
                      <UserIcon />
                    )}
                  </ThemeIcon>
                )}
              </td>
              <td>
                <Text weight={600}>{user.email}</Text>
              </td>
              <td>
                <Text>
                  {Intl.DateTimeFormat(data.user.dateFormat, {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }).format(new Date(user.createdAt))}
                </Text>
              </td>
              <td>
                <Group position="right">
                  <ActionIcon
                    disabled={user.id === data.user.id}
                    title="Delete user"
                    component={Link}
                    to={`/users/${user.id}`}
                  >
                    <Trash
                      size={14}
                      color={
                        user.id !== data.user.id
                          ? theme.colors.red[8]
                          : undefined
                      }
                    />
                  </ActionIcon>
                </Group>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
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
