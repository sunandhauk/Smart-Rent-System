import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, Search } from "lucide-react";
import { motion } from "framer-motion";
import { CHENNAI_AREAS } from "../utils/chennaiListings";
import { useAppSettings } from "../contexts/AppSettingsContext";

const heroImages = [
  {
    url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1950&q=80",
    alt: "Comfortable room interior",
  },
  {
    url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1950&q=80",
    alt: "Modern hostel room",
  },
  {
    url: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1950&q=80",
    alt: "Bright shared room",
  },
];

const heroQuotes = [
  {
    lineOne: "Your perfect stay is just a click away",
    lineTwo: "where comfort meets convenience.",
  },
  {
    lineOne: "Your perfect stay is just a click away",
    lineTwo: "where comfort meets convenience.",
  },
  {
    lineOne: "Your perfect stay is just a click away",
    lineTwo: "where comfort meets convenience.",
  },
];

const featuredAreas = [
  {
    name: "Adyar",
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    note: "Popular with students and working women",
  },
  {
    name: "Velachery",
    image:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
    note: "Good metro, office, and shopping access",
  },
  {
    name: "Tambaram",
    image:
      "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
    note: "Budget rooms with strong rail connectivity",
  },
  {
    name: "OMR",
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
    note: "Best fit for IT corridor commuters",
  },
];

const quickHighlights = [
  {
    title: "Curated listings",
    description: "Rooms, PGs, and hostels are presented in a cleaner format so guests can compare options quickly.",
  },
  {
    title: "Tenant-first messaging",
    description: "Tenants can contact hosts directly, while hosts use the inbox only to receive and respond when allowed.",
  },
  {
    title: "Local area search",
    description: "Search by locality such as Adyar, Velachery, Tambaram, OMR, and nearby neighborhoods.",
  },
];

const smartRentCards = [
  {
    icon: "🏠",
    title: "Clear room details",
    description:
      "Tenants can quickly see rent, photos, room type, and availability before they start a conversation.",
    badge: "Room clarity",
    accent: "from-rose-400 via-orange-300 to-amber-200",
    tilt: -8,
  },
  {
    icon: "📍",
    title: "Search by locality",
    description:
      "The experience fits Chennai browsing habits with familiar areas like Adyar, Velachery, Tambaram, and OMR.",
    badge: "Chennai focused",
    accent: "from-sky-500 via-cyan-300 to-blue-200",
    tilt: 8,
  },
  {
    icon: "💬",
    title: "Faster tenant contact",
    description:
      "The platform keeps the host contact flow simple so tenants can ask questions and move faster.",
    badge: "Quick connect",
    accent: "from-fuchsia-500 via-rose-300 to-pink-200",
    tilt: -7,
  },
  {
    icon: "✨",
    title: "Easy host publishing",
    description:
      "Hosts can upload photos, add pricing, mention locality details, and publish listings without extra steps.",
    badge: "Publish simply",
    accent: "from-emerald-500 via-teal-300 to-cyan-200",
    tilt: 7,
  },
];

const showcasePoints = [
  "Tenant-first room discovery",
  "Locality-based search flow",
  "Cleaner listing information",
  "Simple host publishing journey",
];

const cardVariants = {
  offscreen: {
    y: 220,
    rotate: 0,
    opacity: 0,
  },
  onscreen: (tilt) => ({
    y: 34,
    rotate: tilt,
    opacity: 1,
    transition: {
      type: "spring",
      bounce: 0.34,
      duration: 0.9,
    },
  }),
};

const splashStyle = {
  position: "absolute",
  inset: 0,
  clipPath:
    'path("M 12 252 C 12 238 23 229 39 226 L 315 176 C 330 173 344 185 344 200 L 356 370 C 356 386 343 399 327 399 L 37 399 C 23 399 12 388 12 374 Z")',
};

const cardShellStyle = {
  width: "min(84vw, 332px)",
  height: "396px",
  borderRadius: "26px",
  transformOrigin: "12% 62%",
};

