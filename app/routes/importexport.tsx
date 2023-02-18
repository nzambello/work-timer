import { useEffect, useMemo } from 'react';
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
  ColorSwatch,
  Tabs
} from '@mantine/core';
import {
  ActionArgs,
  json,
  LoaderArgs,
  MetaFunction,
  redirect
} from '@remix-run/node';
import {
  Form,
  Link,
  Outlet,
  useActionData,
  useCatch,
  useLoaderData,
  useSearchParams
} from '@remix-run/react';
import {
  AlertTriangle,
  Download,
  Edit3,
  Plus,
  Settings,
  Trash,
  Upload
} from 'react-feather';
import { requireUserId } from '~/session.server';
import { getProjects } from '~/models/project.server';
import { exportTimeEntries, getTimeEntries } from '~/models/timeEntry.server';
import papaparse from 'papaparse';

export const meta: MetaFunction = () => {
  return {
    title: 'Import/Export | WorkTimer',
    description: 'Manage your projects. You must be logged in to do this.'
  };
};

export async function action({ request, params }: ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();

  const actionType = formData.get('type');

  if (
    typeof actionType !== 'string' ||
    !['import', 'export'].includes(actionType)
  ) {
    return json(
      {
        errors: {
          type: 'Invalid action type',
          data: null
        }
      },
      {
        status: 400
      }
    );
  }

  if (actionType === 'import') {
    const file = formData.get('file');

    return json({}, { status: 200 });
  } else if (actionType === 'export') {
    const timeEntries = await exportTimeEntries({ userId });
    const csv = papaparse.unparse(timeEntries, {
      header: true
    });

    return json(
      {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="export.csv"'
        },
        body: 'hello world',
        errors: {}
      },
      {
        status: 200
      }
    );
  }
}

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request);
  if (!userId) return redirect('/login');

  return json({});
}

export default function ImportExportPage() {
  const actionData = useActionData<typeof action>();
  const data = useLoaderData<typeof loader>();
  const theme = useMantineTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = useMemo(() => {
    return searchParams.get('tab') || 'import';
  }, [searchParams]);

  useEffect(() => {
    setSearchParams({ tab });
  }, []);

  return (
    <div>
      <Tabs
        radius="sm"
        defaultValue="import"
        value={tab}
        onTabChange={(tab) => {
          setSearchParams({ tab: tab as string });
        }}
      >
        <Tabs.List>
          <Tabs.Tab value="import" icon={<Upload size={14} />}>
            Import
          </Tabs.Tab>
          <Tabs.Tab value="export" icon={<Download size={14} />}>
            Export
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="import" pt="xs">
          <h2>Import CSV</h2>
        </Tabs.Panel>

        <Tabs.Panel value="export" pt="xs">
          <h2>Export</h2>
          <p>Export all your time entries as CSV file</p>
          <Button
            component="a"
            href="/importexport/export.csv"
            download="work-timer-export.csv"
            leftIcon={<Download size={14} />}
          >
            Download CSV
          </Button>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
