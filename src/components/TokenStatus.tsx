import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ticket, Clock, MapPin, Phone, ArrowLeft } from "lucide-react";

interface TokenStatusProps {
  token: any;
  currentNumber: number;
  onBack: () => void;
}

export function TokenStatus({ token, currentNumber, onBack }: TokenStatusProps) {
  const position = Math.max(0, token.tokenNumber - currentNumber);
  const estimatedWaitTime = position * 5;
  const isNext = position <= 1;
  const isCurrent = token.tokenNumber === currentNumber;

  const getStatusColor = () => {
    if (isCurrent) return "bg-success";
    if (isNext) return "bg-warning";
    return "bg-primary";
  };

  const getStatusText = () => {
    if (isCurrent) return "Your turn - Please proceed";
    if (isNext) return "You're next!";
    return `${position} ahead of you`;
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Booking
      </Button>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Ticket className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Your Token</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Token Number */}
          <div className="text-center">
            <div className="text-6xl font-bold text-primary mb-2">#{token.tokenNumber}</div>
            <Badge className={`${getStatusColor()} text-white text-sm px-3 py-1`}>
              {getStatusText()}
            </Badge>
          </div>

          {/* Patient Info */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Phone className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-medium">{token.name}</div>
                <div className="text-sm text-muted-foreground">{token.phone}</div>
                {token.age && (
                  <div className="text-sm text-muted-foreground">Age: {token.age} years</div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                <MapPin className="w-4 h-4 text-accent" />
              </div>
              <div>
                <div className="font-medium">Department</div>
                <div className="text-sm text-muted-foreground">{token.department}</div>
              </div>
            </div>
          </div>

          {/* Wait Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="text-2xl font-bold text-primary">{currentNumber}</div>
              <div className="text-sm text-muted-foreground">Now Serving</div>
            </div>
            
            <div className="text-center p-4 bg-warning/5 rounded-lg border border-warning/20">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-4 h-4 text-warning" />
              </div>
              <div className="text-2xl font-bold text-warning">{estimatedWaitTime}</div>
              <div className="text-sm text-muted-foreground">Minutes</div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="text-center text-sm text-muted-foreground border-t pt-4">
            <div>Booked at: {new Date(token.bookedAt).toLocaleString()}</div>
          </div>

          {isCurrent && (
            <div className="p-4 bg-success/10 rounded-lg border border-success/20 text-center">
              <div className="text-success font-semibold">🎉 It's your turn!</div>
              <div className="text-sm text-success/80 mt-1">Please proceed to the reception counter</div>
            </div>
          )}

          {isNext && !isCurrent && (
            <div className="p-4 bg-warning/10 rounded-lg border border-warning/20 text-center">
              <div className="text-warning font-semibold">⏰ Get ready!</div>
              <div className="text-sm text-warning/80 mt-1">You're next in line</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}