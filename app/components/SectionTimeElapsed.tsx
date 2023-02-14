import { TimeEntry } from '~/models/timeEntry.server';
import { Text } from '@mantine/core';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface Props {
  timeEntries: TimeEntry[];
  total?: number;
  size?: 'sm' | 'md' | 'lg';
  additionalLabel?: string;
}

const SectionTimeElapsed = ({
  timeEntries,
  total,
  size = 'sm',
  additionalLabel
}: Props) => {
  const getElapsedTime = useCallback(
    () =>
      timeEntries.reduce((acc, timeEntry) => {
        if (!timeEntry.endTime) {
          const diff =
            (Date.now() - new Date(timeEntry.startTime).getTime()) / 1000;
          return acc + diff;
        }
        return (
          acc +
          (new Date(timeEntry.endTime).getTime() -
            new Date(timeEntry.startTime).getTime()) /
            1000
        );
      }, 0),
    [timeEntries]
  );

  const [elapsed, setElapsed] = useState(total || getElapsedTime());

  useEffect(() => {
    if (!timeEntries.some((timeEntry) => !timeEntry.endTime)) return;

    const interval = setInterval(() => {
      setElapsed(getElapsedTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [timeEntries, getElapsedTime]);

  const hours = Math.floor(elapsed / 60 / 60);
  const minutes = Math.floor((elapsed - hours * 60 * 60) / 60);
  const seconds = Math.floor(elapsed - hours * 60 * 60 - minutes * 60);

  const hoursString = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;

  return (
    <Text size={size} color="darkgray">
      {`${hoursString}${additionalLabel ? ` ${additionalLabel}` : ''}`}
    </Text>
  );
};

export default SectionTimeElapsed;
