import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import {
  Form,
  useActionData,
  useCatch,
  useLoaderData,
  useNavigate
} from '@remix-run/react';
import * as React from 'react';
import {
  Alert,
  Drawer,
  TextInput,
  Text,
  useMantineTheme,
  Group,
  Button,
  Textarea,
  Stack,
  Select,
  ColorSwatch,
  ActionIcon
} from '@mantine/core';
import {
  AlertTriangle,
  Delete,
  Play,
  Save,
  Square,
  Trash
} from 'react-feather';
import invariant from 'tiny-invariant';

import {
  deleteTimeEntry,
  getTimeEntry,
  updateTimeEntry
} from '~/models/timeEntry.server';
import { requireUserId } from '~/session.server';
import { getProjects } from '~/models/project.server';
import { DatePicker, TimeInput } from '@mantine/dates';

export const meta: MetaFunction = () => {
  return {
    title: 'Edit Time Entry | WorkTimer',
    description: 'Edit a time entry. You must be logged in to do this.'
  };
};

export async function loader({ request, params }: LoaderArgs) {
  const userId = await requireUserId(request);
  invariant(params.timeEntryId, 'timeEntryId not found');

  const timeEntry = await getTimeEntry({ userId, id: params.timeEntryId });
  if (!timeEntry) {
    throw new Response('Not Found', { status: 404 });
  }

  const projects = await getProjects({ userId });

  return json({ timeEntry, projects });
}

export async function action({ request, params }: ActionArgs) {
  const userId = await requireUserId(request);
  invariant(params.timeEntryId, 'timeEntryId not found');

  const timeEntry = await getTimeEntry({ userId, id: params.timeEntryId });
  if (!timeEntry) {
    throw new Response('Not Found', { status: 404 });
  }

  if (request.method === 'DELETE') {
    await deleteTimeEntry({ userId, id: params.timeEntryId });
  } else if (request.method === 'PATCH') {
    const formData = await request.formData();

    const description = (formData.get('description') || undefined) as
      | string
      | undefined;
    const projectId = (formData.get('projectId') || undefined) as
      | string
      | undefined;
    let startTime = (formData.get('startTime') || undefined) as
      | string
      | undefined;
    let endTime = (formData.get('endTime') || undefined) as string | undefined;

    if (
      startTime &&
      typeof startTime === 'string' &&
      Number.isNaN(Date.parse(startTime))
    ) {
      return json(
        {
          errors: {
            projectId: null,
            description: null,
            startTime: 'startTime is invalid',
            endTime: null
          }
        },
        { status: 422 }
      );
    }
    if (
      endTime &&
      typeof endTime === 'string' &&
      Number.isNaN(Date.parse(endTime))
    ) {
      return json(
        {
          errors: {
            projectId: null,
            description: null,
            startTime: null,
            endTime: 'endTime is invalid'
          }
        },
        { status: 422 }
      );
    }
    if (
      startTime &&
      endTime &&
      typeof startTime === 'string' &&
      typeof endTime === 'string' &&
      new Date(startTime) > new Date(endTime)
    ) {
      return json(
        {
          errors: {
            projectId: null,
            description: null,
            startTime: 'startTime must be before endTime',
            endTime: 'startTime must be before endTime'
          }
        },
        { status: 422 }
      );
    }

    await updateTimeEntry({
      timeEntryId: params.timeEntryId,
      description,
      projectId,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined
    });
  }

  return redirect('/time-entries');
}

interface ItemProps extends React.ComponentPropsWithoutRef<'div'> {
  id: string;
  label: string;
  color: string;
}

const SelectItem = React.forwardRef<HTMLDivElement, ItemProps>(
  ({ label, color, id, ...others }: ItemProps, ref) => (
    <div key={id} ref={ref} {...others}>
      <Group noWrap>
        <ColorSwatch color={color} />
        <Text size="sm">{label}</Text>
      </Group>
    </div>
  )
);

