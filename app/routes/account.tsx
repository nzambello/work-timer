import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import {
  Form,
  Link,
  Outlet,
  useActionData,
  useLoaderData,
  useSearchParams
} from '@remix-run/react';
import * as React from 'react';
import {
  TextInput,
  Box,
  Group,
  Button,
  PasswordInput,
  Text,
  Title,
  Popover,
  Progress,
  Modal,
  Badge
} from '@mantine/core';
import { AtSign, Check, Lock, Save, Trash, X } from 'react-feather';
import { requireUser } from '~/session.server';
import { updateUserEmail } from '~/models/user.server';
import { validateEmail } from '~/utils';

export async function loader({ request }: LoaderArgs) {
  const user = await requireUser(request);
  if (!user) return redirect('/login');

  return json({ user });
}

export async function action({ request }: ActionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const email = formData.get('email');

  if (!validateEmail(email)) {
    return json(
      {
        errors: {
          email: 'Email is invalid'
        },
        user
      },
      { status: 400 }
    );
  }

  await updateUserEmail(user.id, email);

  return redirect('/account/updatesuccess');
}

export const meta: MetaFunction = () => {
  return {
    title: 'Account | WorkTimer',
    description:
      'Manage your account settings and change your password for WorkTimer'
  };
};

export default function Account() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();

  const emailRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    }
  }, [actionData]);

  return (
    <Box sx={{ maxWidth: 300 }} mx="auto">
      <Title order={2} my="lg">
        Account
      </Title>

      {loaderData.user.admin && (
        <Text>
          Role:{' '}
          <Badge variant="light" mb="md">
            ADMIN
          </Badge>
        </Text>
      )}

      <Form method="post" noValidate>
        <TextInput
          mb={12}
          label="Email address"
          placeholder="your@email.com"
          icon={<AtSign size={16} />}
          id="email"
          ref={emailRef}
          autoFocus={true}
          defaultValue={actionData?.user?.email || loaderData?.user?.email}
          name="email"
          type="email"
          autoComplete="off"
          aria-invalid={actionData?.errors?.email ? true : undefined}
          error={actionData?.errors?.email}
          errorProps={{ children: actionData?.errors?.email }}
        />

        <Group position="center" mt="sm">
          <Button type="submit" leftIcon={<Save size={14} />}>
            Update email
          </Button>
        </Group>
      </Form>

      <Outlet />

      <Group position="center" mt="xl">
        <Button
          component={Link}
          to="/account/updatepassword"
          variant="light"
          leftIcon={<Lock size={14} />}
        >
          Change password
        </Button>
      </Group>

      <Group position="center" mt="md">
        <Button
          component={Link}
          to="/account/delete"
          variant="light"
          color="red"
          leftIcon={<Trash size={14} />}
        >
          Delete account
        </Button>
      </Group>
    </Box>
  );
}
