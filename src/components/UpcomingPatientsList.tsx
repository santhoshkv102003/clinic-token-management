import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Clock, MapPin, Phone, User, Calendar } from "lucide-react";
import { useQueue } from "../QueueContext";

interface UpcomingPatientsListProps {
  onBack: () => void;
}

export function UpcomingPatientsList({ onBack }: UpcomingPatientsListProps) {
  const { currentNumber, tokens } = useQueue();

  // Get all waiting tokens (tokens that haven't been called yet)
  const waitingTokens = tokens.filter(token => token.tokenNumber >= currentNumber);
  
  // Calculate waiting time for each patient
  const tokensWithWaitTime = waitingTokens.map((token, index) => {
    const position = token.tokenNumber - currentNumber;
    const estimatedWaitTime = position * 5; // 5 minutes per patient
    return {
      ...token,
      estimatedWaitTime,
      position
    };
  });

  // Sort by token number (earliest first)
  const sortedTokens = tokensWithWaitTime.sort((a, b) => a.tokenNumber - b.tokenNumber);

  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center py-8"
      style={{
        backgroundImage: "url('/DeWatermark.ai_1752809220809.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      <div className="w-full max-w-xl">
        <Button 
          onClick={onBack} 
          className="mb-6 mt-2 p-6 bg-card/50 rounded-xl border-2 border-primary/20 text-black"
        >
          ← Back
        </Button>

        <div className="p-6 bg-card/50 rounded-xl border-2 border-primary/20">
          <div className="font-semibold text-lg mb-4">Upcoming Patients</div>
          {waitingTokens.length === 0 ? (
            <div className="text-center py-8 text-black flex-1 flex items-center justify-center">
              No patients in queue
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {sortedTokens.map((token, index) => {
                const isNext = index === 0;
                const isCurrent = token.tokenNumber === currentNumber;
                
                return (
                  <div 
                    key={token.tokenNumber} 
                    className={`p-6 rounded-lg border transition-all duration-200 ${
                      isCurrent 
                        ? 'bg-success/10 border-success/20 shadow-lg' 
                        : isNext 
                        ? 'bg-warning/10 border-warning/20 shadow-md' 
                        : 'bg-card/50 border-border hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      {/* Left side - Token number and patient info */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg ${
                          isCurrent 
                            ? 'bg-success text-success-foreground' 
                            : isNext 
                            ? 'bg-warning text-warning-foreground' 
                            : 'bg-primary/10 text-primary'
                        }`}>
                          #{token.tokenNumber}
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <div className="font-semibold text-lg">{token.name}</div>
                            {isCurrent && (
                              <Badge variant="default" className="bg-success">
                                Now Serving
                              </Badge>
                            )}
                            {isNext && !isCurrent && (
                              <Badge variant="default" className="bg-warning">
                                Next
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span>{token.phone}</span>
                              {token.age && (
                                <span className="text-muted-foreground">• Age: {token.age}</span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>{token.department}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right side - Wait time and booking time */}
                      <div className="text-right space-y-2">
                        <div className="flex items-center gap-2 justify-end">
                          <Clock className="w-4 h-4 text-warning" />
                          <div className="text-right">
                            <div className="font-semibold text-lg">
                              {isCurrent ? "Now" : `${token.estimatedWaitTime} min`}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {isCurrent ? "Being served" : "Estimated wait"}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 justify-end text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(token.bookedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 