import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, Clock, Home, ArrowLeft, RefreshCw, 
  CheckCircle, Ticket, Phone, User, LogIn, Search, AlertCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchClinicQueue, bookToken as apiBookToken, callNextPatient, updateClinic } from "@/services/api";
import { joinClinicRoom, leaveClinicRoom, onQueueUpdate } from "@/services/socket";

const DEPARTMENTS = [
  "General Medicine",
  "Cardiology",
  "Orthopedics",
  "Dermatology",
  "Pediatrics",
  "ENT",
  "Ophthalmology",
  "Others"
];

export default function ClinicDetail() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token, login, logout } = useAuth();

  const [clinic, setClinic] = useState<any>(null);
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin view toggle (true ONLY when logged in as this specific clinic's admin)
  const isClinicAdmin = user?.role === 'CLINIC_ADMIN' && user?.clinicId === clinicId?.toUpperCase();
  const [isAdminView, setIsAdminView] = useState<boolean>(false);

  // Modals
  const [showPatientBookingModal, setShowPatientBookingModal] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showVisitedModal, setShowVisitedModal] = useState(false);
  const [showUpcomingModal, setShowUpcomingModal] = useState(false);
  const [issuedToken, setIssuedToken] = useState<any>(null);

  // Booking Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [department, setDepartment] = useState("");
  const [customDept, setCustomDept] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  // Admin Login Form State
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);

  // Search filter for visited patients
  const [visitedSearch, setVisitedSearch] = useState("");

  const loadQueue = useCallback(async () => {
    if (!clinicId) return;
    try {
      const data = await fetchClinicQueue(clinicId);
      setClinic(data.clinic);
      setTokens(data.tokens);
    } catch (e) {
      toast({ title: "Failed to load clinic queue", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [clinicId, toast]);

  useEffect(() => {
    loadQueue();
    if (clinicId) {
      joinClinicRoom(clinicId);
      const unsub = onQueueUpdate((data: any) => {
        setClinic(data.clinic);
        setTokens(data.tokens);
      });
      return () => {
        unsub();
        leaveClinicRoom(clinicId!);
      };
    }
  }, [clinicId, loadQueue]);

  // If user was already logged in as admin for this clinic, start in admin view if preferred
  useEffect(() => {
    if (isClinicAdmin) {
      setIsAdminView(true);
    }
  }, [isClinicAdmin]);

  const waitingTokens = tokens.filter(t => t.status === "Waiting" || t.status === "Serving");
  const completedTokens = tokens.filter(t => t.status === "Completed");
  const currentServingNumber = clinic?.currentToken || 0;
  const inQueueCount = tokens.filter(t => t.status === "Waiting").length;
  const estimatedWaitMinutes = inQueueCount * 5;

  // Toggle Open/Closed status in Image 3
  const handleToggleStatus = async () => {
    if (!token || !clinic) return;
    const nextStatus = clinic.status === 'Open' ? 'Closed' : 'Open';
    try {
      await updateClinic(clinicId!, { status: nextStatus }, token);
      setClinic((c: any) => ({ ...c, status: nextStatus }));
      toast({
        title: nextStatus === 'Open' ? '🟢 Clinic is now OPEN' : '🔴 Clinic is now CLOSED',
        description: nextStatus === 'Open' ? 'Patients can now book tokens' : 'Token bookings are paused',
      });
    } catch (e: any) {
      toast({ title: e.message || 'Failed to update status', variant: 'destructive' });
    }
  };

  // Handle Token Booking (Patient action in Image 2)
  const handleBookToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId) return;
    if (!name.trim() || !phone.trim()) {
      toast({ title: "Name and Phone number are required", variant: "destructive" });
      return;
    }
    const finalDept = department === "Others" ? customDept : department;
    setBookingLoading(true);
    try {
      const tokenResult = await apiBookToken({
        clinicId,
        name: name.trim(),
        phone: phone.trim(),
        age: age ? parseInt(age) : undefined,
        department: finalDept || "General Medicine",
      });

      setShowPatientBookingModal(false);
      setIssuedToken(tokenResult);
      setName("");
      setPhone("");
      setAge("");
      setDepartment("");
      setCustomDept("");
      toast({
        title: "✅ Token Booked Successfully!",
        description: `Your token number is #${tokenResult.tokenNumber}`,
      });
    } catch (e: any) {
      toast({ title: e.message || "Booking failed", variant: "destructive" });
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle Admin Booking Button on Image 2
  const handleAdminBookingClick = () => {
    if (isClinicAdmin) {
      setIsAdminView(true);
    } else {
      setAdminEmail("");
      setAdminPassword("");
      setShowAdminLoginModal(true);
    }
  };

  // Handle Admin Login submission
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginLoading(true);
    try {
      const authData = await login(adminEmail.trim(), adminPassword);
      if (authData?.user?.role === 'CLINIC_ADMIN' && authData?.user?.clinicId !== clinicId?.toUpperCase()) {
        throw new Error(`This account belongs to ${authData.user.clinicId}, not this clinic.`);
      }
      setShowAdminLoginModal(false);
      setIsAdminView(true);
      toast({ title: "✅ Logged in as Clinic Admin" });
    } catch (err: any) {
      toast({ title: err.message || "Admin login failed", variant: "destructive" });
    } finally {
      setAdminLoginLoading(false);
    }
  };

  // Handle Call Next Patient (Admin action in Image 3)
  const handleCallNext = async () => {
    if (!token) {
      toast({ title: "Please log in again", variant: "destructive" });
      return;
    }
    try {
      await callNextPatient(clinicId!, token);
      toast({ title: "📢 Called next patient!" });
    } catch (err: any) {
      toast({ title: err.message || "Failed to call next patient", variant: "destructive" });
    }
  };

  // Handle Logout in Image 3
  const handleLogout = () => {
    logout();
    setIsAdminView(false);
    toast({ title: "Logged out from Admin" });
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: "url('/DeWatermark.ai_1752809220809.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="text-center p-8 bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 shadow-lg">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#00a6d6]" />
          <p className="text-slate-700 font-medium">Loading Queue Status...</p>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: "url('/DeWatermark.ai_1752809220809.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="text-center p-8 bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 shadow-lg">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-500" />
          <p className="text-lg font-bold text-slate-800 mb-4">Clinic not found</p>
          <Button onClick={() => navigate("/")} className="bg-[#00a6d6] hover:bg-[#0092bd] text-white">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const filteredVisitedTokens = completedTokens.filter(t => 
    t.name.toLowerCase().includes(visitedSearch.toLowerCase()) ||
    t.tokenNumber.toString().includes(visitedSearch) ||
    (t.department && t.department.toLowerCase().includes(visitedSearch.toLowerCase()))
  );

  return (
    <div
      className="min-h-screen w-full relative flex flex-col justify-between py-8 px-4 sm:px-6 select-none"
      style={{
        backgroundImage: "url('/DeWatermark.ai_1752809220809.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed"
      }}
    >
      {/* ── Top Header Navigation ── */}
      {isAdminView ? (
        <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3 mb-2 z-20">
          {/* Top Left: Open / Closed Status Toggle Button for Admin */}
          <button
            onClick={handleToggleStatus}
            title={`Click to set as ${clinic.status === 'Open' ? 'Closed' : 'Open'}`}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md border transition-all hover:scale-105 active:scale-95 ${
              clinic.status === 'Open'
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-400'
                : 'bg-red-500 hover:bg-red-600 text-white border-red-400'
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${clinic.status === 'Open' ? 'bg-white animate-pulse' : 'bg-white'}`} />
            <span>Clinic: {clinic.status}</span>
            <span className="text-[11px] opacity-85 font-normal">({clinic.status === 'Open' ? 'Click to Close' : 'Click to Open'})</span>
          </button>

          {/* Top Right: Home and Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate("/")}
              title="Home"
              className="bg-white/90 hover:bg-white text-slate-700 p-2.5 rounded-xl shadow-md border border-white/70 transition-all hover:scale-105 active:scale-95"
            >
              <Home className="w-5 h-5 text-slate-800" />
            </button>
            <button
              onClick={handleLogout}
              className="bg-white/90 hover:bg-white text-slate-800 font-semibold px-4 sm:px-5 py-2.5 rounded-xl shadow-md border border-white/70 transition-all hover:scale-105 active:scale-95 text-xs sm:text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-5xl mx-auto flex items-center justify-between mb-2 z-20">
          <button
            onClick={() => navigate("/")}
            title="Back to clinics"
            className="bg-white/80 hover:bg-white text-slate-700 px-3.5 py-2 rounded-xl shadow-sm border border-white/60 transition-all flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Home
          </button>
          <div className="text-right flex items-center gap-2">
            <Badge variant={clinic.status === "Open" ? "default" : "secondary"} className={clinic.status === "Open" ? "bg-emerald-500 text-white text-xs" : "bg-red-500 text-white text-xs"}>
              {clinic.status}
            </Badge>
            <span className="text-xs font-semibold text-slate-600 bg-white/70 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/50">
              {clinic.clinicName}
            </span>
          </div>
        </div>
      )}

      {/* ── Main Container ── */}
      <div className="w-full max-w-4xl mx-auto my-auto space-y-8">
        {/* Title: Queue Status */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1e293b] tracking-tight drop-shadow-sm">
            Queue Status
          </h1>
          {clinic.status === 'Closed' && (
            <p className="text-xs font-semibold text-red-600 bg-red-100/90 px-3 py-1 rounded-full inline-block">
              Clinic is currently closed
            </p>
          )}
        </div>

        {/* ── 3 Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Now Serving */}
          <div className="bg-[#e6f4f8]/90 backdrop-blur-md rounded-2xl p-6 sm:p-7 shadow-lg border border-white/80 text-center flex flex-col items-center justify-center transition-transform hover:-translate-y-1 duration-200">
            <div className="mb-2 text-[#00a6d6]">
              <Users className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div className="text-4xl sm:text-5xl font-extrabold text-[#00a6d6] mb-1">
              {currentServingNumber}
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-800">
              Now Serving
            </div>
            <div className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Please proceed to counter
            </div>
          </div>

          {/* Card 2: In Queue */}
          <div className="bg-[#e6f4f8]/90 backdrop-blur-md rounded-2xl p-6 sm:p-7 shadow-lg border border-white/80 text-center flex flex-col items-center justify-center transition-transform hover:-translate-y-1 duration-200">
            <div className="mb-2 text-[#0d9488]">
              <Users className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div className="text-4xl sm:text-5xl font-extrabold text-[#0d9488] mb-1">
              {inQueueCount}
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-800">
              In Queue
            </div>
            <div className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Patients waiting
            </div>
          </div>

          {/* Card 3: Minutes */}
          <div className="bg-[#e6f4f8]/90 backdrop-blur-md rounded-2xl p-6 sm:p-7 shadow-lg border border-white/80 text-center flex flex-col items-center justify-center transition-transform hover:-translate-y-1 duration-200">
            <div className="mb-2 text-[#f59e0b]">
              <Clock className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div className="text-4xl sm:text-5xl font-extrabold text-[#f59e0b] mb-1">
              {estimatedWaitMinutes}
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-800">
              Minutes
            </div>
            <div className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Estimated Waiting Time
            </div>
          </div>
        </div>

        {/* ── ACTION BUTTONS: VIEW 2 (Public) vs VIEW 3 (Admin) ── */}
        {!isAdminView ? (
          /* ── Image 2 Layout: Patient Booking & Admin Booking ── */
          <div className="flex flex-col gap-4 max-w-sm sm:max-w-md mx-auto mt-6 w-full">
            <button
              onClick={() => {
                if (clinic.status === 'Closed') {
                  toast({ title: "This clinic is currently closed", variant: "destructive" });
                  return;
                }
                setIssuedToken(null);
                setShowPatientBookingModal(true);
              }}
              disabled={clinic.status === 'Closed'}
              className="w-full bg-[#00a6d6] hover:bg-[#0092bd] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-8 rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-base sm:text-lg text-center"
            >
              Patient Booking
            </button>
            <button
              onClick={handleAdminBookingClick}
              className="w-full bg-[#00a6d6] hover:bg-[#0092bd] text-white font-bold py-3.5 px-8 rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-base sm:text-lg text-center"
            >
              Admin Booking
            </button>
          </div>
        ) : (
          /* ── Image 3 Layout: Left Column (3 buttons) + Right Column (Call Next Patient) ── */
          <div className="max-w-3xl mx-auto mt-8 flex flex-col md:flex-row items-center justify-between gap-6 w-full">
            {/* Left 3 stacked buttons */}
            <div className="flex flex-col gap-3.5 w-full md:w-80">
              <button
                onClick={() => {
                  setIssuedToken(null);
                  setShowPatientBookingModal(true);
                }}
                className="w-full bg-[#00a6d6] hover:bg-[#0092bd] text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-base text-center"
              >
                Booking Patient
              </button>
              <button
                onClick={() => setShowVisitedModal(true)}
                className="w-full bg-[#00a6d6] hover:bg-[#0092bd] text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-base text-center"
              >
                Visited Patients
              </button>
              <button
                onClick={() => setShowUpcomingModal(true)}
                className="w-full bg-[#00a6d6] hover:bg-[#0092bd] text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-base text-center"
              >
                Upcoming Patients
              </button>
            </div>

            {/* Right Call Next Patient Button */}
            <div className="w-full md:w-auto flex justify-center items-center">
              <button
                onClick={handleCallNext}
                disabled={waitingTokens.length === 0}
                className="w-full md:w-auto bg-[#ef4444] hover:bg-[#dc2626] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-10 rounded-xl shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 text-lg min-w-[260px] text-center"
              >
                Call Next Patient
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="text-center text-xs text-slate-500 font-medium mt-6">
        {clinic.clinicName} • {clinic.doctorName} • Clinic ID: {clinic.clinicId}
      </div>

      {/* ── MODAL: Patient Booking & Token Display ── */}
      <Dialog open={showPatientBookingModal} onOpenChange={setShowPatientBookingModal}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-md rounded-2xl border border-white/60 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 text-center flex items-center justify-center gap-2">
              <Ticket className="w-6 h-6 text-[#00a6d6]" />
              {issuedToken ? "Token Issued!" : "Patient Booking"}
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-slate-500">
              {clinic.clinicName} ({clinic.clinicId})
            </DialogDescription>
          </DialogHeader>

          {issuedToken ? (
            <div className="space-y-5 py-3 text-center">
              <div className="p-6 bg-[#e6f4f8] rounded-2xl border-2 border-[#00a6d6]/30 shadow-inner">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Your Token Number</div>
                <div className="text-6xl font-black text-[#00a6d6]">#{issuedToken.tokenNumber}</div>
                <div className="mt-3 inline-block px-3 py-1 bg-white/80 rounded-full text-xs font-semibold text-slate-700">
                  Status: {issuedToken.status || "Waiting"}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl text-left space-y-2 text-sm border">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient Name:</span>
                  <span className="font-semibold text-slate-800">{issuedToken.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-medium text-slate-700">{issuedToken.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Department:</span>
                  <span className="font-medium text-slate-700">{issuedToken.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Now Serving:</span>
                  <span className="font-bold text-[#00a6d6]">#{currentServingNumber}</span>
                </div>
                {issuedToken.tokenNumber > currentServingNumber && (
                  <div className="flex justify-between pt-1 border-t text-xs text-[#f59e0b] font-semibold">
                    <span>Estimated Wait:</span>
                    <span>{(issuedToken.tokenNumber - currentServingNumber) * 5} mins</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setIssuedToken(null)}
                  variant="outline"
                  className="flex-1 rounded-xl"
                >
                  Book Another
                </Button>
                <Button
                  onClick={() => setShowPatientBookingModal(false)}
                  className="flex-1 bg-[#00a6d6] hover:bg-[#0092bd] text-white rounded-xl"
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBookToken} className="space-y-4 py-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#00a6d6]" /> Full Name *
                </Label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter patient full name"
                  className="rounded-xl border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#00a6d6]" /> Phone Number *
                </Label>
                <Input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="rounded-xl border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Age *</Label>
                  <Input
                    required
                    type="number"
                    min="0"
                    max="130"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 28"
                    className="rounded-xl border-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Department *</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {department === "Others" && (
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Specify Department *</Label>
                  <Input
                    value={customDept}
                    onChange={(e) => setCustomDept(e.target.value)}
                    placeholder="Enter custom department"
                    className="rounded-xl border-slate-200"
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={bookingLoading || clinic.status === "Closed"}
                className="w-full bg-[#00a6d6] hover:bg-[#0092bd] text-white font-bold py-3 rounded-xl mt-2 shadow-md"
              >
                {bookingLoading ? "Booking Token..." : "Generate Token"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── MODAL: Admin Login ── */}
      <Dialog open={showAdminLoginModal} onOpenChange={setShowAdminLoginModal}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-md rounded-2xl border border-white/60 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 text-center flex items-center justify-center gap-2">
              <LogIn className="w-5 h-5 text-[#00a6d6]" />
              Admin Access
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-slate-500">
              Sign in to manage {clinic.clinicName}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAdminLogin} className="space-y-4 py-2" autoComplete="off">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Admin Email</Label>
              <Input
                required
                type="email"
                name="clinic_admin_email_input"
                autoComplete="off"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Enter the mail"
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Password</Label>
              <Input
                required
                type="password"
                name="clinic_admin_password_input"
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
              className="w-full bg-[#00a6d6] hover:bg-[#0092bd] text-white font-bold py-3 rounded-xl shadow-md mt-2"
            >
              {adminLoginLoading ? "Logging in..." : "Enter Admin Dashboard"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: Visited Patients (Image 3 Feature) ── */}
      <Dialog open={showVisitedModal} onOpenChange={setShowVisitedModal}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col bg-white/95 backdrop-blur-md rounded-2xl border border-white/60 shadow-2xl">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Visited Patients ({completedTokens.length})
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search patient name, token # or dept..."
                value={visitedSearch}
                onChange={(e) => setVisitedSearch(e.target.value)}
                className="pl-9 rounded-xl text-sm"
              />
            </div>

            <div className="overflow-y-auto max-h-[50vh] space-y-2 pr-1">
              {filteredVisitedTokens.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  {completedTokens.length === 0 ? "No patients have visited yet today." : "No matching patients found."}
                </div>
              ) : (
                filteredVisitedTokens.map((t) => (
                  <div
                    key={t._id}
                    className="flex items-center justify-between p-3.5 rounded-xl border bg-slate-50/80 hover:bg-slate-100/80 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm shadow-sm">
                        #{t.tokenNumber}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{t.name}</div>
                        <div className="text-xs text-slate-500">{t.department} • {t.phone}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0.5">Visited</Badge>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {t.completedAt
                          ? new Date(t.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : new Date(t.bookedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: Upcoming Patients (Image 3 Feature) ── */}
      <Dialog open={showUpcomingModal} onOpenChange={setShowUpcomingModal}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col bg-white/95 backdrop-blur-md rounded-2xl border border-white/60 shadow-2xl">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00a6d6]" />
                Upcoming Patients Queue ({waitingTokens.length})
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <div className="overflow-y-auto max-h-[55vh] space-y-2.5 pr-1">
              {waitingTokens.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No patients waiting in queue.
                </div>
              ) : (
                waitingTokens.map((t, idx) => {
                  const isServing = t.status === "Serving";
                  const isNext = !isServing && idx === (waitingTokens.findIndex(x => x.status === "Serving") === -1 ? 0 : 1);
                  return (
                    <div
                      key={t._id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition ${
                        isServing
                          ? "bg-emerald-50/90 border-emerald-300"
                          : isNext
                          ? "bg-amber-50/90 border-amber-300"
                          : "bg-slate-50/80 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-full font-bold flex items-center justify-center text-sm shadow-sm ${
                            isServing
                              ? "bg-emerald-600 text-white"
                              : isNext
                              ? "bg-amber-500 text-white"
                              : "bg-[#00a6d6]/15 text-[#00a6d6]"
                          }`}
                        >
                          #{t.tokenNumber}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                            {t.name}
                            {isServing && <Badge className="bg-emerald-600 text-white text-[10px]">Now Serving</Badge>}
                            {isNext && <Badge className="bg-amber-500 text-white text-[10px]">Next</Badge>}
                          </div>
                          <div className="text-xs text-slate-500">
                            {t.department} • Age: {t.age || "N/A"} • {t.phone}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-slate-700">
                          {isServing ? "At Counter" : `Wait: ~${idx * 5}m`}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(t.bookedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
