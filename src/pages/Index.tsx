import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TokenBooking } from "@/components/TokenBooking";
import { QueueDisplay } from "@/components/QueueDisplay";
import { TokenStatus } from "@/components/TokenStatus";
import { AdminPanel } from "@/components/AdminPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Shield, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [currentNumber, setCurrentNumber] = useState(1);
  const [tokens, setTokens] = useState<any[]>([]);
  const [userToken, setUserToken] = useState<any>(null);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const { toast } = useToast();
  // Remove showPatientBooking/showAdminBooking toggles, always show buttons
  const [showPatientBooking, setShowPatientBooking] = useState(false);
  const [showAdminBooking, setShowAdminBooking] = useState(false);
  const [patientBookingKey, setPatientBookingKey] = useState(0);
  const [adminBookingKey, setAdminBookingKey] = useState(0);
  const bookPatientRef = useRef<HTMLDivElement | null>(null);
  const adminBookingRef = useRef<HTMLDivElement | null>(null);
  const bookingButtonsRef = useRef<HTMLDivElement | null>(null);
  const [shouldScrollToButtons, setShouldScrollToButtons] = useState(false);
  const [adminTab, setAdminTab] = useState<'booking' | 'call' | 'activity'>('booking');
  const [adminSection, setAdminSection] = useState<'booking' | 'call' | 'activity' | null>(null);
  const bookingRef = useRef<HTMLDivElement | null>(null);
  const callNextRef = useRef<HTMLDivElement | null>(null);
  const activityRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showPatientBooking && shouldScrollToButtons && bookingButtonsRef.current) {
      bookingButtonsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShouldScrollToButtons(false);
    }
  }, [showPatientBooking, shouldScrollToButtons]);

  const handleTokenIssued = (tokenData: any, fromPatientBooking = false) => {
    setTokens(prev => [...prev, tokenData]);
    setUserToken(tokenData);
    if (fromPatientBooking) {
      setShowPatientBooking(false);
      setShouldScrollToButtons(true);
    }
  };

  const handleNextNumber = () => {
    setCurrentNumber(prev => prev + 1);
  };

  const handleResetQueue = () => {
    setCurrentNumber(1);
    setTokens([]);
    setUserToken(null);
  };

  const handleBackToBooking = () => {
    setUserToken(null);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUsername === "admin" && adminPassword === "admin123") {
      setAdminLoggedIn(true);
      setAdminUsername("");
      setAdminPassword("");
      toast({ title: "Admin login successful!" });
    } else {
      toast({ title: "Invalid credentials", variant: "destructive" });
    }
  };

  const handleShowPatientBooking = () => {
    setShowPatientBooking((prev) => {
      const next = !prev;
      setTimeout(() => {
        if (next && bookPatientRef.current) {
          bookPatientRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 0);
      return next;
    });
  };

  const handleShowAdminBooking = () => {
    setShowAdminBooking((prev) => {
      const next = !prev;
      setTimeout(() => {
        if (next && adminBookingRef.current) {
          adminBookingRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 0);
      return next;
    });
  };

  const handleAdminSection = (section: 'booking' | 'call' | 'activity') => {
    setAdminSection(section);
    setTimeout(() => {
      if (section === 'booking' && bookingRef.current) {
        bookingRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (section === 'call' && callNextRef.current) {
        callNextRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (section === 'activity' && activityRef.current) {
        activityRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">ClinicQueue</h1>
                <p className="text-sm text-muted-foreground">Smart Token Management</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <div className="w-2 h-2 bg-success rounded-full mr-2"></div>
              Online
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Always show Queue Status at the top */}
        <QueueDisplay 
          currentNumber={currentNumber}
          queueLength={tokens.length}
          recentTokens={tokens}
        />

        {/* Booking Buttons */}
        <div className="flex flex-col gap-4 justify-center mt-8 max-w-xs mx-auto" ref={bookingButtonsRef}>
          <Button
            variant="medical"
            className="flex-1"
            onClick={handleShowPatientBooking}
          >
            Patient Booking
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleShowAdminBooking}
          >
            Admin Booking
          </Button>
        </div>

        {/* Book Patient Section */}
        {showPatientBooking && (
          <section id="book-patient" className="scroll-mt-24" ref={bookPatientRef}>
            <TokenBooking
              key={patientBookingKey}
              onTokenIssued={(tokenData) => {
                handleTokenIssued(tokenData, true);
                setPatientBookingKey((k) => k + 1); // reset form
              }}
              currentNumber={currentNumber}
              queueLength={tokens.length}
            />
          </section>
        )}

        {/* Admin Booking Section */}
        {showAdminBooking && (
          <section id="admin-booking" className="scroll-mt-24" ref={adminBookingRef}>
            {!adminLoggedIn ? (
              <form onSubmit={handleAdminLogin} className="max-w-md mx-auto space-y-4 p-6 bg-card rounded-lg border">
                <div>
                  <label className="block mb-1 font-medium">Username</label>
                  <Input
                    type="text"
                    value={adminUsername}
                    onChange={e => setAdminUsername(e.target.value)}
                    placeholder="Enter admin username"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Password</label>
                  <Input
                    type="password"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" variant="medical">Login as Admin</Button>
              </form>
            ) : (
              <div className="flex flex-col gap-8 max-w-xl mx-auto">
                {/* Admin Section Buttons */}
                <div className="flex flex-col gap-4 mb-8">
                  <Button
                    variant={adminSection === 'booking' ? 'medical' : 'outline'}
                    className="w-full text-lg py-6"
                    onClick={() => handleAdminSection('booking')}
                  >
                    Booking Patient
                  </Button>
                  <Button
                    variant={adminSection === 'call' ? 'medical' : 'outline'}
                    className="w-full text-lg py-6"
                    onClick={() => handleAdminSection('call')}
                  >
                    Call Next Patient
                  </Button>
                  <Button
                    variant={adminSection === 'activity' ? 'medical' : 'outline'}
                    className="w-full text-lg py-6"
                    onClick={() => handleAdminSection('activity')}
                  >
                    Patient Activity
                  </Button>
                </div>
                {/* Admin Section Content */}
                {adminSection === 'booking' && (
                  <div ref={bookingRef}>
                    <TokenBooking
                      key={adminBookingKey}
                      onTokenIssued={(tokenData) => {
                        handleTokenIssued(tokenData);
                        setAdminBookingKey((k) => k + 1); // reset form
                      }}
                      currentNumber={currentNumber}
                      queueLength={tokens.length}
                    />
                  </div>
                )}
                {adminSection === 'call' && (
                  <div ref={callNextRef} className="bg-card rounded-lg border p-6 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold text-primary mb-2">{currentNumber - 1}</div>
                    <div className="text-sm text-muted-foreground mb-4">Current Number</div>
                    <Button 
                      onClick={handleNextNumber}
                      variant="medical"
                      size="lg"
                      className="w-full mb-2"
                      disabled={tokens.filter(token => token.tokenNumber >= currentNumber).length === 0}
                    >
                      Call Next Patient
                    </Button>
                    <Button 
                      onClick={handleResetQueue}
                      variant="outline"
                      size="lg"
                      className="w-full"
                    >
                      Reset Queue
                    </Button>
                  </div>
                )}
                {adminSection === 'activity' && (
                  <div ref={activityRef} className="bg-card rounded-lg border p-6 flex flex-col">
                    <div className="font-semibold text-lg mb-4">Patient Activity</div>
                    {/* Only show visited patients */}
                    {tokens.filter(token => token.tokenNumber < currentNumber).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground flex-1 flex items-center justify-center">
                        No patients have visited yet
                      </div>
                    ) : (
                      <div className="space-y-3 overflow-y-auto flex-1">
                        {tokens.filter(token => token.tokenNumber < currentNumber).map((token) => (
                          <div 
                            key={token.id} 
                            className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 border-border"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold bg-primary/10 text-primary">#{token.tokenNumber}</div>
                              <div>
                                <div className="font-medium">{token.name}</div>
                                <div className="text-sm text-muted-foreground">{token.department}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="inline-block bg-accent text-white text-xs px-2 py-1 rounded">Visited</span>
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(token.bookedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default Index;
