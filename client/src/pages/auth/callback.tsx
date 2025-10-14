import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";

export default function AuthCallback() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState("Processing...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (import.meta.env.DEV) {
          console.log("Auth callback - session result:", {
            hasSession: !!sessionData?.session,
            error: sessionError?.message,
          });
        }

        if (sessionError || !sessionData?.session) {
          throw new Error(sessionError?.message || "No session found");
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (import.meta.env.DEV) {
          console.log("Auth callback - user data:", {
            userId: userData?.user?.id,
            email: userData?.user?.email,
            error: userError?.message,
          });
        }

        if (userError || !userData?.user) {
          throw new Error(userError?.message || "No user found");
        }

        setStatus("Checking profile...");

        const profileResponse = await apiFetch("/api/user/profile");

        if (import.meta.env.DEV) {
          console.log("Auth callback - profile check:", {
            status: profileResponse.status,
            ok: profileResponse.ok,
          });
        }

        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          
          if (import.meta.env.DEV) {
            console.log("Auth callback - profile loaded:", {
              username: profile.username,
              coins: profile.coins,
            });
          }

          toast({
            title: "Welcome back!",
            description: `Signed in successfully`,
          });

          navigate("/");
        } else {
          const errorBody = await profileResponse.text();
          
          if (import.meta.env.DEV) {
            console.error("Auth callback - profile fetch failed:", {
              status: profileResponse.status,
              body: errorBody,
            });
          }

          throw new Error(`Profile fetch failed: ${profileResponse.status}`);
        }
      } catch (error: any) {
        console.error("Auth callback error:", error);
        
        toast({
          title: "Sign-in failed",
          description: error.message || "Could not complete sign-in",
          variant: "destructive",
        });

        navigate("/login");
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-lg">{status}</p>
      </div>
    </div>
  );
}