const LayoutWrapper = ({ children }: React.PropsWithChildren<{}>) => {
  const theme = useMantineTheme();
  const navigate = useNavigate();

  return (
    <Drawer
      opened
      position="right"
      title="Edit Time Entry"
      padding="xl"
      size="xl"
      overlayColor={
        theme.colorScheme === 'dark'
          ? theme.colors.dark[9]
          : theme.colors.gray[2]
      }
      overlayOpacity={0.55}
      overlayBlur={3}
      onClose={() => {
        navigate('/time-entries');
      }}
    >
      {children}
    </Drawer>
  );
};

export default function TimeEntryDetailsPage() {
  const actionData = useActionData<typeof action>();
  const data = useLoaderData<typeof loader>();
  const theme = useMantineTheme();

  const descriptionRef = React.useRef<HTMLTextAreaElement>(null);
  const startDateRef = React.useRef<HTMLInputElement>(null);
  const endDateRef = React.useRef<HTMLInputElement>(null);
  const projectRef = React.useRef<HTMLInputElement>(null);

  const [start, setStart] = React.useState<Date>(
    new Date(data.timeEntry.startTime || Date.now())
  );
  const [end, setEnd] = React.useState<Date | undefined>(
    data.timeEntry.endTime ? new Date(data.timeEntry.endTime) : undefined
  );

  React.useEffect(() => {
    if (actionData?.errors?.description) {
      descriptionRef.current?.focus();
    } else if (actionData?.errors?.startTime) {
      startDateRef.current?.focus();
    } else if (actionData?.errors?.endTime) {
      endDateRef.current?.focus();
    } else if (actionData?.errors?.projectId) {
      projectRef.current?.focus();
    }
  }, [actionData]);

  return (
    <LayoutWrapper>
      <Form
        method="patch"
        noValidate
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          width: '100%'
        }}
      >
        <Textarea
          mb={12}
          withAsterisk
          label="Description"
          placeholder="What are you working on?"
          id="new-description"
          ref={descriptionRef}
          defaultValue={data.timeEntry.description}
          required
          autoFocus={true}
          name="description"
          aria-invalid={actionData?.errors?.description ? true : undefined}
          error={actionData?.errors?.description}
          errorProps={{ children: actionData?.errors?.description }}
        />

        <Select
          id="new-project"
          ref={projectRef}
          name="projectId"
          mb={12}
          label="Project"
          defaultValue={data.timeEntry.projectId}
          placeholder="Select project"
          searchable
          nothingFound="No options"
          required
          withAsterisk
          maxDropdownHeight={400}
          data={data.projects.projects.map((project) => ({
            label: project.name,
            value: project.id,
            color: project.color
          }))}
          itemComponent={SelectItem}
          filter={(value, item) =>
            item.label?.toLowerCase().includes(value.toLowerCase().trim()) ||
            item.value.toLowerCase().includes(value.toLowerCase().trim())
          }
          aria-invalid={actionData?.errors?.projectId ? true : undefined}
          error={actionData?.errors?.projectId}
          errorProps={{ children: actionData?.errors?.projectId }}
        />

        <Stack>
          <label
            htmlFor="new-startTime"
            style={{
              margin: '1rem 0 -0.5rem 0'
            }}
          >
            Start
          </label>
          <Group
            align="flex-end"
            sx={{
              flexWrap: 'nowrap'
            }}
          >
            <DatePicker
              id="new-startTime-date"
              ref={startDateRef}
              name="startTime-date"
              allowFreeInput
              withAsterisk
              clearable={false}
              inputFormat="DD/MM/YYYY"
              labelFormat="MM/YYYY"
              aria-labelledby="new-startTime-label"
              locale="it"
              placeholder="Start date"
              label="Start date"
              aria-invalid={actionData?.errors?.startTime ? true : undefined}
              error={actionData?.errors?.startTime}
              errorProps={{ children: actionData?.errors?.startTime }}
              value={start}
              onChange={(date) => {
                if (!date) return;
                let newDate = new Date(start);
                newDate.setFullYear(date.getFullYear());
                newDate.setMonth(date.getMonth());
                newDate.setDate(date.getDate());
                setStart(newDate);
              }}
            />
            <TimeInput
              id="new-startTime-time"
              ref={startDateRef}
              name="startTime-time"
              withAsterisk
              withSeconds
              clearable={false}
              aria-labelledby="new-startTime-label"
              label="Start time"
              value={start}
              onChange={(date) => {
                let newDate = new Date(start);
                newDate.setHours(date.getHours());
                newDate.setMinutes(date.getMinutes());
                setStart(newDate);
              }}
              aria-invalid={actionData?.errors?.startTime ? true : undefined}
              error={actionData?.errors?.startTime}
              errorProps={{ children: actionData?.errors?.startTime }}
            />
          </Group>
          <input type="hidden" name="startTime" value={start.toISOString()} />
        </Stack>

        <Stack>
          <label
            htmlFor="new-endTime"
            style={{
              margin: '1rem 0 -0.5rem 0'
            }}
          >
            End
          </label>
          <Group
            align="flex-end"
            sx={{
              flexWrap: 'nowrap'
            }}
          >
            <DatePicker
              id="new-endTime-date"
              ref={endDateRef}
              name="endTime-date"
              allowFreeInput
              clearable={true}
              inputFormat="DD/MM/YYYY"
              labelFormat="MM/YYYY"
              aria-labelledby="new-endTime-label"
              locale="it"
              placeholder="End date"
              label="End date"
              aria-invalid={actionData?.errors?.endTime ? true : undefined}
              error={actionData?.errors?.endTime}
              errorProps={{ children: actionData?.errors?.endTime }}
              value={end}
              onChange={(date) => {
                if (!date) return;
                let newDate = new Date(end || start);
                newDate.setFullYear(date.getFullYear());
                newDate.setMonth(date.getMonth());
                newDate.setDate(date.getDate());
                setEnd(newDate);
              }}
            />
            <TimeInput
              id="new-endTime-time"
              ref={endDateRef}
              name="endTime-time"
              withAsterisk
              withSeconds
              clearable={false}
              aria-labelledby="new-endTime-label"
              label="End time"
              value={end}
              onChange={(date) => {
                let newDate = new Date(end || start);
                newDate.setHours(date.getHours());
                newDate.setMinutes(date.getMinutes());
                setEnd(newDate);
              }}
              aria-invalid={actionData?.errors?.endTime ? true : undefined}
              error={actionData?.errors?.endTime}
              errorProps={{ children: actionData?.errors?.endTime }}
            />
          </Group>
          {end && (
            <input type="hidden" name="endTime" value={end.toISOString()} />
          )}
        </Stack>

        <Group position="left" mt="lg">
          <Button type="submit" leftIcon={<Save />} radius={theme.radius.md}>
            Save
          </Button>
        </Group>
      </Form>

      <section style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        <Form method="delete">
          <input
            type="hidden"
            name="endTime"
            value={new Date().toISOString()}
          />
          <Button
            type="submit"
            variant="outline"
            color="red"
            leftIcon={<Trash />}
            radius={theme.radius.md}
          >
            Delete
          </Button>
        </Form>
      </section>

      {!end && (
        <section style={{ marginTop: '1rem', marginBottom: '1rem' }}>
          <Form method="patch">
            <input
              type="hidden"
              name="endTime"
              value={new Date().toISOString()}
            />
            <Button
              type="submit"
              variant="subtle"
              radius={theme.radius.md}
              leftIcon={
                <div
                  style={{
                    backgroundColor: theme.colors.red[7],
                    color: 'white',
                    width: '1.75rem',
                    height: '1.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%'
                  }}
                >
                  <Square size={12} fill="currentColor" />
                </div>
              }
            >
              Stop running time entry
            </Button>
          </Form>
        </section>
      )}
    </LayoutWrapper>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return (
    <LayoutWrapper>
      <Alert icon={<AlertTriangle size={14} />} title="Error" color="red">
        An unexpected error occurred: {error.message}
      </Alert>
    </LayoutWrapper>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return (
      <LayoutWrapper>
        <Alert icon={<AlertTriangle size={14} />} title="Error" color="red">
          Not found
        </Alert>
      </LayoutWrapper>
    );
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}
