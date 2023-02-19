import { LoaderArgs } from '@remix-run/node';
import { requireUserId } from '~/session.server';
import { exportTimeEntries } from '~/models/timeEntry.server';
import papaparse from 'papaparse';

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request);

  const timeEntries = await exportTimeEntries({ userId });
  const csv = papaparse.unparse(timeEntries, {
    header: true
  });

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="export.csv"'
    }
  });
}
