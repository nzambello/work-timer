import {
  Button,
  Paper,
  Checkbox,
  TextInput,
  Alert,
  Container
} from '@mantine/core';
import {
  ActionArgs,
  json,
  LoaderArgs,
  MetaFunction,
  redirect
} from '@remix-run/node';
import { Form, useCatch, useLoaderData } from '@remix-run/react';
import { requireAdminUserId } from '~/session.server';
import { getSettings, updateSetting } from '~/models/settings.server';
import { Settings } from '~/models/settings.server';
import { isSignupAllowed } from '~/config.server';
import { AlertTriangle } from 'react-feather';

export const meta: MetaFunction = () => {
  return {
    title: 'Settings | WorkTimer',
    description:
      'Manage your WorkTimer instance. You must be logged in to do this.'
  };
};

export async function loader({ request }: LoaderArgs) {
  const userId = await requireAdminUserId(request);
  if (!userId) return redirect('/login');

  const settings = await getSettings();

  if (!settings || !settings.find((s) => s.id === 'ALLOW_USER_SIGNUP')) {
    return json({
      settings: [
        ...((settings || []).filter((s) => s.id !== 'ALLOW_USER_SIGNUP') || []),
        {
          id: 'ALLOW_USER_SIGNUP',
          value: (await isSignupAllowed()) ? 'true' : 'false'
        }
      ]
    });
  }

  return json({
    settings
  });
}

export async function action({ request }: ActionArgs) {
  await requireAdminUserId(request);

  const formData = await request.formData();
  const id = (formData.get('id') || undefined) as string | undefined;
  const value = (formData.get('value') || undefined) as
    | string
    | boolean
    | undefined;

  if (!id) {
    throw new Response('Missing setting id', { status: 422 });
  }

  let parsedValue;
  if (value === 'true' || value === 'on' || value === true) {
    parsedValue = 'true';
  } else if (value === 'false' || value === 'off' || value === false) {
    parsedValue = 'false';
  } else if (typeof value === 'string') {
    parsedValue = value;
  } else {
    parsedValue = 'false';
  }

  await updateSetting({
    id,
    value: parsedValue
  });

  return redirect('/settings');
}

export default function Settings() {
  const data = useLoaderData<typeof loader>();

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
        Settings
      </h1>

      <div role="region" id="settings">
        <Container size="md">
          {data.settings.map((setting) => (
            <Form method="patch" key={setting.id}>
              <input type="hidden" name="id" value={setting.id} />
              <Paper
                shadow="sm"
                p="md"
                radius="md"
                mb="sm"
                display="flex"
                style={{
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                {['on', 'off', 'true', 'false'].includes(setting.value) ? (
                  <Checkbox
                    label={setting.id}
                    id={setting.id}
                    defaultChecked={
                      setting.value === 'true' || setting.value === 'on'
                    }
                    name="value"
                  />
                ) : (
                  <TextInput
                    label={setting.id}
                    id={setting.id}
                    name="value"
                    defaultValue={setting.value}
                  />
                )}

                <Button size="sm" type="submit">
                  Save
                </Button>
              </Paper>
            </Form>
          ))}
        </Container>
      </div>
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
