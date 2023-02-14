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
  ColorInput,
  ActionIcon,
  Input,
  ColorPicker
} from '@mantine/core';
import {
  AlertTriangle,
  Delete,
  Play,
  RefreshCcw,
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
import {
  deleteProject,
  getProject,
  getProjects,
  Project,
  updateProject
} from '~/models/project.server';
import { DatePicker, TimeInput } from '@mantine/dates';

export const meta: MetaFunction = () => {
  return {
    title: 'Edit Project | WorkTimer',
    description: 'Edit a project. You must be logged in to do this.'
  };
};

export async function loader({ request, params }: LoaderArgs) {
  const userId = await requireUserId(request);
  invariant(params.projectId, 'projectId not found');

  const project = await getProject({ userId, id: params.projectId });
  if (!project) {
    throw new Response('Not Found', { status: 404 });
  }

  return json({ project });
}

export async function action({ request, params }: ActionArgs) {
  const userId = await requireUserId(request);
  invariant(params.projectId, 'projectId not found');

  const project = await getProject({ userId, id: params.projectId });
  if (!project) {
    throw new Response('Not Found', { status: 404 });
  }

  if (request.method === 'DELETE') {
    await deleteProject({ userId, id: params.projectId });
  } else if (request.method === 'PATCH') {
    const formData = await request.formData();

    const name = (formData.get('name') || undefined) as string | undefined;
    const description = (formData.get('description') || undefined) as
      | string
      | undefined;
    let color = (formData.get('color') || undefined) as string | undefined;

    await updateProject({
      projectId: params.projectId,
      name,
      description,
      color
    });
  }

  return redirect('/projects');
}

const LayoutWrapper = ({ children }: React.PropsWithChildren<{}>) => {
  const theme = useMantineTheme();
  const navigate = useNavigate();

  return (
    <Drawer
      opened
      position="right"
      title="Edit Project"
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
        navigate('/projects');
      }}
    >
      {children}
    </Drawer>
  );
};

const randomColor = () =>
  `#${Math.floor(Math.random() * 16777215).toString(16)}`;

export default function ProjectDetailsPage() {
  const actionData = useActionData<typeof action>();
  const data = useLoaderData<typeof loader>();
  const theme = useMantineTheme();

  const nameRef = React.useRef<HTMLInputElement>(null);
  const descriptionRef = React.useRef<HTMLTextAreaElement>(null);
  const colorRef = React.useRef<HTMLInputElement>(null);

  const [color, setColor] = React.useState<Project['color']>(
    data.project.color || randomColor()
  );

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
        <TextInput
          mb={12}
          withAsterisk
          label="Name"
          placeholder="The name of your project"
          id="new-name"
          ref={nameRef}
          required
          autoFocus={true}
          name="name"
          defaultValue={data.project.name}
        />

        <Textarea
          mb={12}
          label="Description"
          placeholder="What is this project about?"
          id="new-description"
          ref={descriptionRef}
          name="description"
          defaultValue={data.project.description || undefined}
        />

        <Input.Wrapper
          label="Color"
          placeholder="The color of your project"
          id="new-color"
          withAsterisk
          required
        >
          <Group>
            <ColorSwatch color={color} size={40} />
            <Group
              style={{
                gap: 8,
                maxWidth: 200
              }}
            >
              {Object.keys(theme.colors)
                .filter((c) => c !== 'dark' && c !== 'grape')
                .map((c) => (
                  <ColorSwatch
                    color={c}
                    key={c}
                    onClick={() => {
                      setColor(c);
                    }}
                    style={{
                      cursor: 'pointer',
                      border: `1px solid ${
                        c === color ? 'white' : 'transparent'
                      }`
                    }}
                  />
                ))}
            </Group>
          </Group>
          <input type="hidden" ref={colorRef} name="color" value={color} />
        </Input.Wrapper>

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
