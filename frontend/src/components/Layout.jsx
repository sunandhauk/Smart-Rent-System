import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ScrollProgress from "./ScrollProgress";
import ErrorBoundary from "./ErrorBoundary";
import ScrollToTop from "./ScrollToTop";

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    const savedPosition = sessionStorage.getItem(`scroll_${location.key}`);
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition, 10));
      sessionStorage.removeItem(`scroll_${location.key}`);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.key, location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(`scroll_${location.key}`, window.pageYOffset.toString());
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.key]);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("entryRoleChoiceDismissed");
    if (!dismissed && location.pathname === "/") {
      setShowRoleModal(true);
    }
  }, [location.pathname]);

  const closeRoleModal = () => {
    sessionStorage.setItem("entryRoleChoiceDismissed", "true");
    setShowRoleModal(false);
  };

  return (
    <ErrorBoundary>
      <div className="theme-shell flex min-h-screen flex-col transition-colors duration-300">
        <ScrollProgress />
        <Navbar />
        <main className="flex-grow">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
        <Footer />
        <ScrollToTop />

        {showRoleModal && (
          <div className="theme-overlay fixed inset-0 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="theme-elevated w-full max-w-2xl overflow-hidden rounded-[28px] border shadow-[0_24px_60px_-34px_rgba(15,23,42,0.45)] transition-colors duration-300">
              <div className="theme-gradient-panel p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">
                      Chennai rental flow
                    </span>
                    <h2 className="theme-text mt-3 text-2xl font-bold md:text-3xl">
                      Continue as host or tenant
                    </h2>
                    <p className="theme-muted mt-2 max-w-xl text-sm leading-6 md:text-base">
                      Continue as a tenant to browse rooms in Chennai, or continue as a host to publish your room with images, contact details, and pricing.
                    </p>
                  </div>
                  <button
                    onClick={closeRoleModal}
                    className="theme-border theme-muted rounded-full border px-3 py-2 text-sm transition hover:text-neutral-800"
                  >
                    <i className="fas fa-times" />
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <button
                    onClick={() => {
                      closeRoleModal();
                      navigate("/host/become-a-host");
                    }}
                    className="theme-surface rounded-[24px] border border-rose-100 p-5 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                      <i className="fas fa-house-user text-xl" />
                    </div>
                    <h3 className="theme-text text-lg font-semibold">Continue as Host</h3>
                    <p className="theme-muted mt-2 text-sm leading-6">
                      Upload a Chennai room, add images, enter the required price and contact details, and publish your listing instantly.
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      closeRoleModal();
                      navigate("/listings?location=Chennai");
                    }}
                    className="theme-surface rounded-[24px] border border-sky-100 p-5 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                      <i className="fas fa-user text-xl" />
                    </div>
                    <h3 className="theme-text text-lg font-semibold">Continue as Tenant</h3>
                    <p className="theme-muted mt-2 text-sm leading-6">
                      Browse rooms available in Chennai only, open the host contact and chat screen directly, and discuss details with the host.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Layout;
