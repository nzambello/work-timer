import { getSetting } from './models/settings.server';
import { countUsers } from './models/user.server';

export const ALLOW_USER_SIGNUP = process.env.ALLOW_USER_SIGNUP === '1' || false;

export const isSignupAllowed = async () => {
  const allowUserSignup = await getSetting({ id: 'ALLOW_USER_SIGNUP' });

  if (allowUserSignup?.value !== undefined && allowUserSignup?.value !== null) {
    return (
      allowUserSignup.value === 'true' ||
      allowUserSignup.value === 'yes' ||
      allowUserSignup.value === '1' ||
      allowUserSignup.value === 'on'
    );
  }

  let isFirstUser = (await countUsers()) === 0;
  if (isFirstUser) {
    return true;
  }

  return !!ALLOW_USER_SIGNUP;
};
