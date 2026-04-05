import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppSettings } from "../contexts/AppSettingsContext";
import { useAuth } from "../contexts/AuthContext";
import NavLogo from "./navbar/NavLogo";
import NavSearch from "./navbar/NavSearch";
import NavProfile from "./navbar/NavProfile";
import NavSettings from "./navbar/NavSettings";
import { getPreferenceSnapshot } from "../utils/tenantVacancies";

const UserAvatar = ({ user, sizeClass = "w-8 h-8", textClass = "text-sm" }) => {
  const [imageError, setImageError] = useState(false);
  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`;

  useEffect(() => {
    setImageError(false);
  }, [user?.profileImage]);

  return (
    <div
      className={`bg-primary-500 text-white rounded-full ${sizeClass} flex items-center justify-center overflow-hidden`}
    >
      {user?.profileImage && !imageError ? (
        <img
          src={user.profileImage}
          alt={`${user.firstName} ${user.lastName}`}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className={`font-medium ${textClass}`}>{initials || "U"}</span>
      )}
    </div>
  );
};

const Navbar = () => {
  // State for UI controls
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem("recentSearches");
    return saved ? JSON.parse(saved) : [];
  });
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [preferenceSnapshot, setPreferenceSnapshot] = useState(getPreferenceSnapshot);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const searchRef = useRef(null);
  const settingsRef = useRef(null);
  const preferencesRef = useRef(null);
  const getStartedRef = useRef(null);
  const menuRef = useRef(null);
  const { pathname } = useLocation();
  const location = useLocation();
  const navigate = useNavigate();

  // Use auth context
  const { currentUser, logout, isAuthenticated } = useAuth();

  // Use the app settings context
  const {
    language,
    languageName,
    currency,
    changeLanguage,
    changeCurrency,
    supportedLanguages,
    getText,
    isTranslating,
    isLoadingRates,
  } = useAppSettings();

  // Available currencies
  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
  ];

  // Close profile and settings menus on route change
  useEffect(() => {
    setIsProfileMenuOpen(false);
    setIsSettingsMenuOpen(false);
    setIsGetStartedOpen(false);
    setIsPreferencesOpen(false);
  }, [location.pathname]);

  // Handle clicks outside dropdown menus and keyboard navigation
  useEffect(() => {
    // Handle clicks outside the search dropdown
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsMenuOpen(false);
      }
      if (preferencesRef.current && !preferencesRef.current.contains(event.target)) {
        setIsPreferencesOpen(false);
      }
      if (getStartedRef.current && !getStartedRef.current.contains(event.target)) {
        setIsGetStartedOpen(false);
      }
    };

    // Handle keyboard navigation
    const handleKeyDown = (event) => {
      // Close menus on Escape
      if (event.key === "Escape") {
        setIsSearchFocused(false);
        setIsSettingsMenuOpen(false);
        setIsProfileMenuOpen(false);
        setIsGetStartedOpen(false);
        setIsPreferencesOpen(false);
      }

      // Handle Tab key to manage focus trap in menus
      if (event.key === "Tab" && (isSettingsMenuOpen || isProfileMenuOpen || isPreferencesOpen)) {
        const menu = isSettingsMenuOpen
          ? settingsRef.current
          : isPreferencesOpen
            ? preferencesRef.current
            : document;
        const focusableElements = menu.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusableElement = focusableElements[0];
        const lastFocusableElement =
          focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // If shift + tab and first element is focused, move to last
          if (document.activeElement === firstFocusableElement) {
            event.preventDefault();
            lastFocusableElement.focus();
          }
        } else {
          // If tab and last element is focused, move to first
          if (document.activeElement === lastFocusableElement) {
            event.preventDefault();
            firstFocusableElement.focus();
          }
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSettingsMenuOpen, isProfileMenuOpen, isPreferencesOpen]);

  const navigateToAuth = (role, mode) => {
    setIsGetStartedOpen(false);
    navigate(`/${mode}?role=${role}`);
  };

  // Control body scrolling when settings modal is open
  useEffect(() => {
    // Prevent body scrolling when settings modal is open
    if (isSettingsMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSettingsMenuOpen]);

  // Persist recent searches to localStorage
  useEffect(() => {
    // Save recent searches to localStorage whenever it changes
    localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
  }, [recentSearches]);

  useEffect(() => {
    const syncPreferences = () => {
      setPreferenceSnapshot(getPreferenceSnapshot());
    };

    syncPreferences();
    window.addEventListener("tenantPreferencesUpdated", syncPreferences);
    window.addEventListener("storage", syncPreferences);

    return () => {
      window.removeEventListener("tenantPreferencesUpdated", syncPreferences);
      window.removeEventListener("storage", syncPreferences);
    };
  }, []);

  // Handler for search input changes
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handler for search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Add to recent searches (avoid duplicates and limit to 5)
      const updatedSearches = [
        searchQuery.trim(),
        ...recentSearches.filter((search) => search !== searchQuery.trim()),
      ].slice(0, 5);

      setRecentSearches(updatedSearches);
      navigate(`/listings?location=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsSearchFocused(false);
    }
  };

  // Handler for clicking a search suggestion
  const handleSuggestionClick = (suggestion) => {
    // Add to recent searches
    const updatedSearches = [
      suggestion,
      ...recentSearches.filter((search) => search !== suggestion),
    ].slice(0, 5);

    setRecentSearches(updatedSearches);
    navigate(`/listings?location=${encodeURIComponent(suggestion)}`);
    setIsSearchFocused(false);
  };

  // Handler to clear all recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  // Handler for changing language
  const handleLanguageChange = async (langCode, langName) => {
    try {
      setIsSettingsLoading(true);
      await changeLanguage(langCode, langName);
    } finally {
      setIsSettingsLoading(false);
      setIsSettingsMenuOpen(false);
    }
  };

  // Handler for changing currency
  const handleCurrencyChange = async (currencyCode) => {
    try {
      setIsSettingsLoading(true);
      await changeCurrency(currencyCode);
    } finally {
      setIsSettingsLoading(false);
      setIsSettingsMenuOpen(false);
    }
  };

  // Handler for user logout action
  const handleLogout = async () => {
    await logout();
    setIsProfileMenuOpen(false);
    navigate("/");
  };

  return (
    <nav className="bg-white py-4 px-2 md:px-6 sticky top-0 z-20 shadow-sm">
      <div className="container mx-auto">
        {/* Main navigation bar with logo and menu items */}
        <div className="flex justify-between items-center">
          {/* Logo */}
          <NavLogo />

          {/* Explore Button - Added next to the logo */}
          {location.pathname === "/" && (
            <div className="hidden md:block ml-4 lg:ml-12">
              <Link
                to="/listings"
                className="flex items-center px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-full transition duration-300 shadow-sm hover:shadow-md gap-2"
                aria-label="Explore Properties"
              >
                <i className="fas fa-compass text-lg"></i>
                <span className="font-medium">Explore</span>
              </Link>
            </div>
          )}

          {/* Center search bar - Responsive for all screens */}
          {location.pathname === "/" && (
            <div
              ref={searchRef}
              className="flex relative mx-auto max-w-md w-full rounded-full border border-neutral-200 shadow-search hover:shadow-md transition duration-200"
            >
              <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
                <input
                  type="text"
                  placeholder={getText("common", "search")}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setIsSearchFocused(true)}
                  /* Changed px-8 to pl-6 pr-12 for better spacing */
                  className="w-full pl-6 pr-12 py-2.5 rounded-full focus:outline-none text-sm text-neutral-700 placeholder:text-transparent sm:placeholder:text-neutral-400"
                />

                <button
                  type="submit"
                  /* Removed top-1/2 and translate-y to let Flexbox handle vertical centering */
                  /* Removed m-1 which was pushing it off-center */
                  className="absolute right-1.5 bg-[#FF4C6D] text-white rounded-full hover:bg-[#E03F5A] transition duration-200 flex items-center justify-center w-8 h-8"
                >
                  <i className="fas fa-search text-[10px]"></i>
                </button>
              </form>             

              {/* Search Dropdown - appears when search is focused */}
              {isSearchFocused && (
                <div className="absolute w-full mt-1 top-full left-0 bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden z-20">
                  {/* Recent Searches Section */}
                  {recentSearches.length > 0 && (
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-neutral-800">
                          Recent Searches
                        </h3>
                        <button
                          onClick={clearRecentSearches}
                          className="text-xs text-neutral-500 hover:text-neutral-700"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="space-y-2">
                        {recentSearches.map((search, index) => (
                          <div
                            key={index}
                            onClick={() => handleSuggestionClick(search)}
                            className="flex items-center p-2 hover:bg-neutral-50 rounded-md cursor-pointer"
                          >
                            <i className="fas fa-history text-neutral-400 mr-3"></i>
                            <span className="text-sm text-neutral-700">
                              {search}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* Navigation - Responsive */}
          <div className="flex items-center gap-1 md:gap-2">
            {!isAuthenticated && (
              <div ref={getStartedRef} className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setIsGetStartedOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 hover:shadow-md"
                >
                  <span>Get Started</span>
                  <i className={`fas fa-chevron-${isGetStartedOpen ? "up" : "down"} text-[10px]`} />
                </button>

                {isGetStartedOpen && (
                  <div className="absolute right-0 mt-3 w-80 overflow-hidden rounded-[24px] border border-neutral-200 bg-white p-3 shadow-card z-[1000]">
                    <div className="mb-2 px-2 py-1">
                      <p className="text-sm font-semibold text-neutral-900">Choose your role</p>
                      <p className="text-xs text-neutral-500">Continue with the right sign up or login flow.</p>
                    </div>

                    <div className="space-y-2">
                      <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                            <i className="fas fa-house-user" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-neutral-900">Host</p>
                            <p className="text-xs text-neutral-500">Publish rooms and manage listings</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => navigateToAuth("host", "register")} className="flex-1 rounded-xl bg-primary-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-primary-700">Sign Up</button>
                          <button onClick={() => navigateToAuth("host", "login")} className="flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition hover:border-primary-200 hover:text-primary-700">Login</button>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                            <i className="fas fa-user" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-neutral-900">Tenant</p>
                            <p className="text-xs text-neutral-500">Search rooms and contact hosts</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => navigateToAuth("tenant", "register")} className="flex-1 rounded-xl bg-primary-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-primary-700">Sign Up</button>
                          <button onClick={() => navigateToAuth("tenant", "login")} className="flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition hover:border-primary-200 hover:text-primary-700">Login</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div ref={preferencesRef} className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => setIsPreferencesOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                  aria-expanded={isPreferencesOpen}
                  aria-haspopup="dialog"
                >
                  <i className="fas fa-sliders-h text-xs" />
                  <span>Preferences</span>
                </button>

                {isPreferencesOpen && (
                  <div className="absolute right-0 mt-3 w-[22rem] overflow-hidden rounded-[24px] border border-neutral-200 bg-white p-4 shadow-card z-[1000]">
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-neutral-900">Roommate preferences</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {isAuthenticated
                          ? "Hidden by default and pulled from your latest room-sharing draft or listing."
                          : "View the roommate preference fields that will be shown inside the tenant room-sharing feature."}
                      </p>
                    </div>

                    {isAuthenticated ? (
                      <>
                        <div className="space-y-3 text-sm text-neutral-700">
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-neutral-500">Gender preference</span>
                            <span className="text-right font-medium">{preferenceSnapshot.gender}</span>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-neutral-500">Occupation</span>
                            <span className="text-right font-medium">
                              {preferenceSnapshot.occupation?.length
                                ? preferenceSnapshot.occupation.join(", ")
                                : "Any"}
                            </span>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-neutral-500">Smoking habits</span>
                            <span className="text-right font-medium">{preferenceSnapshot.smoking}</span>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-neutral-500">Drinking habits</span>
                            <span className="text-right font-medium">{preferenceSnapshot.drinking}</span>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-neutral-500">Cleanliness</span>
                            <span className="text-right font-medium">{preferenceSnapshot.cleanliness}</span>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-neutral-500">Sleep schedule</span>
                            <span className="text-right font-medium">
                              {preferenceSnapshot.sleepSchedule || "Not specified"}
                            </span>
                          </div>
                        </div>

                        <Link
                          to="/tenant/room-sharing"
                          className="mt-4 inline-flex items-center text-sm font-semibold text-primary-600 transition hover:text-primary-700"
                          onClick={() => setIsPreferencesOpen(false)}
                        >
                          Update room-sharing preferences
                        </Link>
                      </>
                    ) : (
                      <>
                        <div className="space-y-3 rounded-2xl bg-sky-50/70 p-4 text-sm text-neutral-700">
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-neutral-500">Gender preference</span>
                            <span className="text-right font-medium">Male / Female / Any</span>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-neutral-500">Occupation</span>
                            <span className="text-right font-medium">Student / Working</span>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-neutral-500">Smoking / Drinking</span>
                            <span className="text-right font-medium">Lifestyle habits</span>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-neutral-500">Cleanliness</span>
                            <span className="text-right font-medium">Hygiene expectations</span>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-neutral-500">Other preferences</span>
                            <span className="text-right font-medium">Sleep schedule and more</span>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-neutral-900">Tenant access</p>
                            <p className="mt-1 text-xs text-neutral-500">
                              Sign in as tenant to post vacancy and manage these preferences.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsPreferencesOpen(false);
                              navigate("/login?role=tenant");
                            }}
                            className="rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
                          >
                            Tenant Login
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

            {/* Language and Currency Selector */}
            <div ref={settingsRef} className="relative">
              <button
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMenuPosition({ x: rect.left, y: rect.bottom });
                  setIsSettingsMenuOpen(!isSettingsMenuOpen);
                }}
                className="flex items-center justify-center p-2 text-neutral-700 hover:text-neutral-900 transition duration-200 relative"
                aria-label="Language and Currency Settings"
                aria-expanded={isSettingsMenuOpen}
                aria-haspopup="dialog"
              >
                <div className="relative">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 12H22"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="sr-only">
                    Current language: {languageName}, Currency: {currency}
                  </span>
                </div>
                {isSettingsLoading && (
                  <div className="absolute -top-1 -right-1 w-3 h-3">
                    <div className="absolute w-full h-full rounded-full border-2 border-t-transparent border-primary-500 animate-spin"></div>
                  </div>
                )}
              </button>

              {/* Language and Currency Modal */}
              {isSettingsMenuOpen && (
                <div
                  className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fadeIn"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="settings-modal-title"
                >
                  <div
                    ref={menuRef}
                    className="bg-white rounded-xl shadow-xl w-full max-h-[90vh] overflow-y-auto mx-4 transform transition-all duration-300 ease-out
                      sm:max-w-xl sm:w-full"
                    style={{
                      animation: "fadeInUp 0.3s ease-out",
                      maxWidth: "min(90vw, 32rem)",
                      marginTop: Math.min(
                        menuPosition.y + 20,
                        window.innerHeight - 600
                      ),
                    }}
                  >
                    {/* Header with close button */}
                    <div className="flex justify-between items-center p-4 border-b border-neutral-200 sticky top-0 bg-white z-10">
                      <h2
                        id="settings-modal-title"
                        className="text-xl font-bold text-neutral-800"
                      >
                        Language and Currency
                      </h2>
                      <div className="flex items-center">
                        <span
                          className="text-sm text-neutral-500 mr-3"
                          role="status"
                          aria-live="polite"
                        >
                          Currently: {languageName}, {currency}
                        </span>
                        <button
                          onClick={() => setIsSettingsMenuOpen(false)}
                          className="text-neutral-500 hover:text-neutral-700 p-2 rounded-full hover:bg-neutral-100 transition duration-200"
                          aria-label="Close settings"
                        >
                          <i className="fas fa-times" aria-hidden="true"></i>
                        </button>
                      </div>
                    </div>

                    {/* Language Selection Section */}
                    <div className="p-6 border-b border-neutral-200">
                      <h3 className="text-lg font-semibold text-neutral-800 mb-4">
                        Select a language
                      </h3>

                      {isTranslating ? (
                        <div className="flex justify-center py-8">
                          <i className="fas fa-spinner fa-spin text-primary-500 mr-2 text-xl"></i>
                          <span className="text-neutral-700">
                            Loading translations...
                          </span>
                        </div>
                      ) : (
                        <>
                          {/* Language regions */}
                          <div className="mb-6">
                            <div className="font-medium text-neutral-700 mb-2">
                              Suggested languages
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {supportedLanguages.slice(0, 6).map((lang) => (
                                <button
                                  key={lang.code}
                                  onClick={() =>
                                    handleLanguageChange(lang.code, lang.name)
                                  }
                                  className={`flex items-center px-4 py-3 text-sm rounded-lg transition-all duration-200 ${
                                    language === lang.code
                                      ? "bg-primary-50 text-primary-600 font-medium border-2 border-primary-200"
                                      : "text-neutral-700 hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300"
                                  }`}
                                >
                                  <span>{lang.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="font-medium text-neutral-700 mb-2">
                              All languages
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {supportedLanguages.map((lang) => (
                                <button
                                  key={lang.code}
                                  onClick={() =>
                                    handleLanguageChange(lang.code, lang.name)
                                  }
                                  className={`flex items-center px-4 py-3 text-sm rounded-lg transition-all duration-200 ${
                                    language === lang.code
                                      ? "bg-primary-50 text-primary-600 font-medium border-2 border-primary-200"
                                      : "text-neutral-700 hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300"
                                  }`}
                                >
                                  <span>{lang.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Currency Selection Section */}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-neutral-800 mb-4">
                        Select a currency
                      </h3>

                      {isLoadingRates ? (
                        <div className="flex justify-center py-8">
                          <i className="fas fa-spinner fa-spin text-primary-500 mr-2 text-xl"></i>
                          <span className="text-neutral-700">
                            Loading exchange rates...
                          </span>
                        </div>
                      ) : (
                        <>
                          {/* Popular currencies */}
                          <div className="mb-6">
                            <div className="font-medium text-neutral-700 mb-2">
                              Popular currencies
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {currencies.slice(0, 4).map((curr) => (
                                <button
                                  key={curr.code}
                                  onClick={() =>
                                    handleCurrencyChange(curr.code)
                                  }
                                  className={`flex items-center px-4 py-3 text-sm rounded-lg transition-all duration-200 ${
                                    currency === curr.code
                                      ? "bg-primary-50 text-primary-600 font-medium border-2 border-primary-200"
                                      : "text-neutral-700 hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300"
                                  }`}
                                >
                                  <span className="mr-2 font-bold">
                                    {curr.symbol}
                                  </span>
                                  <span>
                                    {curr.code} - {curr.name}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* All currencies */}
                          <div>
                            <div className="font-medium text-neutral-700 mb-2">
                              All currencies
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {currencies.map((curr) => (
                                <button
                                  key={curr.code}
                                  onClick={() =>
                                    handleCurrencyChange(curr.code)
                                  }
                                  className={`flex items-center px-4 py-3 text-sm rounded-lg transition-all duration-200 ${
                                    currency === curr.code
                                      ? "bg-primary-50 text-primary-600 font-medium border-2 border-primary-200"
                                      : "text-neutral-700 hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300"
                                  }`}
                                >
                                  <span className="mr-2 font-bold">
                                    {curr.symbol}
                                  </span>
                                  <span>
                                    {curr.code} - {curr.name}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User profile menu */}

            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 border border-neutral-300 p-2 rounded-full hover:shadow-md transition duration-200"
                aria-label="User menu"
              >
                <i className="fas fa-bars text-neutral-500"></i>
                {isAuthenticated && currentUser ? (
                  <UserAvatar user={currentUser} />
                ) : (
                  <div className="bg-neutral-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                    <i className="fas fa-user"></i>
                  </div>
                )}
              </button>

              {/* User dropdown menu */}
              {isProfileMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-card border border-neutral-200 divide-neutral-100 py-1 z-[1000]"
                  style={{ zIndex: 1000 }}
                >
                  {!isAuthenticated ? (
                    // Not logged in menu options
                    <div className="py-1">
                      <Link
                        to="/login"
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        {getText("common", "login")}
                      </Link>
                      <Link
                        to="/register"
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        {getText("common", "signup")}
                      </Link>
                      <Link
                        to="/host/become-a-host"
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        {getText("common", "becomeHost")}
                      </Link>
                      <Link
                        to="/help"
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        {getText("common", "help")}
                      </Link>
                    </div>
                  ) : (
                    // Logged in user menu options
                    <>
                      {/* User profile summary */}
                      <div className="p-4">
                        <div className="flex items-center">
                          <div className="mr-3">
                            <UserAvatar
                              user={currentUser}
                              sizeClass="w-10 h-10"
                              textClass="text-sm"
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-800">
                              {currentUser.firstName} {currentUser.lastName}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {currentUser.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* User activity links */}
                      <div className="py-1">
                        <Link
                          to="/messages"
                          className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          {getText("common", "messages")}
                        </Link>
                        <Link
                          to="/trips"
                          className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          {getText("common", "trips")}
                        </Link>
                        <Link
                          to="/wishlist"
                          className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          {getText("common", "wishlist")}
                        </Link>
                      </div>
                      {/* Account management links */}
                      <div className="py-1">
                        <Link
                          to="/host/listings"
                          className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          Manage listings
                        </Link>
                        <Link
                          to="/tenant/room-sharing"
                          className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          Post vacancy
                        </Link>
                        <Link
                          to="/account"
                          className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          {getText("common", "account")}
                        </Link>
                        <button
                          className="w-full text-left block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                          onClick={handleLogout}
                        >
                          {getText("common", "logout")}
                        </button>
                        <Link
                          to="/help"
                          className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          {getText("common", "help")}
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {isSearchFocused && location.pathname === "/" && (
          <div className="fixed inset-0 bg-white z-50 md:hidden p-4">
            <div className="flex items-center mb-4">
              <button
                onClick={() => setIsSearchFocused(false)}
                className="p-2 hover:bg-neutral-100 rounded-full"
              >
                <i className="fas fa-arrow-left text-neutral-700"></i>
              </button>
              <span className="ml-4 text-lg font-semibold">Search</span>
            </div>

            <div className="relative">
              <form onSubmit={handleSearchSubmit} className="w-full">
                <input
                  type="text"
                  placeholder={getText("common", "search")}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              </form>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">Recent Searches</h3>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-neutral-500"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="space-y-2">
                    {recentSearches.map((search, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          handleSuggestionClick(search);
                          setIsSearchFocused(false);
                        }}
                        className="flex items-center p-2 hover:bg-neutral-50 rounded-lg"
                      >
                        <i className="fas fa-history text-neutral-400 mr-3"></i>
                        <span className="text-sm">{search}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
export default Navbar;
