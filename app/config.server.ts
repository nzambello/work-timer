export const ALLOW_USER_SIGNUP = Boolean(
  process.env.ALLOW_USER_SIGNUP || false
);

export const isSignupAllowed = () => {
  return !!ALLOW_USER_SIGNUP;
};
