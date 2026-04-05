export const getGoogleRedirectUri = () =>
  process.env.REACT_APP_GOOGLE_REDIRECT_URI ||
  `${window.location.origin}/auth/google/callback`;

const GOOGLE_AUTH_STATE_KEY = "google_oauth_state";

const createGoogleAuthState = () => {
  const array = new Uint32Array(4);
  window.crypto.getRandomValues(array);
  return Array.from(array, (value) => value.toString(16)).join("");
};

export const startGoogleAuth = () => {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  if (!clientId || clientId === "your-google-client-id") {
    throw new Error("Google Sign-In is not configured in this environment.");
  }

  const state = createGoogleAuthState();
  window.sessionStorage.setItem(GOOGLE_AUTH_STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    state,
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

export const validateGoogleAuthState = (returnedState) => {
  const savedState = window.sessionStorage.getItem(GOOGLE_AUTH_STATE_KEY);
  window.sessionStorage.removeItem(GOOGLE_AUTH_STATE_KEY);

  return !!savedState && !!returnedState && savedState === returnedState;
};
