import {
  Drawer,
  TextInput,
  useMantineTheme,
  Group,
  Button,
  Textarea,
  ColorInput,
  Alert,
  ActionIcon
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
import { AlertTriangle, RefreshCcw, Save } from 'react-feather';
import { createProject, Project } from '~/models/project.server';
import { requireUserId } from '~/session.server';

export const meta: MetaFunction = () => {
  return {
    title: 'New Project | WorkTimer',
    description: 'Create a new project. You must be logged in to do this.'
  };
};

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request);
  if (!userId) return redirect('/projects');
  return json({});
}

export async function action({ request }: ActionArgs) {
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const name = formData.get('name');
  const description = formData.get('description');
  const color = formData.get('color');

  if (typeof name !== 'string' || name.length === 0) {
    return json(
      {
        errors: {
          name: 'name is required',
          description: null,
          color: null
        }
      },
      { status: 400 }
    );
  }
  if (description && typeof description !== 'string') {
    return json(
      {
        errors: {
          name: null,
          description: 'Description is invalid',
          color: null
        }
      },
      { status: 422 }
    );
  }
  if (typeof color !== 'string' || color.length === 0) {
    return json(
      {
        errors: {
          name: null,
          description: null,
          color: 'color is required'
        }
      },
      { status: 400 }
    );
  }

  const project = await createProject({
    name,
    description,
    color,
    userId
  });

  return redirect(`/projects`);
}

const LayoutWrapper = ({ children }: React.PropsWithChildren<{}>) => {
  const theme = useMantineTheme();
  const navigate = useNavigate();

  return (
    <Drawer
      opened
      position="right"
      title="New Project"
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

export default function NewProjectPage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const theme = useMantineTheme();

  const nameRef = React.useRef<HTMLInputElement>(null);
  const descriptionRef = React.useRef<HTMLTextAreaElement>(null);
  const colorRef = React.useRef<HTMLInputElement>(null);

  const [color, setColor] = React.useState<Project['color']>(randomColor());

  React.useEffect(() => {
    if (actionData?.errors?.name) {
      nameRef.current?.focus();
    } else if (actionData?.errors?.description) {
      descriptionRef.current?.focus();
    } else if (actionData?.errors?.color) {
      colorRef.current?.focus();
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
          aria-invalid={actionData?.errors?.name ? true : undefined}
          error={actionData?.errors?.name}
          errorProps={{ children: actionData?.errors?.name }}
        />

        <Textarea
          mb={12}
          label="Description"
          placeholder="What is this project about?"
          id="new-description"
          ref={descriptionRef}
          name="description"
          aria-invalid={actionData?.errors?.description ? true : undefined}
          error={actionData?.errors?.description}
          errorProps={{ children: actionData?.errors?.description }}
        />

        <ColorInput
          label="Color"
          placeholder="The color of your project"
          id="new-color"
          name="color"
          ref={colorRef}
          withPicker={false}
          withEyeDropper
          withAsterisk
          swatchesPerRow={6}
          swatches={Object.keys(theme.colors).map(
            (color) => theme.colors[color][6]
          )}
          rightSection={
            <ActionIcon onClick={() => setColor(randomColor())}>
              <RefreshCcw size={16} />
            </ActionIcon>
          }
          value={color}
          onChange={setColor}
          closeOnColorSwatchClick
          format="hex"
          required
          aria-invalid={actionData?.errors?.color ? true : undefined}
          error={actionData?.errors?.color}
          errorProps={{ children: actionData?.errors?.color }}
        />

        <Group position="left" mt="lg">
          <Button type="submit" leftIcon={<Save />} radius={theme.radius.md}>
            Create
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
