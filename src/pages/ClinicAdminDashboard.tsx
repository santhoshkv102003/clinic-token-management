import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Clock, Home, RefreshCw, RotateCcw,
  CheckCircle, Ticket, Phone, User, Search, AlertCircle, Calendar, Save, Stethoscope
} from "lucide-react";
import { fetchClinicQueue, callNextPatient, bookToken as apiBookToken, updateClinic, updateTokenStatus, resetClinicQueue, updateAverageTreatmentTime, fetchClinicHistory } from "@/services/api";
import { joinClinicRoom, leaveClinicRoom, onQueueUpdate } from "@/services/socket";
import { useAuth } from "@/context/AuthContext";
import { formatWaitTime } from "@/lib/utils";

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

export default function ClinicAdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token, clinic: authClinic, logout } = useAuth();

  const clinicId = user?.clinicId || '';

  const [clinic, setClinic] = useState<any>(authClinic);
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showVisitedModal, setShowVisitedModal] = useState(false);
  const [showUpcomingModal, setShowUpcomingModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [issuedToken, setIssuedToken] = useState<any>(null);

  // History State
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string>("");
  const [historySearch, setHistorySearch] = useState("");

  // Average Treatment Time State
  const [avgTimeInput, setAvgTimeInput] = useState<string>("5");
  const [avgTimeSaving, setAvgTimeSaving] = useState(false);

  // Booking Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [department, setDepartment] = useState("");
  const [customDept, setCustomDept] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  // Search filter for visited patients
  const [visitedSearch, setVisitedSearch] = useState("");

  const load = useCallback(async () => {
    if (!clinicId || !token) return;
    try {
      const queueData = await fetchClinicQueue(clinicId);
      setClinic(queueData.clinic);
      setTokens(queueData.tokens);
    } catch (e: any) {
      toast({ title: e.message || 'Failed to load clinic queue', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [clinicId, token, toast]);

  useEffect(() => {
    load();
    if (clinicId) {
      joinClinicRoom(clinicId);
      const unsub = onQueueUpdate((data: any) => {
        setClinic(data.clinic);
        setTokens(data.tokens);
      });
      return () => {
        unsub();
        leaveClinicRoom(clinicId);
      };
    }
  }, [clinicId, load]);

  useEffect(() => {
    if (clinic?.averageTreatmentTime !== undefined) {
      setAvgTimeInput(String(clinic.averageTreatmentTime));
    }
  }, [clinic?.averageTreatmentTime]);

  const isWaitingOrServing = (s: string) => ['waiting', 'Waiting', 'serving', 'Serving'].includes(s || '');
  const isWaiting = (s: string) => ['waiting', 'Waiting'].includes(s || '');
  const isCompleted = (s: string) => ['completed', 'Completed'].includes(s || '');

  const waitingTokens = tokens.filter(t => isWaitingOrServing(t.status));
  const completedTokens = tokens.filter(t => isCompleted(t.status));
  const servingToken = tokens.find(t => ['serving', 'Serving'].includes(t.status || ''));
  const maxCompletedToken = completedTokens.length > 0 ? Math.max(...completedTokens.map(t => t.tokenNumber || 0)) : 0;
  const currentServingNumber = servingToken ? servingToken.tokenNumber : (clinic?.currentToken || maxCompletedToken || 0);
  const inQueueCount = tokens.filter(t => isWaiting(t.status)).length;
  
  const currentAvgTime = clinic?.averageTreatmentTime !== undefined ? Number(clinic.averageTreatmentTime) : 5;
  let remainingServingTime = 0;
  if (servingToken) {
    const startedAt = servingToken.consultationStartedAt || servingToken.bookedAt || new Date();
    const elapsedTime = Math.max(0, Math.floor((new Date().getTime() - new Date(startedAt).getTime()) / 60000));
    remainingServingTime = Math.max(0, currentAvgTime - elapsedTime);
  }
  const estimatedWaitMinutes = (inQueueCount * currentAvgTime) + remainingServingTime;

  // Save Average Treatment Time control handler
  const handleSaveAvgTime = async () => {
    if (!token || !clinicId) return;
    const num = Number(avgTimeInput);
    if (isNaN(num) || num <= 0 || num > 120) {
      toast({ title: "Invalid average treatment time", description: "Must be a number between 1 and 120 minutes", variant: "destructive" });
      return;
    }
    setAvgTimeSaving(true);
    try {
      await updateAverageTreatmentTime(clinicId, num, token);
      setClinic((prev: any) => ({ ...prev, averageTreatmentTime: num }));
      toast({ title: "Average Treatment Time Saved!", description: `Set to ${num} minutes per patient` });
    } catch (err: any) {
      toast({ title: err.message || "Failed to update average treatment time", variant: "destructive" });
    } finally {
      setAvgTimeSaving(false);
    }
  };

  // Open Daily History modal handler
  const handleOpenHistory = async () => {
    if (!token || !clinicId) return;
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const data = await fetchClinicHistory(clinicId, token);
      setHistoryData(data || []);
      if (data && data.length > 0) {
        setSelectedHistoryDate(data[0].date);
      }
    } catch (err: any) {
      toast({ title: err.message || "Failed to fetch clinic history", variant: "destructive" });
    } finally {
      setHistoryLoading(false);
    }
  };

  // Toggle Open/Closed clinic status (Top left button)
  const handleToggleStatus = async () => {
    if (!token || !clinic) return;
    const nextStatus = clinic.status === 'Open' ? 'Closed' : 'Open';
    try {
      await updateClinic(clinicId, { status: nextStatus }, token);
      setClinic((c: any) => ({ ...c, status: nextStatus }));
      toast({
        title: nextStatus === 'Open' ? '🟢 Clinic is now OPEN' : '🔴 Clinic is now CLOSED',
        description: nextStatus === 'Open' ? 'Patients can now book tokens' : 'Token bookings are paused',
      });
    } catch (err: any) {
      toast({ title: err.message || 'Failed to update clinic status', variant: 'destructive' });
    }
  };

  // Reset queue for this clinic (clears all tokens, visited, upcoming to zero)
  const handleResetQueue = async () => {
    if (!token || !clinicId) return;
    try {
      await resetClinicQueue(clinicId, token);
      setClinic((c: any) => ({ ...c, currentToken: 0 }));
      setTokens([]);
      toast({
        title: "🔄 Queue Reset Successfully",
        description: "All queue counts, visited patients, and upcoming patients set to zero!",
      });
      load();
    } catch (err: any) {
      toast({ title: err.message || "Failed to reset queue", variant: "destructive" });
    }
  };

  const handleNext = async () => {
    if (!token) return;

    // Optimistic UI Update: update current tokens & serving state instantly
    const prevTokens = [...tokens];
    const prevClinic = { ...clinic };

    setTokens(prev => {
      const hasServing = prev.some(t => ['serving', 'Serving'].includes(t.status || ''));
      if (hasServing) {
        let servingHandled = false;
        let nextHandled = false;
        return prev.map(t => {
          const isServing = ['serving', 'Serving'].includes(t.status || '');
          const isWaiting = ['waiting', 'Waiting'].includes(t.status || '');
          if (!servingHandled && isServing) {
            servingHandled = true;
            return { ...t, status: 'completed', completedAt: new Date().toISOString() };
          }
          if (servingHandled && !nextHandled && isWaiting) {
            nextHandled = true;
            return { ...t, status: 'serving' };
          }
          return t;
        });
      } else {
        let nextHandled = false;
        return prev.map(t => {
          const isWaiting = ['waiting', 'Waiting'].includes(t.status || '');
          if (!nextHandled && isWaiting) {
            nextHandled = true;
            return { ...t, status: 'serving' };
          }
          return t;
        });
      }
    });

    const nextWaitingToken = tokens.find(t => ['waiting', 'Waiting'].includes(t.status || ''));
    if (nextWaitingToken) {
      setClinic((c: any) => ({ ...c, currentToken: nextWaitingToken.tokenNumber }));
    }

    try {
      await callNextPatient(clinicId, token);
      toast({ title: '📢 Called next patient!' });
    } catch (e: any) {
      setTokens(prevTokens);
      setClinic(prevClinic);
      toast({ title: e.message || 'Failed to call next patient', variant: 'destructive' });
    }
  };

  const handleTokenStatusUpdate = async (tokenId: string, newStatus: string) => {
    if (!token) return;
    const prevTokens = [...tokens];
    setTokens(prev => prev.map(t => (t._id === tokenId || t.id === tokenId || String(t.tokenNumber) === String(tokenId)) ? { ...t, status: newStatus } : t));
    try {
      await updateTokenStatus(tokenId, newStatus, token);
      toast({ title: `Token status updated to ${newStatus}` });
    } catch (err: any) {
      setTokens(prevTokens);
      toast({ title: err.message || 'Failed to update token status', variant: 'destructive' });
    }
  };

  const handleBookToken = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim() || !phone.trim() || !age.trim() || !department) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    const cleanPhone = phone.trim();
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      toast({ title: "Invalid Phone Number", description: "Phone number must be a 10-digit number starting with 6, 7, 8, or 9", variant: "destructive" });
      return;
    }
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 130) {
      toast({ title: "Invalid age", variant: "destructive" });
      return;
    }

    setBookingLoading(true);
    try {
      const tokenResult = await apiBookToken({
        clinicId: clinicId,
        name: name.trim(),
        phone: cleanPhone,
        age: ageNum,
        department: department === "Others" ? customDept.trim() : department,
      });

      setIssuedToken(tokenResult);
      setName("");
      setPhone("");
      setAge("");
      setDepartment("");
      setCustomDept("");
      toast({
        title: "✅ Patient Booked!",
        description: `Token #${tokenResult.tokenNumber} created`,
      });
    } catch (e: any) {
      toast({ title: e.message || "Booking failed", variant: "destructive" });
    } finally {
      setBookingLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
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

  const filteredVisitedTokens = completedTokens.filter(t => 
    t.name.toLowerCase().includes(visitedSearch.toLowerCase()) ||
    t.tokenNumber.toString().includes(visitedSearch) ||
    (t.department && t.department.toLowerCase().includes(visitedSearch.toLowerCase()))
  );

  return (
    <div
      className="min-h-screen w-full relative flex flex-col justify-between py-8 px-4 sm:px-6 select-none overflow-x-hidden"
      style={{
        backgroundImage: "url('/DeWatermark.ai_1752809220809.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed"
      }}
    >
      {/* Left Edge Hover Trigger Strip */}
      <div
        onMouseEnter={() => setIsSidebarOpen(true)}
        className="fixed left-0 top-0 bottom-0 w-6 z-40 cursor-pointer flex items-center justify-center group"
      >
        <div className="w-1.5 h-16 bg-[#00a6d6]/60 group-hover:bg-[#00a6d6] rounded-r-full shadow-md transition-all animate-pulse" />
      </div>

      {/* Slide-Out Hover Sidebar (Matches Image 2) */}
      <div
        onMouseEnter={() => setIsSidebarOpen(true)}
        onMouseLeave={() => setIsSidebarOpen(false)}
        className={`fixed left-0 top-0 bottom-0 z-50 w-72 bg-[#092330]/95 backdrop-blur-xl text-white p-6 shadow-2xl border-r border-cyan-500/20 transition-transform duration-300 ease-in-out flex flex-col justify-between ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Section 1: Patient Records */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold tracking-wider text-[#00a6d6] uppercase">
              Patient Records
            </h3>
            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setShowVisitedModal(true);
                  setIsSidebarOpen(false);
                }}
                className="flex items-center gap-3 w-full p-3 bg-[#113547] hover:bg-[#18455c] rounded-xl text-white font-semibold text-sm border border-cyan-500/20 transition-all text-left group cursor-pointer"
              >
                <div className="p-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span>Visited Patients</span>
              </button>

              <button
                onClick={() => {
                  setShowUpcomingModal(true);
                  setIsSidebarOpen(false);
                }}
                className="flex items-center gap-3 w-full p-3 bg-[#113547] hover:bg-[#18455c] rounded-xl text-white font-semibold text-sm border border-cyan-500/20 transition-all text-left group cursor-pointer"
              >
                <div className="p-1 rounded-md bg-blue-500/20 border border-blue-500/40 text-blue-400">
                  <Users className="w-4 h-4" />
                </div>
                <span>Upcoming Patients</span>
              </button>

              <button
                onClick={() => {
                  handleOpenHistory();
                  setIsSidebarOpen(false);
                }}
                className="flex items-center gap-3 w-full p-3 bg-[#113547] hover:bg-[#18455c] rounded-xl text-white font-semibold text-sm border border-cyan-500/20 transition-all text-left group cursor-pointer"
              >
                <div className="p-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <span>Daily History</span>
              </button>
            </div>
          </div>

          {/* Section 2: Average Treatment Time */}
          <div className="space-y-3 pt-4 border-t border-cyan-500/20">
            <h3 className="text-xs font-extrabold tracking-wider text-[#00a6d6] uppercase">
              Average Treatment Time
            </h3>
            <div className="p-4 bg-[#113547] rounded-xl border border-cyan-500/20 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Input
                  type="number"
                  min="1"
                  max="120"
                  value={avgTimeInput}
                  onChange={(e) => setAvgTimeInput(e.target.value)}
                  className="w-16 h-9 bg-[#092330] border-cyan-500/40 rounded-lg text-center font-bold text-white text-base focus:ring-cyan-500"
                />
                <span className="text-xs text-slate-300 font-medium">mins / patient</span>
                <Button
                  size="sm"
                  onClick={handleSaveAvgTime}
                  disabled={avgTimeSaving}
                  className="bg-[#00a6d6] hover:bg-[#0092bd] text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow cursor-pointer"
                >
                  {avgTimeSaving ? "..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 border-t border-cyan-500/20 pt-4 text-center">
          Sidebar auto-hides when cursor moves away
        </div>
      </div>

      {/* Top Header Navigation */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3 mb-2 z-20">
        {/* Top Left: Open / Closed Status Toggle Button & Reset Queue Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleToggleStatus}
            title={`Click to set as ${clinic?.status === 'Open' ? 'Closed' : 'Open'}`}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md border transition-all hover:scale-105 active:scale-95 ${
              clinic?.status === 'Open'
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-400'
                : 'bg-red-500 hover:bg-red-600 text-white border-red-400'
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${clinic?.status === 'Open' ? 'bg-white animate-pulse' : 'bg-white'}`} />
            <span>Clinic: {clinic?.status}</span>
            <span className="text-[11px] opacity-85 font-normal">({clinic?.status === 'Open' ? 'Click to Close' : 'Click to Open'})</span>
          </button>

          <button
            onClick={handleResetQueue}
            title="Reset Queue to Zero (Clears all tokens, visited, and upcoming)"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#00a6d6] hover:bg-[#0092bd] text-white border border-[#00a6d6] rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Refresh Queue</span>
          </button>
        </div>

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

      {/* Main Container */}
      <div className="w-full max-w-4xl mx-auto my-auto space-y-8">
        {/* Title: Queue Status */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1e293b] tracking-tight drop-shadow-sm">
            Queue Status
          </h1>
          {clinic?.status === 'Closed' && (
            <p className="text-xs font-semibold text-red-600 bg-red-100/90 px-3 py-1 rounded-full inline-block">
              Clinic is currently closed
            </p>
          )}
        </div>

        {/* 3 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Patients Visited */}
          <div className="bg-[#e6f4f8]/90 backdrop-blur-md rounded-2xl p-6 sm:p-7 shadow-lg border border-white/80 text-center flex flex-col items-center justify-center transition-transform hover:-translate-y-1 duration-200">
            <div className="mb-2 text-[#00a6d6]">
              <CheckCircle className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div className="text-4xl sm:text-5xl font-extrabold text-[#00a6d6] mb-1">
              {completedTokens.length}
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-800">
              Patients Visited
            </div>
            <div className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Completed today
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
              {formatWaitTime(estimatedWaitMinutes)}
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-800">
              Minutes
            </div>
            <div className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Estimated Waiting Time
            </div>
          </div>
        </div>

        {/* Currently Consulting Box (Matches Image 1) */}
        <div className="w-full bg-[#6bbda8]/90 backdrop-blur-md rounded-3xl px-5 py-3.5 sm:px-6 sm:py-4 shadow-xl border border-white/60 relative transition-transform hover:scale-[1.005] duration-200">
          {servingToken ? (
            <div>
              {/* Top Row */}
              <div className="flex items-center justify-between gap-3">
                {/* Left: Avatar + Patient Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#196b55] text-white flex items-center justify-center font-extrabold text-lg sm:text-xl flex-shrink-0 shadow-sm border border-white/40">
                    {((servingToken.name || servingToken.patientName || "P").charAt(0)).toUpperCase()}
                  </div>
                  <div className="min-w-0 text-left">
                    <span className="text-[11px] font-semibold text-[#12382c]/80 uppercase tracking-wider block leading-none mb-0.5">
                      Currently consulting
                    </span>
                    <h2 className="text-base sm:text-lg font-extrabold text-[#0a231b] tracking-tight truncate leading-tight">
                      {servingToken.name || servingToken.patientName || "N/A"}
                    </h2>
                  </div>
                </div>

                {/* Right: Token Badge (Fixed width 65px-70px) */}
                <div className="w-[65px] sm:w-[70px] bg-white/80 backdrop-blur-sm rounded-xl py-1.5 border border-white/90 shadow-sm flex flex-col items-center justify-center flex-shrink-0 text-center">
                  <span className="text-[9px] font-extrabold text-[#12382c]/70 uppercase tracking-wider leading-none mb-0.5">
                    Token
                  </span>
                  <span className="text-lg sm:text-xl font-black text-[#0a231b] leading-none">
                    {servingToken.tokenNumber ?? servingToken.token ?? "-"}
                  </span>
                </div>
              </div>

              {/* Thin Divider Line */}
              <div className="my-2.5 border-t border-white/40" />

              {/* Bottom Row: 3 inline fields with icons */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-5 text-xs sm:text-sm font-semibold text-[#0a231b]">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#12382c]" />
                  <span>Age {servingToken.age ?? "N/A"}</span>
                </div>
                <div className="h-3 w-[1px] bg-[#12382c]/25 hidden sm:block" />
                <span className="text-white/60 sm:hidden">•</span>
                <div className="flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-[#12382c]" />
                  <span>
                    {servingToken.department
                      ? servingToken.department.toLowerCase().startsWith("dept")
                        ? servingToken.department
                        : `Dept ${servingToken.department}`
                      : "Dept ENT"}
                  </span>
                </div>
                <div className="h-3 w-[1px] bg-[#12382c]/25 hidden sm:block" />
                <span className="text-white/60 sm:hidden">•</span>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#12382c]" />
                  <span>{servingToken.phone || servingToken.phoneNumber || "N/A"}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 sm:gap-4 py-0.5">
              {/* Left Purple User Icon */}
              <div className="w-10 h-10 rounded-xl bg-purple-600/15 flex items-center justify-center flex-shrink-0 shadow-inner">
                <User className="w-6 h-6 text-purple-800 fill-purple-800/80" />
              </div>

              {/* Right Details */}
              <div className="space-y-0.5 text-left flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-800 animate-pulse" />
                  <span className="text-[11px] font-extrabold tracking-wider text-[#12382c] uppercase">
                    Currently Consulting
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-extrabold text-[#0a231b] tracking-tight">
                    No Patient Currently Consulting
                  </h2>
                  <span className="bg-[#196b55] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-block">
                    Doctor Available
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Horizontal Action Buttons Row (Matches Image 1 & 2) */}
        <div className="max-w-3xl mx-auto mt-6 flex flex-col sm:flex-row items-center justify-center gap-6 w-full">
          <button
            onClick={() => {
              setIssuedToken(null);
              setShowBookingModal(true);
            }}
            className="flex-1 w-full bg-[#00a6d6] hover:bg-[#0092bd] text-white font-bold py-4 px-8 rounded-2xl shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-xl text-center cursor-pointer"
          >
            Booking Patient
          </button>
          <button
            onClick={handleNext}
            disabled={waitingTokens.length === 0}
            className="flex-1 w-full bg-[#ef4444] hover:bg-[#dc2626] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-2xl shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-xl text-center cursor-pointer"
          >
            Call Next Patient
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 font-medium mt-6">
        {clinic?.clinicName || 'Clinic Admin Dashboard'} • {clinic?.doctorName} • Clinic ID: {clinicId}
      </div>

      {/* MODAL: Booking Patient */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-md rounded-2xl border border-white/60 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 text-center flex items-center justify-center gap-2">
              <Ticket className="w-6 h-6 text-[#00a6d6]" />
              {issuedToken ? "Token Issued!" : "Book Patient Token"}
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-slate-500">
              {clinic?.clinicName}
            </DialogDescription>
          </DialogHeader>

          {issuedToken ? (
            <div className="space-y-5 py-3 text-center">
              <div className="p-6 bg-[#e6f4f8] rounded-2xl border-2 border-[#00a6d6]/30 shadow-inner">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Generated Token</div>
                <div className="text-6xl font-black text-[#00a6d6]">#{issuedToken.tokenNumber}</div>
                <div className="mt-3 inline-block px-3 py-1 bg-white/80 rounded-full text-xs font-semibold text-slate-700">
                  Status: {issuedToken.status || "Waiting"}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl text-left space-y-2 text-sm border">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient:</span>
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
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setIssuedToken(null)} variant="outline" className="flex-1 rounded-xl">
                  Book Another
                </Button>
                <Button onClick={() => setShowBookingModal(false)} className="flex-1 bg-[#00a6d6] hover:bg-[#0092bd] text-white rounded-xl">
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
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  placeholder="10-digit mobile number (starts with 6-9)"
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
                disabled={bookingLoading}
                className="w-full bg-[#00a6d6] hover:bg-[#0092bd] text-white font-bold py-3 rounded-xl mt-2 shadow-md"
              >
                {bookingLoading ? "Booking Token..." : "Generate Token"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: Visited Patients */}
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

      {/* MODAL: Upcoming Patients */}
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
                  const isServing = ['serving', 'Serving'].includes(t.status || '');
                  const isNext = !isServing && idx === (waitingTokens.findIndex(x => ['serving', 'Serving'].includes(x.status || '')) === -1 ? 0 : 1);
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
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-semibold text-slate-700">
                            {isServing ? "At Counter" : `Wait: ~${idx * 5}m`}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(t.bookedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {isServing && (
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2"
                              onClick={() => handleTokenStatusUpdate(t._id, 'completed')}
                            >
                              Complete
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-red-600 hover:bg-red-50 border-red-200 px-2"
                            onClick={() => handleTokenStatusUpdate(t._id, 'cancelled')}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-amber-700 hover:bg-amber-50 px-2"
                            onClick={() => handleTokenStatusUpdate(t._id, 'no_show')}
                          >
                            No-Show
                          </Button>
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

      {/* MODAL: Daily Clinic History */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col bg-white/95 backdrop-blur-md rounded-2xl border border-white/60 shadow-2xl">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#00a6d6]" />
                Daily Patient History
              </span>
              <Badge variant="outline" className="text-xs font-bold border-[#00a6d6] text-[#00a6d6]">
                {clinic?.clinicName || clinicId}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Completed and visited patient history separated by date for clinic {clinicId}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3">
            {/* Date Selector & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
              <div className="w-full sm:w-56">
                <Label className="text-[11px] font-bold text-slate-600 mb-1 block">Select Date</Label>
                <Select value={selectedHistoryDate} onValueChange={setSelectedHistoryDate}>
                  <SelectTrigger className="rounded-xl text-xs font-semibold h-9 border-slate-200 bg-slate-50">
                    <SelectValue placeholder="Select date" />
                  </SelectTrigger>
                  <SelectContent>
                    {historyData.map((h) => (
                      <SelectItem key={h.date} value={h.date} className="text-xs font-medium">
                        📅 {h.date} ({h.patients?.length || 0} visited)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:flex-1">
                <Label className="text-[11px] font-bold text-slate-600 mb-1 block">Search Patients</Label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Search name, phone, dept, token #..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="pl-8 h-9 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Patient List */}
            <div className="overflow-y-auto max-h-[50vh] space-y-2 pr-1">
              {historyLoading ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00a6d6]" />
                  Loading clinic history...
                </div>
              ) : historyData.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No historical patient records found for this clinic.
                </div>
              ) : (
                (() => {
                  const currentDayGroup = historyData.find(h => h.date === selectedHistoryDate);
                  const patients = currentDayGroup?.patients || [];
                  const filtered = patients.filter((t: any) =>
                    t.name.toLowerCase().includes(historySearch.toLowerCase()) ||
                    t.tokenNumber.toString().includes(historySearch) ||
                    (t.phone && t.phone.includes(historySearch)) ||
                    (t.department && t.department.toLowerCase().includes(historySearch.toLowerCase()))
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-400 text-sm">
                        {patients.length === 0 ? `No visited patients recorded on ${selectedHistoryDate}.` : "No matching records found."}
                      </div>
                    );
                  }

                  return filtered.map((t: any) => (
                    <div
                      key={t._id}
                      className="p-3.5 rounded-xl border bg-slate-50/90 hover:bg-slate-100/90 transition text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs shadow-sm">
                            #{t.tokenNumber}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{t.name}</div>
                            <div className="text-slate-500 text-[11px]">
                              {t.department} • Age: {t.age || "N/A"} • 📞 {t.phone}
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0.5">
                          Visited
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-white/80 p-2 rounded-lg border text-[11px] text-slate-600">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Booked Time</span>
                          <span className="font-semibold text-slate-700">
                            {t.bookedAt ? new Date(t.bookedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Serving Time</span>
                          <span className="font-semibold text-slate-700">
                            {t.consultationStartedAt ? new Date(t.consultationStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Duration</span>
                          <span className="font-semibold text-emerald-700">
                            {t.consultationDuration ? `${t.consultationDuration} mins` : '5 mins'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
