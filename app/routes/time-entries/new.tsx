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
  ColorSwatch
} from '@mantine/core';
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
import { AlertTriangle, Play } from 'react-feather';
import { getProjects } from '~/models/project.server';
import { createTimeEntry, stopAllTimeEntries } from '~/models/timeEntry.server';
import { requireUserId } from '~/session.server';
import { DatePicker, TimeInput } from '@mantine/dates';
import { forwardRef } from 'react';

import 'dayjs/locale/it';

export const meta: MetaFunction = () => {
  return {
    title: 'New Time Entry | WorkTimer',
    description: 'Create a new time entry. You must be logged in to do this.'
  };
};

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request);

  return json({
    ...(await getProjects({ userId }))
  });
}

export async function action({ request }: ActionArgs) {
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const description = formData.get('description');
  const projectId = formData.get('projectId');
  let startTime = formData.get('startTime');
  let endTime = formData.get('endTime');

  if (typeof description !== 'string' || description.length === 0) {
    return json(
      {
        errors: {
          projectId: null,
          description: 'Description is required',
          startTime: null,
          endTime: null
        }
      },
      { status: 400 }
    );
  }
  if (typeof projectId !== 'string' || projectId.length === 0) {
    return json(
      {
        errors: {
          projectId: 'projectId is required',
          description: null,
          startTime: null,
          endTime: null
        }
      },
      { status: 400 }
    );
  }
  if (typeof startTime !== 'string' || startTime.length === 0) {
    return json(
      {
        errors: {
          projectId: null,
          description: null,
          startTime: 'startTime is required',
          endTime: null
        }
      },
      { status: 400 }
    );
  }

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

  await stopAllTimeEntries(userId);

  const timeEntry = await createTimeEntry({
    description,
    startTime: new Date(startTime),
    endTime: typeof endTime === 'string' ? new Date(endTime) : null,
    userId,
    projectId
  });

  return redirect(`/time-entries`);
}

interface ItemProps extends React.ComponentPropsWithoutRef<'div'> {
  id: string;
  label: string;
  color: string;
}

const SelectItem = forwardRef<HTMLDivElement, ItemProps>(
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
      title="New Time Entry"
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

export default function NewTimeEntryPage() {
  const actionData = useActionData<typeof action>();
  const data = useLoaderData<typeof loader>();

  const theme = useMantineTheme();

  const descriptionRef = React.useRef<HTMLTextAreaElement>(null);
  const startDateRef = React.useRef<HTMLInputElement>(null);
  const endDateRef = React.useRef<HTMLInputElement>(null);
  const projectRef = React.useRef<HTMLInputElement>(null);

  const [start, setStart] = React.useState(new Date(Date.now()));
  const [end, setEnd] = React.useState<Date | undefined>();

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
        method="post"
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
          placeholder="Select project"
          searchable
          nothingFound="No options"
          required
          withAsterisk
          maxDropdownHeight={400}
          data={data.projects.map((project) => ({
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
          <Group align="flex-end">
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
          <Group align="flex-end">
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
              label="end time"
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
          <Button type="submit" leftIcon={<Play />} radius={theme.radius.md}>
            Start
          </Button>
        </Group>
      </Form>
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
