import {
  Alert,
  Box,
  Button,
  ColorSwatch,
  Flex,
  Group,
  NumberInput,
  Paper,
  Table,
  Title
} from '@mantine/core';
import { MetaFunction, LoaderArgs, redirect, json } from '@remix-run/node';
import { Link, useFetcher, useLoaderData, useNavigate } from '@remix-run/react';
import {
  getTimeEntriesByDateAndProject,
  updateDuration
} from '~/models/timeEntry.server';
import { getProjects, Project } from '~/models/project.server';
import { requireUser } from '~/session.server';
import { DateRangePicker, DateRangePickerValue } from '@mantine/dates';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Calendar } from 'react-feather';
import { useMediaQuery } from '@mantine/hooks';

import 'dayjs/locale/it';

export const meta: MetaFunction = () => {
  return {
    title: 'Reports | WorkTimer',
    description:
      'Generate reports of your time entries. You must be logged in to do this.'
  };
};

export async function loader({ request }: LoaderArgs) {
  const user = await requireUser(request);
  if (!user) return redirect('/login');

  const url = new URL(request.url);
  const dateFrom = url.searchParams.get('dateFrom')
    ? dayjs(url.searchParams.get('dateFrom')).startOf('day').toDate()
    : dayjs().startOf('month').startOf('day').toDate();
  const dateTo = url.searchParams.get('dateTo')
    ? dayjs(url.searchParams.get('dateTo')).endOf('day').toDate()
    : dayjs().endOf('month').endOf('day').toDate();

  await updateDuration(user.id);

  const timeByProject = await getTimeEntriesByDateAndProject({
    userId: user.id,
    dateFrom,
    dateTo
  });

  const total = timeByProject.reduce(
    (acc, curr) => acc + (curr._sum.duration || 0),
    0
  );

  return json({
    user,
    timeByProject,
    total,
    projects: await getProjects({ userId: user.id })
  });
}

export default function ReportPage() {
  const data = useLoaderData<typeof loader>();
  const reports = useFetcher<typeof loader>();

  const [dateRange, setDateRange] = useState<DateRangePickerValue>([
    dayjs().startOf('month').startOf('day').toDate(),
    dayjs().endOf('month').endOf('day').toDate()
  ]);

  useEffect(() => {
    if (dateRange[0] && dateRange[1]) {
      reports.load(
        `/reports?dateFrom=${dayjs(dateRange[0]).format(
          'YYYY-MM-DD'
        )}&dateTo=${dayjs(dateRange[1]).format('YYYY-MM-DD')}`
      );
    }
  }, [dateRange]);

  const [hourlyRate, setHourlyRate] = useState<number | undefined>(
    data.user.defaultHourlyRate || undefined
  );

  const mobile = useMediaQuery('(max-width: 600px)');

  return (
    <>
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
        Reports
      </h1>

      <reports.Form action="/reports" method="get">
        <Paper
          p="sm"
          aria-controls="time-entries"
          shadow="sm"
          radius="md"
          withBorder
          component="fieldset"
        >
          <DateRangePicker
            label="Select date range"
            placeholder="Pick dates range"
            value={dateRange}
            onChange={setDateRange}
            inputFormat="DD/MM/YYYY"
            labelFormat="MM/YYYY"
            firstDayOfWeek="monday"
            amountOfMonths={mobile ? 1 : 2}
            icon={<Calendar size={16} />}
            mb="md"
          />
          <input
            type="hidden"
            name="dateFrom"
            value={dayjs(dateRange[0]).format('YYYY-MM-DD')}
          />
          <input
            type="hidden"
            name="dateTo"
            value={dayjs(dateRange[1]).format('YYYY-MM-DD')}
          />

          <Group>
            <Button
              variant="outline"
              size="xs"
              onClick={() =>
                setDateRange([
                  dayjs().startOf('week').toDate(),
                  dayjs().endOf('week').toDate()
                ])
              }
            >
              This week
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() =>
                setDateRange([
                  dayjs().subtract(1, 'week').startOf('week').toDate(),
                  dayjs().subtract(1, 'week').endOf('week').toDate()
                ])
              }
            >
              Last week
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() =>
                setDateRange([
                  dayjs().startOf('month').toDate(),
                  dayjs().endOf('month').toDate()
                ])
              }
            >
              This month
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() =>
                setDateRange([
                  dayjs().subtract(1, 'month').startOf('month').toDate(),
                  dayjs().subtract(1, 'month').endOf('month').toDate()
                ])
              }
            >
              Last month
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() =>
                setDateRange([
                  dayjs().startOf('year').toDate(),
                  dayjs().endOf('year').toDate()
                ])
              }
            >
              This year
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() =>
                setDateRange([
                  dayjs().subtract(1, 'year').startOf('year').toDate(),
                  dayjs().subtract(1, 'year').endOf('year').toDate()
                ])
              }
            >
              Last year
            </Button>
          </Group>
        </Paper>
      </reports.Form>

      <Box mt="xl">
        <Title order={2}>Time per project</Title>
      </Box>

      <Box mt="md" maw={300}>
        <NumberInput
          label="Hourly rate"
          value={hourlyRate || data.user.defaultHourlyRate || undefined}
          onChange={setHourlyRate}
        />
      </Box>

      {reports.data && (
        <Table mt="md">
          <thead>
            <tr>
              <th>Project</th>
              <th scope="col">Time</th>
              {hourlyRate && <th scope="col">Billing</th>}
            </tr>
          </thead>
          <tbody>
            {(
              Object.values(reports.data.timeByProject ?? {}) as {
                projectId: string;
                _sum: { duration: number };
              }[]
            ).map((projectData) => (
              <tr key={projectData.projectId}>
                <td scope="row">
                  <Flex align="center">
                    <ColorSwatch
                      mr="sm"
                      color={
                        reports.data?.projects?.projects?.find(
                          (p) => p.id === projectData.projectId
                        )?.color ?? '#000'
                      }
                    />
                    {reports.data?.projects?.projects?.find(
                      (p) => p.id === projectData.projectId
                    )?.name ?? 'No project'}
                  </Flex>
                </td>
                <td>
                  {(projectData._sum.duration / 1000 / 60 / 60).toFixed(2)} h
                </td>
                {hourlyRate && (
                  <td>
                    {(
                      (projectData._sum.duration * hourlyRate) /
                      1000 /
                      60 /
                      60
                    ).toFixed(2)}{' '}
                    {reports.data?.user?.currency ?? '€'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          {!!reports.data?.timeByProject?.length && (
            <tfoot>
              <tr>
                <th scope="row">Totals</th>
                <th>{(reports.data.total / 1000 / 60 / 60).toFixed(2)} h</th>
                {hourlyRate && (
                  <th>
                    {(
                      (reports.data.total * hourlyRate) /
                      1000 /
                      60 /
                      60
                    ).toFixed(2)}{' '}
                    {reports.data?.user?.currency ?? '€'}
                  </th>
                )}
              </tr>
            </tfoot>
          )}
        </Table>
      )}
    </>
  );
}
