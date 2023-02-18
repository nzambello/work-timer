import { Box, MediaQuery } from '@mantine/core';
import React, { useState, useEffect } from 'react';

export interface Props {
  startTime: Date | string;
  endTime?: Date | string | null;
}

const TimeElapsed = ({ startTime, endTime }: Props) => {
  const [elapsed, setElapsed] = useState(
    (new Date(endTime || Date.now()).getTime() -
      new Date(startTime).getTime()) /
      1000
  );

  useEffect(() => {
    if (endTime) return;
    const interval = setInterval(() => {
      setElapsed(
        (new Date(endTime || Date.now()).getTime() -
          new Date(startTime).getTime()) /
          1000
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  const hours = Math.floor(elapsed / 60 / 60);
  const minutes = Math.floor((elapsed - hours * 60 * 60) / 60);
  const seconds = Math.floor(elapsed - hours * 60 * 60 - minutes * 60);

  const hoursString = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}
    >
      <pre
        style={{
          fontSize: '1rem',
          margin: 0
        }}
      >
        <code>{hoursString}</code>
      </pre>
      <MediaQuery
        smallerThan="sm"
        styles={{
          display: 'none'
        }}
      >
        <p
          style={{
            fontSize: '0.75rem',
            margin: 0
          }}
        >
          <span>
            {Intl.DateTimeFormat('it-IT', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }).format(new Date(startTime))}
          </span>
          <span dangerouslySetInnerHTML={{ __html: '&nbsp;&mdash;&nbsp;' }} />
          <span>
            {endTime
              ? Intl.DateTimeFormat('it-IT', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                }).format(new Date(endTime))
              : 'now'}
          </span>
        </p>
      </MediaQuery>
    </Box>
  );
};

export default TimeElapsed;
