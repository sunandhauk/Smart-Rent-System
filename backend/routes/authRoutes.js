const express = require("express");
const router = express.Router();
const passport = require("../config/passport");
const {
  completeGoogleProfileLogin,
  getGoogleAuthErrorMessage,
} = require("../controllers/userController");
const {
  buildFrontendCallbackRedirect,
  decodeGoogleAuthState,
  resolveFrontendRedirectUri,
} = require("../utils/googleAuth");

router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get("/auth/google/callback", (req, res, next) => {
  const statePayload = decodeGoogleAuthState(req.query.state);
  const frontendRedirectUri = resolveFrontendRedirectUri(
    statePayload?.frontendRedirectUri
  );

  if (!frontendRedirectUri) {
    return res.status(400).json({
      message:
        "Frontend redirect URL is missing or invalid for Google authentication.",
    });
  }

  return passport.authenticate(
    "google",
    { session: false },
    async (error, authResult) => {
      if (error || !authResult?.googleProfile) {
        const errorRedirectUrl = buildFrontendCallbackRedirect({
          frontendRedirectUri,
          error: "google_auth_failed",
          errorDescription: getGoogleAuthErrorMessage(
            error || new Error("Google authentication failed")
          ),
        });

        return res.redirect(errorRedirectUrl);
      }

      try {
        await completeGoogleProfileLogin({
          googleProfile: authResult.googleProfile,
          role: authResult.role,
          res,
        });

        const successRedirectUrl = buildFrontendCallbackRedirect({
          frontendRedirectUri,
          status: "success",
        });

        return res.redirect(successRedirectUrl);
      } catch (callbackError) {
        const errorRedirectUrl = buildFrontendCallbackRedirect({
          frontendRedirectUri,
          error: "google_auth_failed",
          errorDescription: getGoogleAuthErrorMessage(callbackError),
        });

        return res.redirect(errorRedirectUrl);
      }
    }
  )(req, res, next);
});

module.exports = router;
