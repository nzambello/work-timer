import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import {
  Form,
  Link,
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
  Title
} from '@mantine/core';
import { AtSign, Lock } from 'react-feather';
import { countUsers, verifyLogin } from '~/models/user.server';
import { createUserSession, getUserId } from '~/session.server';
import { safeRedirect, validateEmail } from '~/utils';
import { isSignupAllowed } from '~/config.server';

export async function loader({ request }: LoaderArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect('/time-entries');

  const isFirstUser = (await countUsers()) === 0;
  if (isFirstUser) return redirect('/signup');

  return json({
    ALLOW_USER_SIGNUP: await isSignupAllowed()
  });
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const email = formData.get('email');
  const password = formData.get('password');
  const redirectTo = safeRedirect(formData.get('redirectTo'), '/');
  const remember = formData.get('remember');

  if (!validateEmail(email)) {
    return json(
      { errors: { email: 'Email is invalid', password: null } },
      { status: 400 }
    );
  }

  if (typeof password !== 'string' || password.length === 0) {
    return json(
      { errors: { password: 'Password is required', email: null } },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return json(
      { errors: { password: 'Password is too short', email: null } },
      { status: 400 }
    );
  }

  const user = await verifyLogin(email, password);

  if (!user) {
    return json(
      {
        errors: {
          email: 'Invalid email or password',
          password: 'Invalid email or password'
        }
      },
      { status: 400 }
    );
  }

  return createUserSession({
    request,
    userId: user.id,
    remember: remember === 'on' ? true : false,
    redirectTo
  });
}

export const meta: MetaFunction = () => {
  return {
    title: 'Login | WorkTimer',
    description:
      'WorkTimer is a time tracking app. Helps you track your time spent on projects.'
  };
};

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/time-entries';
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  return (
    <Box sx={{ maxWidth: 300 }} mx="auto">
      <Title order={2} my="lg">
        Login
      </Title>
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
          autoComplete="current-password"
          aria-invalid={actionData?.errors?.password ? true : undefined}
          error={actionData?.errors?.password ? true : undefined}
          errorProps={{ children: actionData?.errors?.password }}
        />

        <input type="hidden" name="redirectTo" value={redirectTo} />

        <Group position="center" mt="xl">
          <Button type="submit">Log In</Button>
        </Group>

        {!!loaderData?.ALLOW_USER_SIGNUP && (
          <Box
            mt="md"
            sx={{
              textAlign: 'center'
            }}
          >
            New user?{' '}
            <Link
              to={{
                pathname: '/signup',
                search: searchParams.toString()
              }}
            >
              <strong>Sign up</strong>
            </Link>
          </Box>
        )}
      </Form>
    </Box>
  );
}
