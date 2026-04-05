import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getGoogleRedirectUri,
  validateGoogleAuthState,
} from "../utils/googleAuth";

const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const { googleAuth } = useAuth();
  const [error, setError] = useState("");
  const hasProcessedAuth = useRef(false);

  useEffect(() => {
    if (hasProcessedAuth.current) {
      return;
    }

    hasProcessedAuth.current = true;

    const completeGoogleAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const providerError = params.get("error");
      const state = params.get("state");

      if (providerError) {
        setError("Google sign-in was cancelled or denied.");
        return;
      }

      if (!validateGoogleAuthState(state)) {
        setError("Google sign-in could not be verified. Please try again.");
        return;
      }

      if (!code) {
        setError("Google sign-in did not return an authorization code.");
        return;
      }

      const result = await googleAuth(code, getGoogleRedirectUri());

      if (result.success) {
        navigate("/", { replace: true });
        return;
      }

      setError(result.error || "Google sign-in failed.");
    };

    completeGoogleAuth();
  }, [googleAuth, navigate]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-xl">
        <div className="mb-4 flex justify-center">
          <div className="h-12 w-12 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Finishing Google sign-in
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          We&apos;re connecting your Google account and preparing your session.
        </p>
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleAuthCallback;
