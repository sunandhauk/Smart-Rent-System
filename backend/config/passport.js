const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { decodeGoogleAuthState, getGoogleCallbackUrl } = require("../utils/googleAuth");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_REDIRECT_URI ||
        "https://nest-dosthu.onrender.com/auth/google/callback",
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
