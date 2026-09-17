import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ClinicCard } from "@/components/ClinicCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Heart, Search, Shield, RefreshCw, X, Building2, DoorOpen,
  DoorClosed, Plus, ArrowRight, ArrowLeft
} from "lucide-react";
import { fetchHomeSummary, fetchTop3Clinics, searchClinics, createClinic } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token, login } = useAuth();

  // Instant Cache helpers
  const CACHE_KEY_SUMMARY = "cq_home_summary_cache";
  const CACHE_KEY_TOP3 = "cq_home_top3_cache";

  const getCachedSummary = () => {
    try {
      const saved = sessionStorage.getItem(CACHE_KEY_SUMMARY);
      return saved ? JSON.parse(saved) : { totalClinics: 0, openClinics: 0, closedClinics: 0 };
    } catch {
      return { totalClinics: 0, openClinics: 0, closedClinics: 0 };
    }
  };

  const getCachedTop3 = () => {
    try {
      const saved = sessionStorage.getItem(CACHE_KEY_TOP3);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const cachedTop3 = getCachedTop3();
  const cachedSummary = getCachedSummary();

  const [top3, setTop3] = useState<any[]>(cachedTop3);
  const [allClinicsAlphabetical, setAllClinicsAlphabetical] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [summary, setSummary] = useState(cachedSummary);
  // If cached data exists, render instantly without skeleton delay!
  const [loading, setLoading] = useState(cachedTop3.length === 0);
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [error, setError] = useState("");

  // Modals
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showAddClinicModal, setShowAddClinicModal] = useState(false);

  // Admin Login State
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);

  // Add Clinic Form State
  const [clinicName, setClinicName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicStatus, setClinicStatus] = useState("Open");
  const [addClinicLoading, setAddClinicLoading] = useState(false);

  const searchBoxRef = useRef<HTMLDivElement>(null);

  const loadHome = async () => {
    try {
      // Only show skeleton loading if we have no cached data at all
      if (top3.length === 0) {
        setLoading(true);
      }
      setError("");

      // Fetch Summary and Top 3 Clinics in parallel for ultra-fast rendering
      const [sum, top] = await Promise.all([
        fetchHomeSummary(),
        fetchTop3Clinics(),
      ]);

      setSummary(sum);
      setTop3(top);
      setLoading(false);

      // Save to cache for instant future loads
      try {
        sessionStorage.setItem(CACHE_KEY_SUMMARY, JSON.stringify(sum));
        sessionStorage.setItem(CACHE_KEY_TOP3, JSON.stringify(top));
      } catch {}

      // Non-blocking background fetch for search dropdown list
      searchClinics("").then((all) => {
        setAllClinicsAlphabetical(all);
      }).catch(() => {});
    } catch {
      if (top3.length === 0) {
        setError("Failed to load. Is the server running?");
      }
    } finally {
      setLoading(false);
    }
  };

  const doSearch = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const data = await searchClinics(q);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    loadHome();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      doSearch(search);
    }, 200);
    return () => clearTimeout(t);
  }, [search, doSearch]);

  // Handle clicking outside of search suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search filtering state for the left search dropdown
  const isBrowsingAll = isSearchFocused && !search.trim();
  const isFiltering = search.trim().length > 0;

  // The right side section ALWAYS shows the Top 3 Most Active Clinics
  const displayCards = top3;

  // Handle Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginLoading(true);
    try {
      await login(adminEmail.trim(), adminPassword);
      setShowAdminLoginModal(false);
      toast({ title: "✅ Logged in as Admin" });
      setTimeout(() => {
        setShowAddClinicModal(true);
      }, 300);
    } catch (err: any) {
      toast({ title: err.message || "Login failed", variant: "destructive" });
    } finally {
      setAdminLoginLoading(false);
    }
  };

  // Handle Create / Add Clinic
  const handleAddClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicName.trim() || !doctorName.trim()) {
      toast({ title: "Clinic Name and Doctor Name are required", variant: "destructive" });
      return;
    }
    if (!token) {
      toast({ title: "Admin session expired. Please log in again.", variant: "destructive" });
      setShowAdminLoginModal(true);
      return;
    }

    setAddClinicLoading(true);
    try {
      await createClinic(
        {
          clinicName: clinicName.trim(),
          doctorName: doctorName.trim(),
          phone: clinicPhone.trim(),
          address: clinicAddress.trim(),
          status: clinicStatus,
        },
        token
      );

      toast({
        title: "✅ Clinic Added Successfully!",
        description: `${clinicName} (${doctorName}) is now live.`,
      });

      setClinicName("");
      setDoctorName("");
      setClinicPhone("");
      setClinicAddress("");
      setClinicStatus("Open");
      setShowAddClinicModal(false);

      loadHome();
    } catch (err: any) {
      toast({ title: err.message || "Failed to add clinic", variant: "destructive" });
    } finally {
      setAddClinicLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative flex flex-col justify-between"
      style={{
        backgroundImage: "url('/DeWatermark.ai_1752809220809.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      {/* ── Header ── */}
      <header className="bg-white/70 backdrop-blur-md sticky top-0 z-50 shadow-2xs border-b border-white/60 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 py-3.5 flex items-center justify-between gap-4">
          <div
            className="flex items-center gap-3 cursor-pointer shrink-0"
            onClick={() => {
              setSearch("");
              setIsSearchFocused(false);
            }}
          >
            <div className="w-10 h-10 bg-[#00a6d6]/15 rounded-xl flex items-center justify-center shadow-inner shrink-0">
              <Heart className="w-5 h-5 text-[#00a6d6]" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-800 leading-tight">
                ClinicQueue
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 font-semibold">
                Smart Token Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-xs border border-slate-200 text-xs sm:text-sm font-bold px-4 py-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5 text-[#00a6d6]" />
              Portal Selection
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10 max-w-7xl flex-1 flex flex-col justify-between">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start my-auto">
          {/* ── Left Hero & Search Column (col-span-5) ── */}
          <div className="lg:col-span-5 flex flex-col justify-between py-2 sm:py-4">
            <div>
              {/* Tagline */}
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-[3px] bg-[#00a6d6] rounded-full" />
                <span className="text-xs sm:text-sm font-bold text-slate-600 tracking-wide">
                  Welcome Back
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl font-extrabold text-[#1a2b4c] leading-[1.12] mb-4 tracking-tight">
                Better Care<br />Starts Here
              </h1>

              {/* Subtitle */}
              <p className="text-slate-600 text-sm sm:text-base font-medium mb-8 max-w-md leading-relaxed">
                Manage clinics, doctors and patient queues efficiently
              </p>

              {/* Search Box */}
              <div className="relative w-full max-w-md mb-8" ref={searchBoxRef}>
                <div className="relative flex items-center">
                  <Search className="absolute left-4 w-4 h-4 text-[#00a6d6] pointer-events-none" />
                  <Input
                    className="w-full pl-11 pr-10 py-3.5 h-12 bg-white/95 backdrop-blur-md rounded-full border border-slate-200 shadow-md text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00a6d6]/30 transition-all"
                    placeholder="Search clinic or doctor name ...."
                    value={search}
                    onFocus={() => setIsSearchFocused(true)}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      className="absolute right-3.5 rounded-full hover:bg-slate-100 p-1 transition text-slate-400 hover:text-slate-600"
                      onClick={() => setSearch("")}
                      title="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Dropdown Suggestions */}
                {isSearchFocused && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-100 shadow-2xl z-40 overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100">
                    <div className="px-4 py-2 bg-slate-50/90 text-xs font-bold text-slate-500 flex items-center justify-between uppercase tracking-wider">
                      <span>
                        {isFiltering
                          ? `Matching "${search}" (${results.length})`
                          : `All Clinics (Alphabetical A-Z: ${allClinicsAlphabetical.length})`}
                      </span>
                      <span className="text-[10px] text-[#00a6d6] font-semibold">
                        Click to open
                      </span>
                    </div>

                    {(isFiltering ? results : allClinicsAlphabetical).length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">
                        No clinic starting with or matching "{search}"
                      </div>
                    ) : (
                      (isFiltering ? results : allClinicsAlphabetical).map((c) => (
                        <div
                          key={c.clinicId}
                          onClick={() => navigate(`/clinic/${c.clinicId}`)}
                          className="px-4 py-3 hover:bg-[#e6f4f8]/70 cursor-pointer flex items-center justify-between transition group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#00a6d6]/10 text-[#00a6d6] flex items-center justify-center font-bold text-xs group-hover:bg-[#00a6d6] group-hover:text-white transition">
                              {c.clinicName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 text-sm group-hover:text-[#00a6d6] transition">
                                {c.clinicName}
                              </div>
                              <div className="text-xs text-slate-500">
                                {c.doctorName} • {c.clinicId}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge
                              variant={c.status === "Open" ? "default" : "secondary"}
                              className={`text-[10px] ${
                                c.status === "Open"
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                  : ""
                              }`}
                            >
                              {c.status}
                            </Badge>
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#00a6d6] group-hover:translate-x-0.5 transition" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quote Box at bottom left */}
            <div className="pt-6 border-t border-slate-300/40 max-w-xs mt-6">
              <p className="text-slate-600 text-xs sm:text-sm font-medium italic leading-relaxed">
                "Connecting Healthcare, Creating Healthier Communities."
              </p>
              <div className="w-8 h-[2px] bg-[#00a6d6] mt-2 rounded-full" />
            </div>
          </div>

          {/* ── Right Column (col-span-7) ── */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* ── Top 3 Stat Cards Row ── */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
              {/* Total Clinics */}
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/80 shadow-xs flex items-center gap-2.5 sm:gap-3.5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#d0f0fd] text-[#00a6d6] flex items-center justify-center shrink-0 shadow-2xs">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  {loading ? (
                    <div className="h-6 w-8 bg-slate-200 animate-pulse rounded" />
                  ) : (
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#00a6d6] leading-none">
                      {summary.totalClinics}
                    </div>
                  )}
                  <div className="text-[10px] sm:text-xs text-slate-600 font-bold mt-1 leading-tight">
                    Total Clinics
                  </div>
                </div>
              </div>

              {/* Open Now */}
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/80 shadow-xs flex items-center gap-2.5 sm:gap-3.5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#d1fae5] text-[#059669] flex items-center justify-center shrink-0 shadow-2xs">
                  <DoorOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  {loading ? (
                    <div className="h-6 w-8 bg-slate-200 animate-pulse rounded" />
                  ) : (
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#059669] leading-none">
                      {summary.openClinics}
                    </div>
                  )}
                  <div className="text-[10px] sm:text-xs text-slate-600 font-bold mt-1 leading-tight">
                    Open Now
                  </div>
                </div>
              </div>

              {/* Closed */}
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/80 shadow-xs flex items-center gap-2.5 sm:gap-3.5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#fee2e2] text-[#ef4444] flex items-center justify-center shrink-0 shadow-2xs">
                  <DoorClosed className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  {loading ? (
                    <div className="h-6 w-8 bg-slate-200 animate-pulse rounded" />
                  ) : (
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#ef4444] leading-none">
                      {summary.closedClinics}
                    </div>
                  )}
                  <div className="text-[10px] sm:text-xs text-slate-600 font-bold mt-1 leading-tight">
                    Closed
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-100/90 border border-red-200 rounded-xl text-center">
                <p className="text-red-700 text-xs font-semibold mb-2">{error}</p>
                <Button size="sm" variant="outline" onClick={loadHome} className="rounded-lg text-xs">
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
                </Button>
              </div>
            )}

            {/* ── Section Title Bar ── */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-800 flex items-center gap-2">
                  🔥 Most Active Clinics
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="text-xs text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white rounded-lg px-2.5 py-1 font-semibold flex items-center gap-1 transition"
                  onClick={loadHome}
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>
            </div>

            {/* ── Clinics Horizontal Rows Container ── */}
            <div className="space-y-3">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-white/40 rounded-2xl animate-pulse border border-white/60"
                  />
                ))
              ) : displayCards.length === 0 ? (
                <div className="text-center py-12 bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-xs">
                  <Search className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                  <p className="text-slate-800 text-base font-bold">
                    No clinics found matching "{search}"
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    Try typing another doctor or clinic name.
                  </p>
                </div>
              ) : (
                displayCards.map((clinic, idx) => (
                  <ClinicCard key={clinic.clinicId} index={idx} {...clinic} />
                ))
              )}
            </div>

            {/* ── Bottom Right Decorative Graphic Tagline ── */}
            <div className="flex items-center justify-end gap-1.5 pt-2 text-[#00a6d6]">
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="font-handwriting text-lg sm:text-xl font-bold italic tracking-wide text-slate-700">
                Healthier People Brighter Tomorrows
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* ── MODAL: Admin Login ── */}
      <Dialog
        open={showAdminLoginModal}
        onOpenChange={(open) => {
          setShowAdminLoginModal(open);
          if (open) {
            setAdminEmail("");
            setAdminPassword("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-md rounded-2xl border border-white/60 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 text-center flex items-center justify-center gap-2">
              <Shield className="w-6 h-6 text-[#00a6d6]" />
              Admin Login
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-slate-500">
              Sign in as Super Admin to add & manage clinics
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAdminLogin} className="space-y-4 py-2" autoComplete="off">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Email ID</Label>
              <Input
                required
                type="text"
                name="superadmin_email_input"
                autoComplete="off"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Enter the mailid"
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Password</Label>
              <Input
                required
                type="password"
                name="superadmin_password_input"
                autoComplete="new-password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter the password"
                className="rounded-xl border-slate-200"
              />
            </div>

            <Button
              type="submit"
              disabled={adminLoginLoading}
              className="w-full bg-[#00a6d6] hover:bg-[#0092bd] text-white font-bold py-3 rounded-xl shadow-md text-sm mt-2"
            >
              {adminLoginLoading ? "Logging in..." : "Login to Add Clinics"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: Add Clinic ── */}
      <Dialog open={showAddClinicModal} onOpenChange={setShowAddClinicModal}>
        <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-md rounded-2xl border border-white/60 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#00a6d6]" />
              Add New Clinic
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Enter the clinic name and doctor name to register a new clinic.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddClinic} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">
                Clinic Name *
              </Label>
              <Input
                required
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="e.g. Well Care Multispeciality Clinic"
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">
                Doctor Name *
              </Label>
              <Input
                required
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="e.g. Dr. Williams / Dr. Kumar"
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  Phone Number
                </Label>
                <Input
                  type="tel"
                  value={clinicPhone}
                  onChange={(e) => setClinicPhone(e.target.value)}
                  placeholder="044-xxxxxxx"
                  className="rounded-xl border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  Initial Status
                </Label>
                <Select value={clinicStatus} onValueChange={setClinicStatus}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">
                Address / Location
              </Label>
              <Input
                value={clinicAddress}
                onChange={(e) => setClinicAddress(e.target.value)}
                placeholder="e.g. 123 Main Road, City"
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddClinicModal(false)}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addClinicLoading}
                className="flex-1 bg-[#00a6d6] hover:bg-[#0092bd] text-white font-bold rounded-xl shadow-md"
              >
                {addClinicLoading ? "Saving Clinic..." : "Create Clinic"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
