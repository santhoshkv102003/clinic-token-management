import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock } from "lucide-react";
import { useQueue } from "../QueueContext";

export function QueueDisplay() {
  const { currentNumber, tokens } = useQueue();
  
  // Only count tokens that are not yet served
  const waitingTokens = tokens.filter(token => token.tokenNumber >= currentNumber);
  const waitingCount = waitingTokens.length;
  const estimatedWait = waitingCount * 5;

  const displayCurrentNumber = tokens.length > 0 ? Math.max(0, currentNumber - 1) : 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="text-center bg-transparent shadow-none border-none">
        <CardHeader className="flex flex-col space-y-1.5 p-2">
          <CardTitle className="text-3xl sm:text-4xl font-extrabold text-[#1e293b] tracking-tight">
            Queue Status
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {/* Current Number */}
            <div className="bg-[#e6f4f8]/90 backdrop-blur-md rounded-2xl p-6 sm:p-7 shadow-lg border border-white/80 text-center flex flex-col items-center justify-center transition-transform hover:-translate-y-1 duration-200">
              <div className="mb-2 text-[#00a6d6]">
                <Users className="w-7 h-7 stroke-[2.2]" />
              </div>
              <div className="text-4xl sm:text-5xl font-extrabold text-[#00a6d6] mb-1">
                {displayCurrentNumber}
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-800">
                Now Serving
              </div>
              <div className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Please proceed to counter
              </div>
            </div>
            
            {/* Queue Length */}
            <div className="bg-[#e6f4f8]/90 backdrop-blur-md rounded-2xl p-6 sm:p-7 shadow-lg border border-white/80 text-center flex flex-col items-center justify-center transition-transform hover:-translate-y-1 duration-200">
              <div className="mb-2 text-[#0d9488]">
                <Users className="w-7 h-7 stroke-[2.2]" />
              </div>
              <div className="text-4xl sm:text-5xl font-extrabold text-[#0d9488] mb-1">
                {waitingCount}
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-800">
                In Queue
              </div>
              <div className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Patients waiting
              </div>
            </div>
            
            {/* Average Wait */}
            <div className="bg-[#e6f4f8]/90 backdrop-blur-md rounded-2xl p-6 sm:p-7 shadow-lg border border-white/80 text-center flex flex-col items-center justify-center transition-transform hover:-translate-y-1 duration-200">
              <div className="mb-2 text-[#f59e0b]">
                <Clock className="w-7 h-7 stroke-[2.2]" />
              </div>
              <div className="text-4xl sm:text-5xl font-extrabold text-[#f59e0b] mb-1">
                {estimatedWait}
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-800">
                Minutes
              </div>
              <div className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Estimated Waiting Time
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}