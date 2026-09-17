import { useNavigate } from "react-router-dom";
import { User, Users, Clock, Stethoscope, ArrowRight, DoorClosed } from "lucide-react";
import { formatWaitTime } from "@/lib/utils";

interface ClinicCardProps {
  clinicId: string;
  clinicName: string;
  doctorName: string;
  status: "Open" | "Closed" | string;
  currentToken: number;
  waitingCount: number;
  estimatedWait: number;
  index?: number;
}

export function ClinicCard({
  clinicId,
  clinicName,
  doctorName,
  status,
  currentToken,
  waitingCount,
  estimatedWait,
  index = 0,
}: ClinicCardProps) {
  const navigate = useNavigate();
  const isOpen = status === "Open";

  // Color accents matching the screenshot rows:
  // Row 0: Blue accent
  // Row 1: Green accent
  // Row 2: Coral/Red accent
  const themeIndex = index % 3;
  const themes = [
    {
      avatarBg: "bg-[#e0f2fe]",
      avatarIcon: "text-[#0284c7]",
      progressFill: "bg-[#0284c7]",
      barTrack: "bg-[#e0f2fe]",
    },
    {
      avatarBg: "bg-[#d1fae5]",
      avatarIcon: "text-[#0d9488]",
      progressFill: "bg-[#0d9488]",
      barTrack: "bg-[#d1fae5]",
    },
    {
      avatarBg: "bg-[#fee2e2]",
      avatarIcon: "text-[#ef4444]",
      progressFill: "bg-[#ef4444]",
      barTrack: "bg-[#fee2e2]",
    },
  ];

  const currentTheme = themes[themeIndex];

  return (
    <div
      onClick={() => navigate(`/clinic/${clinicId}`)}
      className="group bg-white/70 backdrop-blur-md hover:bg-white/90 rounded-2xl p-4 sm:p-4 border border-white/80 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
    >
      {/* ── Left: Avatar & Names ── */}
      <div className="flex items-center gap-3 min-w-[200px]">
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm ${currentTheme.avatarBg}`}
        >
          {isOpen ? (
            <Stethoscope className={`w-5 h-5 ${currentTheme.avatarIcon}`} />
          ) : (
            <DoorClosed className="w-5 h-5 text-slate-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-snug group-hover:text-[#00a6d6] transition-colors truncate">
            {clinicName}
          </h3>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
            {doctorName}
          </p>
        </div>
      </div>

      {/* ── Middle: Metrics Column ── */}
      <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-8 py-2 sm:py-0 border-y sm:border-y-0 border-slate-100/80">
        {/* Now Serving */}
        <div className="flex flex-col min-w-[75px]">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
            <User className="w-4 h-4 text-[#00a6d6]" />
            <span className="text-sm font-extrabold text-slate-900">
              {currentToken || 0}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Now Serving
          </span>
          {/* Progress / Indicator line below Now Serving */}
          <div className={`w-full h-1 rounded-full ${currentTheme.barTrack} mt-1.5 overflow-hidden`}>
            <div
              className={`h-full rounded-full ${currentTheme.progressFill} transition-all duration-500`}
              style={{ width: isOpen ? `${Math.min(100, Math.max(25, (currentToken || 1) * 20))}%` : "10%" }}
            />
          </div>
        </div>

        {/* Waiting */}
        <div className="flex flex-col min-w-[65px]">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
            <Users className="w-4 h-4 text-[#0d9488]" />
            <span className="text-sm font-extrabold text-slate-900">
              {waitingCount || 0}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Waiting
          </span>
        </div>

        {/* Min wait */}
        <div className="flex flex-col min-w-[65px]">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
            <Clock className="w-4 h-4 text-[#d97706]" />
            <span className="text-sm font-extrabold text-slate-900">
              {formatWaitTime(estimatedWait)}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Min wait
          </span>
        </div>
      </div>

      {/* ── Right: Status Pill & View Clinic Action ── */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-1 sm:pt-0">
        <span
          className={`text-[11px] font-bold px-3 py-0.5 rounded-full border shadow-2xs ${
            isOpen
              ? "bg-[#d1fae5] text-[#047857] border-[#a7f3d0]"
              : "bg-[#fee2e2] text-[#b91c1c] border-[#fca5a5]"
          }`}
        >
          {status}
        </span>

        <span className="text-xs font-bold text-[#00a6d6] group-hover:text-[#008db6] flex items-center gap-1 transition-transform group-hover:translate-x-0.5">
          View Clinic <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
}