const Home = () => {
  const navigate = useNavigate();
  const { theme } = useAppSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
      setTimeout(() => setIsTransitioning(false), 650);
    }, 3600);

    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    setTimeout(() => setIsTransitioning(false), 650);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
    setTimeout(() => setIsTransitioning(false), 650);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const nextLocation = searchQuery.trim();
    navigate(
      nextLocation
        ? `/listings?location=${encodeURIComponent(nextLocation)}`
        : "/listings"
    );
  };

  return (
    <div
      className={`transition-colors duration-500 ${
        theme === "dark"
          ? "bg-[linear-gradient(180deg,_#020617_0%,_#0f172a_35%,_#111827_100%)]"
          : "bg-[linear-gradient(180deg,_#fff7f8_0%,_#fffdf8_22%,_#ffffff_100%)]"
      }`}
    >
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(244,63,94,0.22),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.18),_transparent_28%)]" />
        <div className="float-orb absolute left-[-6rem] top-20 h-56 w-56 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="float-orb-delayed absolute right-[-5rem] top-32 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />

        <div className="relative h-[640px] overflow-hidden">
          {heroImages.map((image, index) => (
            <div
              key={image.alt}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === currentIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <img src={image.url} alt={image.alt} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(120deg,_rgba(15,23,42,0.78)_0%,_rgba(15,23,42,0.56)_42%,_rgba(15,23,42,0.34)_100%)]" />
            </div>
          ))}

          <div className="absolute inset-0">
            <div className="container mx-auto flex h-full items-center px-4">
              <div className="max-w-3xl text-white">
                <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-rose-100 backdrop-blur">
                  Smart Rent System
                </span>
                <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
                  Discover stays that feel right from the very first click.
                </h1>

                <div className="mt-5 min-h-[84px] max-w-3xl rounded-[24px] border border-white/15 bg-white/10 px-5 py-4 backdrop-blur transition duration-500">
                  <p className="bg-gradient-to-r from-rose-200 via-white to-sky-200 bg-[length:200%_100%] bg-clip-text text-lg font-semibold text-transparent animate-pulse md:text-2xl">
                    {heroQuotes[currentIndex].lineOne}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-200 md:text-base">
                    {heroQuotes[currentIndex].lineTwo}
                  </p>
                </div>

                <form
                  onSubmit={handleSearchSubmit}
                  className="mt-8 flex max-w-2xl flex-col gap-3 rounded-[28px] border border-white/15 bg-white/12 p-3 backdrop-blur-md md:flex-row"
                >
                  <div className="flex flex-1 items-center gap-3 rounded-[20px] bg-white px-4 py-4 text-neutral-700">
                    <MapPin className="h-5 w-5 text-primary-600" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search by area or locality"
                      className="w-full bg-transparent text-sm outline-none md:text-base"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-[20px] bg-rose-500 px-6 py-4 text-sm font-semibold text-white transition hover:bg-rose-600 md:text-base"
                  >
                    <Search className="h-4 w-4" />
                    Find Rooms
                  </button>
                </form>

                <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-100">
                  <span className="rounded-full bg-white/10 px-4 py-2 backdrop-blur">Tenant-first chat flow</span>
                  <span className="rounded-full bg-white/10 px-4 py-2 backdrop-blur">Smooth property discovery</span>
                  <span className="rounded-full bg-white/10 px-4 py-2 backdrop-blur">Manual locality support for hosts</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/12 p-3 text-white backdrop-blur transition hover:bg-white/20"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/12 p-3 text-white backdrop-blur transition hover:bg-white/20"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === currentIndex ? "h-2 w-9 bg-white" : "h-2 w-2 bg-white/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(244,63,94,0.10),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.12),_transparent_28%)]" />
        <div className="relative mx-auto grid max-w-7xl items-start gap-8 px-4 lg:grid-cols-[1fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="lg:sticky lg:top-24 lg:pr-4"
          >
            <span className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-rose-600 dark:bg-rose-500/10 dark:text-rose-200">
              Smart Rent flow
            </span>
            <h2 className="mt-4 max-w-2xl text-3xl font-bold leading-tight text-slate-900 dark:text-white md:text-5xl">
              A section that explains your website better while users scroll
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
              This scroll card area is customized for Smart Rent System, so it highlights room discovery, locality-based search, tenant contact flow, and host publishing instead of generic demo content.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="theme-elevated rounded-[24px] border p-5 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.22)]">
                <p className="text-sm font-semibold text-rose-500">For tenants</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Compare rooms quickly, search by area, and contact hosts with less confusion.
                </p>
              </div>
              <div className="theme-elevated rounded-[24px] border p-5 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.22)]">
                <p className="text-sm font-semibold text-sky-600">For hosts</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Publish listings, add pricing, and showcase room photos in a simpler workflow.
                </p>
              </div>
            </div>

            <div className="theme-elevated mt-5 rounded-[28px] border p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.2)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-violet-600 dark:text-violet-300">
                    Built for your website
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Better spacing, better readability, and content tied to real rental actions.
                  </p>
                </div>
                <div className="rounded-2xl bg-[linear-gradient(135deg,_#fdf2f8,_#eef2ff)] px-4 py-3 text-right dark:bg-[linear-gradient(135deg,_rgba(91,33,182,0.28),_rgba(15,23,42,0.75))]">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-500 dark:text-violet-200">
                    Focus
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">Local rentals</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {showcasePoints.map((point) => (
                  <div
                    key={point}
                    className="theme-surface flex items-center gap-3 rounded-2xl border px-4 py-3"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-200">
                      <i className="fas fa-check text-xs" />
                    </span>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="space-y-[-78px] pt-3 md:space-y-[-102px] lg:pl-2">
            {smartRentCards.map((item, index) => (
              <motion.div
                key={item.title}
                className="relative flex justify-center overflow-hidden px-2 py-6 md:py-8 lg:justify-start"
                initial="offscreen"
                whileInView="onscreen"
                viewport={{ once: true, amount: 0.72 }}
                custom={item.tilt}
                variants={cardVariants}
              >
                <div
                  className={`absolute inset-x-6 bottom-0 top-1 rounded-[34px] bg-gradient-to-br ${item.accent} opacity-80 blur-[2px] md:inset-x-10`}
                  style={splashStyle}
                />

                <motion.div
                  style={cardShellStyle}
                  className="theme-elevated relative overflow-hidden border border-white/70 p-6 shadow-[0_40px_100px_-42px_rgba(15,23,42,0.45)] backdrop-blur"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(255,255,255,0.94)_0%,_rgba(255,255,255,0.98)_100%)] dark:bg-[linear-gradient(180deg,_rgba(15,23,42,0.74)_0%,_rgba(15,23,42,0.95)_100%)]" />
                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-[0_16px_36px_-22px_rgba(15,23,42,0.5)] dark:bg-slate-800">
                        {item.icon}
                      </div>
                      <span className="rounded-full bg-neutral-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white dark:bg-white dark:text-slate-900">
                        0{index + 1}
                      </span>
                    </div>

                    <div className="mt-8">
                      <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
                        {item.badge}
                      </span>
                      <h3 className="mt-4 text-3xl font-bold leading-tight text-slate-900 dark:text-white">
                        {item.title}
                      </h3>
                      <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-auto rounded-[22px] border border-neutral-200/80 bg-white/85 p-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/60">
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-neutral-600 dark:text-slate-300">
                        <span>User value</span>
                        <span>Smart Rent</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-slate-700">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${72 + index * 6}%` }}
                          viewport={{ once: true, amount: 0.8 }}
                          transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
                          className={`h-full rounded-full bg-gradient-to-r ${item.accent}`}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-rose-600">
              Popular localities
            </span>
            <h2 className="mt-3 text-3xl font-bold text-neutral-900 md:text-4xl">
              Start with the areas tenants search most
            </h2>
          </div>
          <Link
            to="/listings?location=Chennai"
            className="inline-flex w-fit items-center rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition hover:border-primary-200 hover:text-primary-700"
          >
            Browse all listings
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {featuredAreas.map((area) => (
            <Link
              key={area.name}
              to={`/listings?location=${encodeURIComponent(area.name)}`}
              className="group overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.28)] transition hover:-translate-y-1"
            >
              <div className="relative h-72 overflow-hidden">
                <img
                  src={area.image}
                  alt={area.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                <div className="absolute bottom-0 left-0 p-5 text-white">
                  <h3 className="text-2xl font-semibold">{area.name}</h3>
                  <p className="mt-2 text-sm text-slate-200">{area.note}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-neutral-50/80 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 max-w-2xl">
            <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
              Platform focus
            </span>
            <h2 className="mt-3 text-3xl font-bold text-neutral-900 md:text-4xl">
              Cleaner experience for local room discovery
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {quickHighlights.map((item) => (
              <div
                key={item.title}
                className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.16)]"
              >
                <h3 className="text-xl font-semibold text-neutral-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-neutral-600">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[30px] border border-rose-100 bg-[linear-gradient(135deg,_#fff1f2_0%,_#ffffff_55%,_#eff6ff_100%)] p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.18)] md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <h3 className="text-2xl font-bold text-neutral-900">Ready to publish your room?</h3>
                <p className="mt-3 text-sm leading-6 text-neutral-600 md:text-base">
                  Add your locality manually, upload room photos, set monthly rent, and make the listing visible right away.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm text-neutral-600">
                  {CHENNAI_AREAS.slice(0, 6).map((area) => (
                    <span key={area} className="rounded-full bg-white px-3 py-1.5 shadow-sm">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/host/become-a-host"
                  className="inline-flex items-center justify-center rounded-2xl bg-primary-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-primary-700"
                >
                  Become a Host
                </Link>
                <Link
                  to="/listings?location=Chennai"
                  className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition hover:border-primary-200 hover:text-primary-700"
                >
                  Explore Rooms
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
