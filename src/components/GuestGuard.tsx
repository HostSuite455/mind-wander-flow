import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
    const checkGuestSession = async () => {
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

        // Server-side validation: verify the guest code is still valid
        const { data, error } = await supabase
          .from('guest_codes')
          .select('code, check_in, check_out')
          .eq('code', guestSession.code)
          .eq('property_id', guestSession.property_id)
          .single();

        if (error || !data) {
          localStorage.removeItem('guest_session');
          setIsValidGuest(false);
          setLoading(false);
          return;
        }

        // Verify current time is within the valid window
        const checkIn = new Date(data.check_in);
        const checkOut = new Date(data.check_out);
        const validFrom = new Date(checkIn.getTime() - 24 * 60 * 60 * 1000); // 1 day before check-in
        const validUntil = new Date(checkOut.getTime() + 24 * 60 * 60 * 1000); // 1 day after check-out

        if (now < validFrom || now > validUntil) {
          localStorage.removeItem('guest_session');
          setIsValidGuest(false);
          setLoading(false);
          return;
        }

        setIsValidGuest(true);
        setLoading(false);
      } catch (error) {
        console.error('Guest session validation error:', error);
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