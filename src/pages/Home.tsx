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
  DoorClosed, Plus, LogIn, LogOut, Stethoscope, ArrowRight, Check
} from "lucide-react";
import { fetchHomeSummary, fetchTop3Clinics, searchClinics, createClinic } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token, login, logout, isSuperAdmin } = useAuth();

  const [top3, setTop3] = useState<any[]>([]);
  const [allClinicsAlphabetical, setAllClinicsAlphabetical] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalClinics: 0, openClinics: 0, closedClinics: 0 });
  const [loading, setLoading] = useState(true);
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
      setLoading(true);
      setError("");
      const [sum, top, all] = await Promise.all([
        fetchHomeSummary(),
        fetchTop3Clinics(),
        searchClinics(""), // Returns all clinics sorted A-Z
      ]);
      setSummary(sum);
      setTop3(top);
      setAllClinicsAlphabetical(all);
    } catch {
      setError("Failed to load. Is the server running?");
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

  // When search box is touched or focused, show results in alphabetical order
  const isBrowsingAll = isSearchFocused && !search.trim();
  const isFiltering = search.trim().length > 0;
  const showAlphabeticalList = isBrowsingAll || isFiltering;
  const displayCards = showAlphabeticalList
    ? (isBrowsingAll ? allClinicsAlphabetical : results)
    : top3;

  // Handle Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginLoading(true);
    try {
      await login(adminEmail.trim(), adminPassword);
      setShowAdminLoginModal(false);
      toast({ title: "✅ Logged in as Admin" });
      // Automatically open Add Clinic modal for Super Admin
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

      // Reset form
      setClinicName("");
      setDoctorName("");
      setClinicPhone("");
      setClinicAddress("");
      setClinicStatus("Open");
      setShowAddClinicModal(false);

      // Reload Home
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
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setSearch(""); setIsSearchFocused(false); }}>
            <div className="w-10 h-10 bg-[#00a6d6]/15 rounded-xl flex items-center justify-center shadow-inner">
              <Heart className="w-6 h-6 text-[#00a6d6]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 leading-tight">ClinicQueue</h1>
              <p className="text-xs text-slate-500 font-medium">Smart Token Management</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                {isSuperAdmin && (
                  <Button
                    onClick={() => setShowAddClinicModal(true)}
                    className="bg-[#00a6d6] hover:bg-[#0092bd] text-white shadow-md text-xs sm:text-sm font-semibold rounded-xl"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Add Clinic
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(user.role === "SUPER_ADMIN" ? "/admin/dashboard" : "/admin/clinic")}
                  className="bg-white/80 rounded-xl text-xs sm:text-sm font-semibold"
                >
                  <Shield className="w-4 h-4 mr-1.5 text-[#00a6d6]" />
                  {user.role === "SUPER_ADMIN" ? "Dashboard" : "My Clinic"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { logout(); toast({ title: "Logged out" }); }}
                  className="text-slate-600 hover:text-slate-900 rounded-xl text-xs sm:text-sm font-semibold"
                >
                  <LogOut className="w-4 h-4 mr-1" /> Logout
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdminLoginModal(true)}
                className="bg-white/90 hover:bg-white text-slate-800 rounded-xl shadow-sm border border-slate-200 text-xs sm:text-sm font-bold px-4 py-2"
              >
                <Shield className="w-4 h-4 mr-1.5 text-[#00a6d6]" />
                Admin Login
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl flex-1">
        {/* ── 3 Summary Stat Cards ── */}
        <div className="grid grid-cols-3 gap-3.5 mb-8 max-w-lg mx-auto">
          <div className="text-center p-4 bg-[#e6f4f8]/90 backdrop-blur-md rounded-2xl border border-white/80 shadow-md transition hover:-translate-y-0.5">
            <div className="flex items-center justify-center mb-1 text-[#00a6d6]">
              <Building2 className="w-5 h-5" />
            </div>
            {loading ? (
              <div className="h-7 w-10 bg-slate-200 rounded animate-pulse mx-auto mb-1" />
            ) : (
              <div className="text-3xl font-extrabold text-[#00a6d6]">{summary.totalClinics}</div>
            )}
            <div className="text-xs text-slate-600 font-bold mt-0.5">Total Clinics</div>
          </div>

          <div className="text-center p-4 bg-[#e6f4f8]/90 backdrop-blur-md rounded-2xl border border-white/80 shadow-md transition hover:-translate-y-0.5">
            <div className="flex items-center justify-center mb-1 text-[#0d9488]">
              <DoorOpen className="w-5 h-5" />
            </div>
            {loading ? (
              <div className="h-7 w-10 bg-slate-200 rounded animate-pulse mx-auto mb-1" />
            ) : (
              <div className="text-3xl font-extrabold text-[#0d9488]">{summary.openClinics}</div>
            )}
            <div className="text-xs text-slate-600 font-bold mt-0.5">Open Now</div>
          </div>

          <div className="text-center p-4 bg-[#e6f4f8]/90 backdrop-blur-md rounded-2xl border border-white/80 shadow-md transition hover:-translate-y-0.5">
            <div className="flex items-center justify-center mb-1 text-[#ef4444]">
              <DoorClosed className="w-5 h-5" />
            </div>
            {loading ? (
              <div className="h-7 w-10 bg-slate-200 rounded animate-pulse mx-auto mb-1" />
            ) : (
              <div className="text-3xl font-extrabold text-[#ef4444]">{summary.closedClinics}</div>
            )}
            <div className="text-xs text-slate-600 font-bold mt-0.5">Closed</div>
          </div>
        </div>

        {/* ── Search Bar with Alphabetical Auto-display on Touch/Focus ── */}
        <div className="max-w-xl mx-auto mb-8 relative" ref={searchBoxRef}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00a6d6]" />
            <Input
              className="pl-11 pr-11 bg-white/95 backdrop-blur-md border-2 border-[#00a6d6]/30 focus:border-[#00a6d6] focus:ring-4 focus:ring-[#00a6d6]/20 h-13 text-base rounded-2xl shadow-lg transition-all"
              placeholder="Search clinic or doctor name ...."
              value={search}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full hover:bg-slate-200/70 p-1 transition"
                onClick={() => setSearch("")}
                title="Clear search"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            )}
          </div>

          {/* ── Dropdown Suggestions when Search is Active / Focused ── */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 shadow-2xl z-40 overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100">
              <div className="px-4 py-2 bg-slate-50/90 text-xs font-bold text-slate-500 flex items-center justify-between uppercase tracking-wider">
                <span>
                  {isFiltering ? `Matching "${search}" (${results.length})` : `All Clinics (Alphabetical A-Z: ${allClinicsAlphabetical.length})`}
                </span>
                <span className="text-[10px] text-[#00a6d6] font-semibold">Click to open</span>
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
                      <Badge variant={c.status === "Open" ? "default" : "secondary"} className={`text-[10px] ${c.status === "Open" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}`}>
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

        {/* ── Error message ── */}
        {error && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-100/90 border border-red-200 rounded-2xl text-center shadow-sm">
            <p className="text-red-700 text-sm font-semibold mb-3">{error}</p>
            <Button size="sm" variant="outline" onClick={loadHome} className="rounded-xl">
              <RefreshCw className="w-4 h-4 mr-1" /> Retry
            </Button>
          </div>
        )}

        {/* ── Section Heading ── */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 drop-shadow-sm flex items-center gap-2">
              {showAlphabeticalList
                ? searching
                  ? "Searching..."
                  : `🔤 Clinics (Alphabetical A-Z: ${displayCards.length})`
                : "🔥 Most Active Clinics"}
            </h2>
            {showAlphabeticalList && (
              <Badge className="bg-[#00a6d6] text-white text-xs font-semibold px-2 py-0.5">
                A → Z
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showAlphabeticalList && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-slate-600 bg-white/70 hover:bg-white rounded-xl"
                onClick={() => { setSearch(""); setIsSearchFocused(false); }}
              >
                Reset
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-700 hover:text-slate-900 bg-white/70 hover:bg-white rounded-xl text-xs"
              onClick={loadHome}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
          </div>
        </div>

        {/* ── Skeleton Loading ── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 bg-white/40 rounded-2xl border border-white/60 animate-pulse" />
            ))}
          </div>
        )}

        {/* ── Clinic Cards Grid ── */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayCards.map((clinic) => (
              <ClinicCard key={clinic.clinicId} {...clinic} />
            ))}
          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && showAlphabeticalList && displayCards.length === 0 && !searching && (
          <div className="text-center py-16 bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm max-w-md mx-auto">
            <Search className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <p className="text-slate-800 text-lg font-bold">No clinics found for "{search}"</p>
            <p className="text-slate-500 text-sm mt-1">Try another letter or name.</p>
            {isSuperAdmin && (
              <Button
                onClick={() => { setClinicName(search); setShowAddClinicModal(true); }}
                className="mt-4 bg-[#00a6d6] hover:bg-[#0092bd] text-white rounded-xl"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add "{search}" as a new clinic
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="text-center text-xs text-slate-500 font-medium py-6">
        ClinicQueue Smart Token Management System
      </footer>

      {/* ── MODAL: Admin Login ── */}
      <Dialog open={showAdminLoginModal} onOpenChange={(open) => { setShowAdminLoginModal(open); if (open) { setAdminEmail(""); setAdminPassword(""); } }}>
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
              <Label className="text-xs font-semibold text-slate-700">Email / Username</Label>
              <Input
                required
                type="text"
                name="superadmin_email_input"
                autoComplete="off"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="superadmin@clinic.com or santhosh@gmail.com"
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
                placeholder="Enter password (e.g. sr1011)"
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="bg-sky-50 border border-sky-100 rounded-lg p-2.5 text-[11px] text-sky-800 flex items-center justify-between">
              <span>Default Super Admin: <b>superadmin@clinic.com</b></span>
              <span className="bg-sky-200/60 px-1.5 py-0.5 rounded font-mono font-semibold">sr1011</span>
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

      {/* ── MODAL: Add Clinic (Clinic Name & Doctor Name) ── */}
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
