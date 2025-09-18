import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface GuestGuardProps {
  children: ReactNode;
}

interface GuestSession {
  code: string;
  property_id: string;
  expires_at: string;
}

const GuestGuard = ({ children }: GuestGuardProps) => {
  const [isValidGuest, setIsValidGuest] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkGuestSession = () => {
      try {
        const guestSessionData = localStorage.getItem('guest_session');
        
        if (!guestSessionData) {
          setIsValidGuest(false);
          setLoading(false);
          return;
        }

        const guestSession: GuestSession = JSON.parse(guestSessionData);
        const expiresAt = new Date(guestSession.expires_at);
        const now = new Date();

        if (now > expiresAt) {
          // Session expired
          localStorage.removeItem('guest_session');
          setIsValidGuest(false);
          setLoading(false);
          return;
        }

        setIsValidGuest(true);
        setLoading(false);
      } catch (error) {
        // Invalid session data
        localStorage.removeItem('guest_session');
        setIsValidGuest(false);
        setLoading(false);
      }
    };

    checkGuestSession();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-hostsuite-secondary mx-auto mb-4" />
          <p className="text-hostsuite-text">Verifica accesso ospite...</p>
        </div>
      </div>
    );
  }

  if (!isValidGuest) {
    return <Navigate to="/guest" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default GuestGuard;