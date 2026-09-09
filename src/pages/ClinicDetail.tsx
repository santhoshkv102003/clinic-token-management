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
  Users, Clock, ArrowLeft, RefreshCw, 
  Ticket, Phone, User, AlertCircle
} from "lucide-react";
import { fetchClinicQueue, bookToken as apiBookToken } from "@/services/api";
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

  const [clinic, setClinic] = useState<any>(null);
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Patient Booking Modal State
  const [showPatientBookingModal, setShowPatientBookingModal] = useState(false);
  const [issuedToken, setIssuedToken] = useState<any>(null);

  // Booking Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [department, setDepartment] = useState("");
  const [customDept, setCustomDept] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

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

  const isWaitingOrServing = (s: string) => ['waiting', 'Waiting', 'serving', 'Serving'].includes(s || '');
  const isWaiting = (s: string) => ['waiting', 'Waiting'].includes(s || '');
  const isCompleted = (s: string) => ['completed', 'Completed'].includes(s || '');

  const waitingTokens = tokens.filter(t => isWaitingOrServing(t.status));
  const completedTokens = tokens.filter(t => isCompleted(t.status));
  const servingToken = tokens.find(t => ['serving', 'Serving'].includes(t.status || ''));
  const maxCompletedToken = completedTokens.length > 0 ? Math.max(...completedTokens.map(t => t.tokenNumber || 0)) : 0;
  const currentServingNumber = servingToken ? servingToken.tokenNumber : (clinic?.currentToken || maxCompletedToken || 0);
  const inQueueCount = tokens.filter(t => isWaiting(t.status)).length;
  const estimatedWaitMinutes = inQueueCount * 5;

  // Handle Token Booking (Patient action)
  const handleBookToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId) return;
    if (!name.trim() || !phone.trim() || !age.trim() || !department) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 130) {
      toast({ title: "Invalid age", variant: "destructive" });
      return;
    }
    const finalDept = department === "Others" ? customDept : department;
    if (!finalDept || !finalDept.trim()) {
      toast({ title: "Please select a department", variant: "destructive" });
      return;
    }

    setBookingLoading(true);
    try {
      const tokenResult = await apiBookToken({
        clinicId,
        name: name.trim(),
        phone: phone.trim(),
        age: ageNum,
        department: finalDept.trim(),
      });

      setShowPatientBookingModal(false);
      setName("");
      setPhone("");
      setAge("");
      setDepartment("");
      setCustomDept("");
      toast({
        title: "✅ Token Generated Successfully!",
        description: `Your token number is #${tokenResult.tokenNumber}`,
      });

      const tokenIdToTrack = tokenResult._id || tokenResult.id || tokenResult.tokenNumber;
      navigate(`/patient/token/${tokenIdToTrack}`);
    } catch (e: any) {
      toast({ title: e.message || "Booking failed", variant: "destructive" });
    } finally {
      setBookingLoading(false);
    }
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
          <Button onClick={() => navigate("/patient")} className="bg-[#00a6d6] hover:bg-[#0092bd] text-white">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Clinics
          </Button>
        </div>
      </div>
    );
  }

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
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between mb-2 z-20">
        <button
          onClick={() => navigate("/patient")}
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

        {/* ── Patient Action: Get Token Button ONLY ── */}
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
            className="w-full bg-[#00a6d6] hover:bg-[#0092bd] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-lg text-center"
          >
            Get Token
          </button>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="text-center text-xs text-slate-500 font-medium mt-6">
        {clinic.clinicName} • {clinic.doctorName} • Clinic ID: {clinic.clinicId}
      </div>

      {/* ── MODAL: Patient Token Booking ── */}
      <Dialog open={showPatientBookingModal} onOpenChange={setShowPatientBookingModal}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-md rounded-2xl border border-white/60 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 text-center flex items-center justify-center gap-2">
              <Ticket className="w-6 h-6 text-[#00a6d6]" />
              Book Patient Token
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-slate-500">
              {clinic.clinicName}
            </DialogDescription>
          </DialogHeader>

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
              className="w-full bg-[#00a6d6] hover:bg-[#0092bd] text-white font-bold py-3 rounded-xl mt-2 shadow-md text-base"
            >
              {bookingLoading ? "Generating Token..." : "Generate Token"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
