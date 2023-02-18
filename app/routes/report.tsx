import { Box, Paper } from '@mantine/core';
import { MetaFunction, LoaderArgs, redirect, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { getTimeEntries } from '~/models/timeEntry.server';
import { requireUserId } from '~/session.server';

export const meta: MetaFunction = () => {
  return {
    title: 'Report | WorkTimer',
    description:
      'Generate a report of your time entries. You must be logged in to do this.'
  };
};

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request);
  if (!userId) return redirect('/login');

  return json({
    ...(await getTimeEntries({
      userId
    }))
  });
}

export default function ReportPage() {
  const data = useLoaderData();

  return (
    <>
      <h1>Report</h1>
      <Paper p="lg" radius="md">
        Coming soon
      </Paper>
    </>
  );
}
