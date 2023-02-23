import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData, useNavigate } from '@remix-run/react';
import * as React from 'react';
import {
  Box,
  Group,
  Button,
  PasswordInput,
  Text,
  Popover,
  Progress,
  Modal
} from '@mantine/core';
import { Check, Lock, Save, X } from 'react-feather';
import { requireUser } from '~/session.server';
import { updateUserPassword, verifyLogin } from '~/models/user.server';

export async function loader({ request }: LoaderArgs) {
  const user = await requireUser(request);
  if (!user) return redirect('/login');

  return json({ user });
}

export async function action({ request }: ActionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const currentPassword = formData.get('currentPassword');
  const password = formData.get('password');
  const confirmPassword = formData.get('confirmPassword');

  if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
    return json(
      {
        errors: {
          currentPassword: 'Current password is required',
          password: null,
          confirmPassword: null
        }
      },
      { status: 400 }
    );
  }

  if (typeof password !== 'string' || password.length === 0) {
    return json(
      {
        errors: {
          currentPassword: null,
          password: 'Password is required',
          confirmPassword: null
        }
      },
      { status: 400 }
    );
  }

  if (typeof confirmPassword !== 'string' || confirmPassword.length === 0) {
    return json(
      {
        errors: {
          currentPassword: null,
          password: null,
          confirmPassword: 'Confirm password is required'
        }
      },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return json(
      {
        errors: {
          currentPassword: null,
          password: 'Password is too short',
          confirmPassword: null
        }
      },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return json(
      {
        errors: {
          currentPassword: null,
          password: 'Passwords do not match',
          confirmPassword: 'Passwords do not match'
        }
      },
      { status: 400 }
    );
  }

  const verifiedUser = await verifyLogin(user.email, currentPassword);

  if (!verifiedUser) {
    return json(
      {
        errors: {
          currentPassword: 'Current password is incorrect',
          password: null,
          confirmPassword: null
        }
      },
      { status: 400 }
    );
  }

  await updateUserPassword(user.id, password);

  return redirect('/account/updatesuccess');
}

export const meta: MetaFunction = () => {
  return {
    title: 'Account | WorkTimer',
    description:
      'Manage your account settings and change your password for WorkTimer'
  };
};

function PasswordRequirement({
  meets,
  label
}: {
  meets: boolean;
  label: string;
}) {
  return (
    <Text
      color={meets ? 'teal' : 'red'}
      sx={{ display: 'flex', alignItems: 'center' }}
      mt={7}
      size="sm"
    >
      {meets ? <Check size={14} /> : <X size={14} />} <Box ml={10}>{label}</Box>
    </Text>
  );
}

const requirements = [
  { re: /[0-9]/, label: 'Includes number' },
  { re: /[a-z]/, label: 'Includes lowercase letter' },
  { re: /[A-Z]/, label: 'Includes uppercase letter' },
  { re: /[$&+,:;=?@#|'<>.^*()%!-]/, label: 'Includes special symbol' }
];

function getStrength(password: string) {
  let multiplier = password.length > 7 ? 0 : 1;

  requirements.forEach((requirement) => {
    if (!requirement.re.test(password)) {
      multiplier += 1;
    }
  });

  return Math.max(100 - (100 / (requirements.length + 1)) * multiplier, 10);
}

export default function AccountUpdatePassword() {
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();

  const passwordRef = React.useRef<HTMLInputElement>(null);

  const [popoverOpened, setPopoverOpened] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const checks = requirements.map((requirement, index) => (
    <PasswordRequirement
      key={index}
      label={requirement.label}
      meets={requirement.re.test(password)}
    />
  ));

  const strength = getStrength(password);
  const color = strength === 100 ? 'teal' : strength > 50 ? 'yellow' : 'red';

  React.useEffect(() => {
    if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  return (
    <Modal
      opened={true}
      onClose={() => navigate('/account')}
      title="Change password"
    >
      <Form method="post" noValidate>
        <PasswordInput
          mb={12}
          label="Current password"
          id="current-password"
          ref={passwordRef}
          placeholder="********"
          icon={<Lock size={16} />}
          name="currentPassword"
          type="password"
          autoComplete="off"
          aria-invalid={actionData?.errors?.password ? true : undefined}
          error={actionData?.errors?.password ? true : undefined}
          errorProps={{ children: actionData?.errors?.password }}
        />

        <Popover
          opened={popoverOpened}
          position="bottom"
          width="target"
          transition="pop"
        >
          <Popover.Target>
            <div
              onFocusCapture={() => setPopoverOpened(true)}
              onBlurCapture={() => setPopoverOpened(false)}
            >
              <PasswordInput
                mb={12}
                label="New password"
                id="password"
                ref={passwordRef}
                placeholder="********"
                icon={<Lock size={16} />}
                name="password"
                type="password"
                autoComplete="off"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={actionData?.errors?.password ? true : undefined}
                error={actionData?.errors?.password ? true : undefined}
                errorProps={{ children: actionData?.errors?.password }}
              />
            </div>
          </Popover.Target>
          <Popover.Dropdown>
            <Progress
              color={color}
              value={strength}
              size={5}
              style={{ marginBottom: 10 }}
            />
            <PasswordRequirement
              label="Includes at least 8 characters"
              meets={password.length > 7}
            />
            {checks}
          </Popover.Dropdown>
        </Popover>

        <PasswordInput
          mb={12}
          label="Confirm new password"
          id="confirm-password"
          ref={passwordRef}
          placeholder="********"
          icon={<Lock size={16} />}
          name="confirmPassword"
          type="password"
          autoComplete="off"
          aria-invalid={actionData?.errors?.confirmPassword ? true : undefined}
          error={actionData?.errors?.confirmPassword ? true : undefined}
          errorProps={{ children: actionData?.errors?.confirmPassword }}
        />
        <Group position="center" mt="xl">
          <Button type="submit" leftIcon={<Save size={14} />}>
            Update password
          </Button>
        </Group>
      </Form>
    </Modal>
  );
}
