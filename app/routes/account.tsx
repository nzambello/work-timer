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
  Badge,
  Select,
  NumberInput
} from '@mantine/core';
import { AtSign, Check, Lock, Save, Trash, X } from 'react-feather';
import { requireUser } from '~/session.server';
import { updateUserEmail, updateUserPrefs } from '~/models/user.server';
import { validateEmail } from '~/utils';

export async function loader({ request }: LoaderArgs) {
  const user = await requireUser(request);
  if (!user) return redirect('/login');

  return json({ user });
}

export async function action({ request }: ActionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const email = (formData.get('email') || undefined) as string | undefined;
  const dateFormat = (formData.get('dateFormat') || undefined) as
    | string
    | undefined;
  const currency = (formData.get('currency') || undefined) as
    | string
    | undefined;
  const defaultHourlyRate = (formData.get('defaultHourlyRate') || undefined) as
    | string
    | undefined;

  if (email && !validateEmail(email)) {
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

  if (email && email !== user.email) {
    await updateUserEmail(user.id, email);
  }

  const prefs = {
    dateFormat:
      dateFormat && dateFormat !== user.dateFormat ? dateFormat : undefined,
    currency: currency && currency !== user.currency ? currency : undefined,
    defaultHourlyRate:
      defaultHourlyRate &&
      parseInt(defaultHourlyRate || '-1', 10) !== user.defaultHourlyRate
        ? parseInt(defaultHourlyRate, 10)
        : undefined
  };

  if (Object.values(prefs).some((v) => v !== undefined)) {
    await updateUserPrefs(user.id, prefs);
  }

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

  const [dateFormat, setDateFormat] = React.useState(
    loaderData.user.dateFormat
  );

  const [isHydrated, setIsHydrated] = React.useState(false);
  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <Box sx={{ maxWidth: 300 }} mx="auto">
      <Title order={2} my="lg">
        Account
      </Title>

      <Outlet />

      {loaderData.user.admin && (
        <Text mt="lg">
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

      <Title order={3} mt="xl" mb="lg">
        Preferences
      </Title>

      <Form method="post" noValidate>
        <Select
          name="dateFormat"
          searchable
          clearable={false}
          label="Date format"
          placeholder="Select date format"
          defaultValue={dateFormat}
          value={dateFormat}
          onChange={(value) =>
            setDateFormat(value || loaderData.user.dateFormat)
          }
          data={Intl.DateTimeFormat.supportedLocalesOf([
            'en-GB',
            'en-US',
            'it-IT',
            'de-DE',
            'fr-FR',
            'es-ES',
            'pt-BR',
            'ja-JP',
            'zh-CN',
            'zh-TW',
            'ko-KR',
            'uk-UA',
            'ru-RU'
          ])}
        />

        {isHydrated && (
          <p>
            Example:{' '}
            {Intl.DateTimeFormat(dateFormat, {
              dateStyle: 'full',
              timeStyle: 'short',
              timeZone: 'UTC'
            }).format(new Date(Date.now()))}
          </p>
        )}

        <TextInput
          name="currency"
          label="Currency"
          placeholder="Select your currency"
          defaultValue={loaderData.user.currency}
          mb="lg"
        />

        <NumberInput
          name="defaultHourlyRate"
          label="Hourly rate"
          placeholder="Enter your hourly rate"
          defaultValue={loaderData.user.defaultHourlyRate || undefined}
          min={0}
          mb="lg"
        />

        <Group position="center" mt="lg">
          <Button type="submit" leftIcon={<Save size={14} />}>
            Save
          </Button>
        </Group>
      </Form>
    </Box>
  );
}
