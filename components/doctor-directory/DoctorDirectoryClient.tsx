"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, Star, CalendarDays, MapPin, Filter, X, SlidersHorizontal, ChevronLeft, Loader2 } from "lucide-react";
import { SPECIALTIES } from "@/lib/constants/specialties";
import { ChatInitiationButton } from "@/components/ChatInitiationButton";

export type DoctorDirectoryItem = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  specialty: string | null;
  hospital: string | null;
  consultationPrice: number;
  rating: number | null;
  reviewsCount: number | null;
  availableDays: number[];
};

const dayPills = [
  { day: 1, label: "Mon" },
  { day: 2, label: "Tue" },
  { day: 3, label: "Wed" },
  { day: 4, label: "Thu" },
  { day: 5, label: "Fri" },
  { day: 6, label: "Sat" },
  { day: 0, label: "Sun" },
] as const;

const DOCTORS_PER_PAGE = 12;

function specialtyLabel(value: string | null | undefined) {
  if (!value) return null;
  return SPECIALTIES.find((s) => s.value === value)?.label ?? value;
}

function formatMoney(v: number) {
  return `$${v.toFixed(0)}`;
}

export function DoctorDirectoryClient({
  doctors,
  title,
  subtitle,
  viewAllHref,
  profileBaseHref,
  bookBaseHref,
  hideBook,
}: {
  doctors: DoctorDirectoryItem[];
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  profileBaseHref: string;
  bookBaseHref?: string;
  hideBook?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [requiredDay, setRequiredDay] = useState<number | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [priceInputValue, setPriceInputValue] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState(DOCTORS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const prices = useMemo(
    () => doctors.map((d) => d.consultationPrice).filter((n) => Number.isFinite(n)),
    [doctors]
  );
  const maxPriceInData = useMemo(() => Math.max(0, ...prices), [prices]);
  const absoluteMaxPrice = Math.max(500, Math.ceil(maxPriceInData * 1.2));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return doctors.filter((d) => {
      if (q) {
        const hay = `${d.fullName} ${d.hospital ?? ""} ${specialtyLabel(d.specialty) ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (selectedSpecialties.length) {
        if (!d.specialty || !selectedSpecialties.includes(d.specialty))
          return false;
      }
      if (maxPrice !== null && d.consultationPrice > maxPrice) return false;
      if (minRating !== null && (d.rating ?? 0) < minRating) return false;
      if (requiredDay !== null && !d.availableDays.includes(requiredDay))
        return false;
      return true;
    });
  }, [doctors, maxPrice, minRating, query, requiredDay, selectedSpecialties]);

  const visibleDoctors = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const activeFiltersCount =
    selectedSpecialties.length +
    (maxPrice !== null ? 1 : 0) +
    (minRating !== null ? 1 : 0) +
    (requiredDay !== null ? 1 : 0);

  const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPriceInputValue(value);
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setMaxPrice(numValue);
      setVisibleCount(DOCTORS_PER_PAGE);
    }
  };

  const handlePriceSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setMaxPrice(value);
    setPriceInputValue(value.toString());
    setVisibleCount(DOCTORS_PER_PAGE);
  };

  const clearAllFilters = () => {
    setQuery("");
    setSelectedSpecialties([]);
    setRequiredDay(null);
    setMinRating(null);
    setMaxPrice(null);
    setPriceInputValue("");
    setVisibleCount(DOCTORS_PER_PAGE);
  };

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + DOCTORS_PER_PAGE, filtered.length));
      setIsLoadingMore(false);
    }, 300);
  };

  // Inline filter content to prevent focus loss on re-render
  const renderFilters = (compact = false) => (
    <div className={`space-y-4 ${compact ? "max-h-[70vh] overflow-y-auto pr-2" : ""}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setVisibleCount(DOCTORS_PER_PAGE); }}
          placeholder="Search doctors..."
          className="w-full rounded-lg border border-border bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
        />
      </div>

      <div>
        <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Rating</h4>
        <div className="flex flex-wrap gap-1.5">
          {[3.0, 3.5, 4.0, 4.5, 4.8].map((r) => {
            const active = minRating === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => { setMinRating(active ? null : r); setVisibleCount(DOCTORS_PER_PAGE); }}
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-all ${
                  active
                    ? "border-brand bg-brand text-white"
                    : "border-border bg-white text-text-secondary hover:bg-subtle"
                }`}
              >
                <Star className="h-3 w-3 fill-current" />
                {r}+
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Specialty</h4>
        <div className="flex flex-wrap gap-1.5">
          {SPECIALTIES.slice(0, 8).map((s) => {
            const active = selectedSpecialties.includes(s.value);
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  setSelectedSpecialties((prev) =>
                    active
                      ? prev.filter((x) => x !== s.value)
                      : [...prev, s.value]
                  );
                  setVisibleCount(DOCTORS_PER_PAGE);
                }}
                className={`rounded-md border px-2 py-1 text-xs font-medium transition-all ${
                  active
                    ? "border-brand bg-brand text-white"
                    : "border-border bg-white text-text-secondary hover:bg-subtle"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Availability</h4>
        <div className="flex flex-wrap gap-1.5">
          {dayPills.map((d) => {
            const active = requiredDay === d.day;
            return (
              <button
                key={d.day}
                type="button"
                onClick={() => { setRequiredDay(active ? null : d.day); setVisibleCount(DOCTORS_PER_PAGE); }}
                className={`rounded-md border px-2 py-1 text-xs font-medium transition-all ${
                  active
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-border bg-white text-text-secondary hover:bg-subtle"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Max Price: {formatMoney(maxPrice ?? absoluteMaxPrice)}</h4>
        <input
          type="range"
          min={0}
          max={absoluteMaxPrice}
          step={10}
          value={maxPrice ?? absoluteMaxPrice}
          onChange={handlePriceSliderChange}
          className="w-full h-1.5 bg-subtle rounded-full appearance-none cursor-pointer accent-brand"
        />
        <div className="flex justify-between text-[10px] text-text-tertiary mt-1">
          <span>$0</span>
          <span>${absoluteMaxPrice}</span>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <button
          type="button"
          onClick={clearAllFilters}
          className="w-full py-2 text-xs font-medium text-text-secondary hover:text-text-primary border border-border rounded-lg hover:bg-subtle transition-colors flex items-center justify-center gap-1.5"
        >
          <X className="h-3.5 w-3.5" />
          Clear all ({activeFiltersCount})
        </button>
      )}
    </div>
  );

  return (
    <section className="py-4 sm:py-6">
      {/* Back to home + Header */}
      <div className="flex flex-col gap-4 mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors w-fit"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to home
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-semibold text-text-primary">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 text-sm sm:text-base text-text-secondary">
                {subtitle}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            {viewAllHref ? (
              <Link
                href={viewAllHref}
                className="btn-secondary text-sm hidden sm:inline-flex"
              >
                View all doctors
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white text-sm font-medium text-text-primary"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-brand text-white text-xs flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: Content + Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Main Content - Doctors Grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-text-secondary">
              <span className="font-semibold text-text-primary">{filtered.length}</span> doctors found
              {filtered.length > 0 && (
                <span className="text-text-tertiary"> · Showing {Math.min(visibleCount, filtered.length)}</span>
              )}
            </p>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {visibleDoctors.map((d) => (
              <article
                key={d.id}
                className="group overflow-hidden rounded-2xl border border-border bg-surface hover:shadow-lg transition-all duration-300"
              >
                <Link href={`${profileBaseHref}/${d.id}`} className="block">
                  <div className="relative h-44 sm:h-48 bg-subtle overflow-hidden">
                    {d.avatarUrl ? (
                      <img
                        src={d.avatarUrl}
                        alt={d.fullName}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-brand/10 via-brand/5 to-emerald-100/30 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center">
                          <span className="text-xl font-semibold text-brand">
                            {d.fullName.charAt(0)}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-text-primary border border-border/50">
                      <CalendarDays className="h-3 w-3 text-emerald-600" />
                      {d.availableDays.length
                        ? `${d.availableDays.length} days`
                        : "No schedule"}
                    </div>
                    <div className="absolute right-3 top-3">
                      <div className="rounded-full bg-brand text-white px-2 py-0.5 text-xs font-semibold">
                        {formatMoney(d.consultationPrice)}
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-semibold text-text-primary">
                          Dr. {d.fullName}
                        </h3>
                        <p className="truncate text-sm text-brand font-medium">
                          {specialtyLabel(d.specialty) ?? "Specialist"}
                        </p>
                      </div>
                    </div>
                    {d.hospital ? (
                      <div className="mt-1.5 flex items-center gap-1.5 text-sm text-text-secondary">
                        <MapPin className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
                        <span className="truncate">{d.hospital}</span>
                      </div>
                    ) : null}
                    <div className="mt-3 flex items-center justify-between">
                      {d.rating !== null ? (
                        <div className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span>{d.rating.toFixed(1)}</span>
                          <span className="text-text-tertiary text-xs">
                            ({d.reviewsCount ?? 0})
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-text-tertiary">
                          New doctor
                        </div>
                      )}
                      <ChatInitiationButton
                        recipientId={d.id}
                        recipientName={d.fullName}
                        recipientType="doctor"
                        compact
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </div>
                </Link>
                {!hideBook && bookBaseHref ? (
                  <div className="px-4 pb-4">
                    <Link
                      href={
                        bookBaseHref.includes("?")
                          ? `${bookBaseHref}${encodeURIComponent(d.id)}`
                          : `${bookBaseHref}${d.id}?book=1`
                      }
                      className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover transition-colors"
                    >
                      Book Appointment
                    </Link>
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-white text-sm font-medium text-text-primary hover:bg-subtle transition-colors disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>Load more doctors ({filtered.length - visibleCount} remaining)</>
                )}
              </button>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-8 sm:p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-subtle flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-text-tertiary" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                No doctors found
              </h3>
              <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">
                Try adjusting your filters or search terms to find more doctors.
              </p>
              <button
                onClick={clearAllFilters}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear all filters
              </button>
            </div>
          ) : null}
        </div>

        {/* Right Sidebar - Filters (Desktop only) */}
        <div className="hidden lg:block w-80 shrink-0">
          <div className="sticky top-24 rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
              <SlidersHorizontal className="h-5 w-5 text-text-secondary" />
              <h3 className="font-semibold text-text-primary">Filters</h3>
              {activeFiltersCount > 0 && (
                <span className="ml-auto text-xs font-medium text-brand bg-brand-light px-2 py-0.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            {renderFilters()}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-border px-4 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" />
                Filters
              </h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 rounded-lg hover:bg-subtle transition-colors"
              >
                <X className="h-5 w-5 text-text-secondary" />
              </button>
            </div>
            <div className="p-4">
              {renderFilters(true)}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-border p-4">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full btn-primary"
              >
                Show {filtered.length} results
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
