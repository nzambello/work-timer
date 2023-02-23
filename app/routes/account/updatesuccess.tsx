import { Alert } from '@mantine/core';
import { useNavigate } from '@remix-run/react';
import { useEffect } from 'react';
import { Check } from 'react-feather';

export default function UpdateSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => navigate('/account'), 3000);
  });

  return (
    <Alert
      icon={<Check size={21} />}
      color="teal"
      mt="xl"
      radius="md"
      withCloseButton
      closeButtonLabel="Close alert"
      onClose={() => navigate('/account')}
    >
      Account updated successfully
    </Alert>
  );
}
