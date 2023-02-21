export const ALLOW_USER_SIGNUP = Boolean(
  process.env.ALLOW_USER_SIGNUP || false
);

export const isSignupAllowed = () => {
  console.log('ALLOW_USER_SIGNUP', ALLOW_USER_SIGNUP);
  return !!ALLOW_USER_SIGNUP;
};
