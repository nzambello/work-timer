import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import {
  Form,
  Link,
  useActionData,
  useCatch,
  useNavigate,
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
  Drawer,
  Popover,
  Progress,
  useMantineTheme,
  Alert
} from '@mantine/core';
import { AlertTriangle, AtSign, Check, Lock, X } from 'react-feather';
import { requireUser } from '~/session.server';
import { createUser, getUserByEmail } from '~/models/user.server';
import { safeRedirect, validateEmail } from '~/utils';

export async function loader({ request }: LoaderArgs) {
  const loggedUser = await requireUser(request);
  if (!loggedUser || !loggedUser.admin) return redirect('/login');

  return json({});
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const email = formData.get('email');
  const password = formData.get('password');
  const confirmPassword = formData.get('confirmPassword');

  if (!validateEmail(email)) {
    return json(
      {
        errors: {
          email: 'Email is invalid',
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
          email: null,
          password: 'Password is required',
          confirmPassword: null
        }
      },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return json(
      {
        errors: {
          email: null,
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
          email: null,
          password: 'Passwords do not match',
          confirmPassword: 'Passwords do not match'
        }
      },
      { status: 400 }
    );
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return json(
      {
        errors: {
          email: 'A user already exists with this email',
          password: null,
          confirmPassword: null
        }
      },
      { status: 400 }
    );
  }

  await createUser(email, password);

  return redirect('/users');
}

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

const LayoutWrapper = ({ children }: React.PropsWithChildren<{}>) => {
  const theme = useMantineTheme();
  const navigate = useNavigate();

  return (
    <Drawer
      opened
      position="right"
      title="New user"
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
        navigate('/users');
      }}
    >
      {children}
    </Drawer>
  );
};

export default function SignUpPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? undefined;
  const actionData = useActionData<typeof action>();
  const emailRef = React.useRef<HTMLInputElement>(null);
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
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  return (
    <LayoutWrapper>
      <Form method="post" noValidate>
        <TextInput
          mb={12}
          withAsterisk
          label="Email address"
          placeholder="your@email.com"
          icon={<AtSign size={16} />}
          id="email"
          ref={emailRef}
          required
          autoFocus={true}
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={actionData?.errors?.email ? true : undefined}
          error={actionData?.errors?.email}
          errorProps={{ children: actionData?.errors?.email }}
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
                withAsterisk
                required
                label="Password"
                id="password"
                ref={passwordRef}
                placeholder="********"
                icon={<Lock size={16} />}
                name="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={actionData?.errors?.password ? true : undefined}
                error={actionData?.errors?.password ? true : undefined}
              />
              {actionData?.errors?.password && (
                <Text color="red" size="sm" mb={12}>
                  {actionData?.errors?.password}
                </Text>
              )}
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
          withAsterisk
          required
          label="Confirm password"
          id="confirm-password"
          ref={passwordRef}
          placeholder="********"
          icon={<Lock size={16} />}
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={actionData?.errors?.confirmPassword ? true : undefined}
          error={actionData?.errors?.confirmPassword ? true : undefined}
        />
        {actionData?.errors?.confirmPassword && (
          <Text color="red" size="sm" mb={12}>
            {actionData?.errors?.confirmPassword}
          </Text>
        )}

        <Group position="center" mt="xl">
          <Button type="submit">Create user</Button>
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
