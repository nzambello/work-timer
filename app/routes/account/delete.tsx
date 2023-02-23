import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData, useNavigate } from '@remix-run/react';
import * as React from 'react';
import {
  Group,
  Button,
  PasswordInput,
  Modal,
  Alert,
  Text
} from '@mantine/core';
import { AlertTriangle, Lock, Trash } from 'react-feather';
import { requireUser } from '~/session.server';
import { deleteUserByEmail, verifyLogin } from '~/models/user.server';

export async function loader({ request }: LoaderArgs) {
  const user = await requireUser(request);
  if (!user) return redirect('/login');

  return json({ user });
}

export async function action({ request }: ActionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const password = formData.get('password');

  if (request.method !== 'DELETE') {
    return json(
      {
        errors: {
          password: 'Invalid request'
        }
      },
      { status: 422 }
    );
  }

  if (typeof password !== 'string' || password.length === 0) {
    return json(
      {
        errors: {
          password: 'Password is required'
        }
      },
      { status: 400 }
    );
  }

  const verifiedUser = await verifyLogin(user.email, password);
  if (!verifiedUser) {
    return json(
      {
        errors: {
          password: 'Password is incorrect'
        }
      },
      { status: 400 }
    );
  }

  await deleteUserByEmail(user.email);

  return redirect('/account/deleted');
}

export const meta: MetaFunction = () => {
  return {
    title: 'Account | WorkTimer',
    description:
      'Manage your account settings and change your password for WorkTimer'
  };
};

export default function AccountDelete() {
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();

  const passwordRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  return (
    <Modal
      opened={true}
      onClose={() => navigate('/account')}
      title="Delete account"
    >
      <Alert
        color="orange"
        icon={<AlertTriangle size={16} />}
        radius="md"
        mb="md"
        title="Are you sure?"
      >
        This action cannot be undone. All of your data will be permanently
        deleted.
      </Alert>

      <Form method="delete" noValidate>
        <PasswordInput
          mb={12}
          label="Password confirmation"
          id="current-password"
          ref={passwordRef}
          placeholder="Type your password to confirm"
          icon={<Lock size={16} />}
          name="password"
          type="password"
          autoComplete="off"
          aria-invalid={actionData?.errors?.password ? true : undefined}
          error={actionData?.errors?.password ? true : undefined}
        />
        {actionData?.errors?.password && (
          <Text color="red" size="sm" mb={12}>
            {actionData?.errors?.password}
          </Text>
        )}

        <Group position="center" mt="xl">
          <Button type="submit" color="red" leftIcon={<Trash size={14} />}>
            Delete account
          </Button>
        </Group>
      </Form>
    </Modal>
  );
}
