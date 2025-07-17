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
import { useNavigate } from "react-router-dom";
import { useQueue } from "../QueueContext";

const Index = () => {
  const navigate = useNavigate();
  const { currentNumber, tokens } = useQueue();
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
    // setTokens(prev => [...prev, tokenData]); // This line is removed as per the edit hint
    setUserToken(tokenData);
    if (fromPatientBooking) {
      setShowPatientBooking(false);
      setShouldScrollToButtons(true);
    }
  };

  const handleNextNumber = () => {
    // setCurrentNumber(prev => prev + 1); // This line is removed as per the edit hint
  };

  const handleResetQueue = () => {
    // setCurrentNumber(1); // This line is removed as per the edit hint
    // setTokens([]); // This line is removed as per the edit hint
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
    <div
      className="min-h-screen"
      style={{
        backgroundImage: "url('/stethoscope-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
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
        <QueueDisplay />

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
            onClick={() => {
              if (localStorage.getItem('adminLoggedIn') === 'true') {
                navigate('/admin/panel');
              } else {
                navigate('/admin');
              }
            }}
          >
            Admin Booking
          </Button>
        </div>

        {/* Book Patient Section */}
        {showPatientBooking && (
          <section id="book-patient" className="scroll-mt-24" ref={bookPatientRef}>
            <TokenBooking onBooked={() => setShowPatientBooking(false)} />
          </section>
        )}
      </div>
    </div>
  );
};

export default Index;
