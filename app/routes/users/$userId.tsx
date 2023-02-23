import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigate,
  useParams
} from '@remix-run/react';
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
import {
  deleteUserByEmail,
  deleteUserById,
  getUserById,
  verifyLogin
} from '~/models/user.server';
import invariant from 'tiny-invariant';

export async function loader({ request, params }: LoaderArgs) {
  invariant(params.userId, 'userId is required');

  const loggedUser = await requireUser(request);
  if (!loggedUser || !loggedUser.admin) return redirect('/login');

  const user = await getUserById(params.userId);

  return json({ user });
}

export async function action({ request, params }: ActionArgs) {
  invariant(params.userId, 'userId is required');

  const loggedUser = await requireUser(request);
  if (!loggedUser || !loggedUser.admin)
    return redirect('/login?redirectTo=/users');

  if (request.method !== 'DELETE') {
    return json(
      {
        errors: {
          request: 'Invalid request'
        }
      },
      { status: 422 }
    );
  }

  const user = await getUserById(params.userId);
  if (!user) {
    return json(
      {
        errors: {
          request: 'User not found'
        }
      },
      { status: 404 }
    );
  }

  await deleteUserById(user.id);

  return redirect('/users');
}

export const meta: MetaFunction = () => {
  return {
    title: 'Users | WorkTimer',
    description:
      'Manage users and their permissions. Delete users and their data.'
  };
};

export default function AccountDelete() {
  const loaderData = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <Modal opened={true} onClose={() => navigate('/users')} title="Delete user">
      <Alert
        color="orange"
        icon={<AlertTriangle size={16} />}
        radius="md"
        mb="md"
        title="Are you sure?"
      >
        This action cannot be undone. All of the user's data will be permanently
        deleted.
      </Alert>

      <Text size="sm" mb="md">
        User: {loaderData.user?.email}
      </Text>

      <Form method="delete" noValidate>
        <Group position="center" mt="xl">
          <Button type="submit" color="red" leftIcon={<Trash size={14} />}>
            Delete account
          </Button>
        </Group>
      </Form>
    </Modal>
  );
}
