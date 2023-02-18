import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Text,
  Alert,
  Tabs,
  FileInput,
  Loader,
  Flex
} from '@mantine/core';
import {
  ActionArgs,
  json,
  LoaderArgs,
  MetaFunction,
  redirect
} from '@remix-run/node';
import { Form, Link, useActionData, useSearchParams } from '@remix-run/react';
import { CheckCircle, Download, Upload, XCircle } from 'react-feather';
import { requireUserId } from '~/session.server';
import { createProject, getProjectByName } from '~/models/project.server';
import { createTimeEntry } from '~/models/timeEntry.server';
import papaparse from 'papaparse';

const randomColor = () =>
  `#${Math.floor(Math.random() * 16777215).toString(16)}`;

export const meta: MetaFunction = () => {
  return {
    title: 'Import/Export | WorkTimer',
    description: 'Manage your projects. You must be logged in to do this.'
  };
};

export async function action({ request, params }: ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();

  const fileData = formData.get('fileData');

  if (typeof fileData !== 'string' || !fileData?.length) {
    return json(
      { errors: { fileData: 'No file data' }, success: false },
      { status: 400 }
    );
  }

  const parsed = papaparse.parse(fileData, {
    header: true,
    skipEmptyLines: true
  });

  if (parsed.errors.length) {
    return json(
      {
        errors: { fileData: parsed.errors[0].message },
        success: false,
        imported: 0
      },
      { status: 400 }
    );
  }

  const headers = parsed.meta.fields;
  if (!headers?.includes('description')) {
    return json(
      {
        errors: { fileData: 'Missing description column' },
        success: false,
        imported: 0
      },
      { status: 400 }
    );
  }
  if (!headers?.includes('startTime')) {
    return json(
      {
        errors: { fileData: 'Missing startTime column' },
        success: false,
        imported: 0
      },
      { status: 400 }
    );
  }
  if (!headers?.includes('endTime')) {
    return json(
      {
        errors: { fileData: 'Missing endTime column' },
        success: false,
        imported: 0
      },
      { status: 400 }
    );
  }
  if (!headers?.includes('project')) {
    return json(
      {
        errors: { fileData: 'Missing project column' },
        success: false,
        imported: 0
      },
      { status: 400 }
    );
  }

  const timeEntries = parsed.data.map<{
    description: string;
    startTime: string;
    endTime?: string;
    projectId?: string;
    projectName: string;
  }>((row: any) => ({
    description: row.description,
    startTime: row.startTime,
    endTime: row.endTime,
    projectId: undefined,
    projectName: row.project
  }));

  for (const timeEntry of timeEntries) {
    const project = await getProjectByName({
      userId,
      name: timeEntry.projectName
    });

    if (!project) {
      const project = await createProject({
        userId,
        name: timeEntry.projectName,
        description: null,
        color: randomColor()
      });

      timeEntry.projectId = project.id;
    } else {
      timeEntry.projectId = project.id;
    }

    await createTimeEntry({
      userId,
      projectId: timeEntry.projectId,
      description: timeEntry.description,
      startTime: new Date(timeEntry.startTime),
      endTime: timeEntry.endTime ? new Date(timeEntry.endTime) : null
    });
  }

  return json(
    {
      errors: {
        fileData: null
      },
      success: true,
      imported: timeEntries.length
    },
    { status: 200 }
  );
}

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request);
  if (!userId) return redirect('/login');

  return json({});
}

export default function ImportExportPage() {
  const actionData = useActionData<typeof action>();
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = useMemo(() => {
    return searchParams.get('tab') || 'import';
  }, [searchParams]);

  useEffect(() => {
    setSearchParams({ tab });
  }, []);

  const [csvData, setCsvData] = useState<string>();

  useEffect(() => {
    if (actionData?.success) {
      setTimeout(() => {
        window.location.pathname = '/time-entries';
      }, 3000);
    }
  }, [actionData?.success]);

  const handleChangeFile = (file: File) => {
    let reader: FileReader = new FileReader();

    reader.onload = (_event: Event) => {
      setCsvData(reader.result as string);
    };

    reader.readAsText(file, 'UTF-8');
  };

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
          <h2>Import</h2>
          <p>
            Select a CSV file with the same format as the one you can download
            from <Link to="?tab=export">Export</Link>
          </p>

          <FileInput
            label="Upload CSV file"
            placeholder="Upload CSV file"
            accept=".csv, text/csv"
            icon={<Upload size={14} />}
            onChange={handleChangeFile}
            aria-invalid={actionData?.errors?.fileData ? true : undefined}
            error={actionData?.errors?.fileData}
            errorProps={{ children: actionData?.errors?.fileData }}
          />

          <Form method="post" noValidate>
            <input type="hidden" name="fileData" value={csvData} />
            <Button
              type="submit"
              mt="md"
              disabled={!csvData?.length || !!actionData?.success}
            >
              Import
            </Button>
          </Form>

          {!!actionData?.success && (
            <Alert
              icon={<CheckCircle size={16} />}
              title="Import successful"
              color="green"
              radius="md"
              variant="light"
              mt="md"
              withCloseButton
              closeButtonLabel="Close results"
            >
              Successfully imported time entries
              <Flex mt="md" align="center">
                <Loader size={16} />
                <Text ml="sm">Redirecting to time entries...</Text>
              </Flex>
            </Alert>
          )}
          {!!actionData?.errors?.fileData && (
            <Alert
              icon={<XCircle size={16} />}
              title="Error"
              color="red"
              radius="md"
              variant="light"
              mt="md"
              withCloseButton
              closeButtonLabel="Close results"
            >
              {actionData?.errors?.fileData}
            </Alert>
          )}
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
