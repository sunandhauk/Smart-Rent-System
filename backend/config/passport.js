const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { decodeGoogleAuthState, getGoogleCallbackUrl } = require("../utils/googleAuth");

const PRODUCTION_GOOGLE_CALLBACK_URL =
  "https://nest-dosthu.onrender.com/auth/google/callback";

const resolveGoogleCallbackUrl = () => {
  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_GOOGLE_CALLBACK_URL;
  }

  return process.env.GOOGLE_REDIRECT_URI || PRODUCTION_GOOGLE_CALLBACK_URL;
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: resolveGoogleCallbackUrl(),
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const statePayload = decodeGoogleAuthState(req.query.state);

        return done(null, {
          googleProfile: profile,
          role: statePayload?.role || "user",
          frontendRedirectUri: statePayload?.frontendRedirectUri || null,
          callbackUrl: getGoogleCallbackUrl(req),
        });
      } catch (error) {
        return done(error);
      }
    }
  )
);

module.exports = passport;
