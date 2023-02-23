import { Modal, Title, Text } from '@mantine/core';
import { useNavigate } from '@remix-run/react';

export default function DeletedAccount() {
  const navigate = useNavigate();

  return (
    <Modal
      opened={true}
      onClose={() => navigate('/')}
      withCloseButton
      shadow="md"
      radius="md"
    >
      <Title order={3}>Your account has been deleted</Title>

      <Text component="p" size="lg">
        Sorry to see you go. If you change your mind, you can always create a
        new account.
      </Text>

      <Text component="p" size="lg">
        <a href="/">Go back to the homepage</a>
      </Text>
    </Modal>
  );
}
