import { useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/lib/user-context";
import { authAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ArrowRight, CheckCircle2, Mail, Eye } from "lucide-react";
import logoImage from "@assets/1_1768974373655.png";
import { Link } from "wouter";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useUser();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [authStep, setAuthStep] = useState<"email" | "code">("email");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (authStep === "email") {
        if (!email) return;
        await authAPI.sendCode(email);
        setAuthStep("code");
        toast({ title: "Code sent!", description: "Check your email for the verification code" });
      } else {
        if (!code) return;
        await login(email, code);
        toast({ title: "Welcome back!", description: "You are now logged in." });
        setLocation("/");
      }
    } catch (error) {
      toast({ 
        title: "Login failed", 
        description: error instanceof Error ? error.message : "Please try again", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCode(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="text-center mb-10">
            <img src={logoImage} alt="Product Academy" className="w-20 h-20 mx-auto mb-4 object-contain" />
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">Welcome back</h1>
            <p className="text-muted-foreground text-sm">
              Sign in to continue your Product Management journey
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100">
            <form onSubmit={handleSubmit} className="space-y-4">
              {authStep === "email" ? (
                <>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input 
                        id="email"
                        placeholder="you@example.com" 
                        className="h-12 pl-10 bg-slate-50 border-slate-200 focus:bg-white" 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isSubmitting}
                        data-testid="input-email"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 font-bold text-base shadow-lg shadow-primary/20"
                    disabled={isSubmitting || !email}
                    data-testid="button-send-code"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        Sending code...
                      </>
                    ) : (
                      <>
                        Send verification code <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center mb-4">
                    <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />
                    <span>We sent a code to <strong>{email}</strong></span>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="code" className="text-sm font-medium text-foreground">
                      Enter 4-digit code
                    </label>
                    <Input 
                      id="code"
                      placeholder="0000" 
                      className="h-14 text-center text-2xl tracking-[0.5em] font-mono bg-slate-50 border-slate-200 focus:bg-white" 
                      value={code}
                      onChange={handleCodeChange}
                      autoFocus
                      disabled={isSubmitting}
                      maxLength={4}
                      inputMode="numeric"
                      data-testid="input-code"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Demo code: 1234
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 font-bold text-base shadow-lg shadow-primary/20"
                    disabled={isSubmitting || code.length !== 4}
                    data-testid="button-verify"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        Verifying...
                      </>
                    ) : (
                      "Verify & Sign In"
                    )}
                  </Button>
                  
                  <button 
                    type="button" 
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                    onClick={() => {
                      setAuthStep("email");
                      setCode("");
                    }}
                    disabled={isSubmitting}
                  >
                    Use a different email
                  </button>
                </>
              )}
            </form>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8">
        <div className="mx-auto w-full max-w-sm">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-muted-foreground">or</span>
            </div>
          </div>
          
          <Button
            variant="outline"
            className="w-full h-12 mt-4 font-medium border-slate-200 hover:bg-slate-50"
            onClick={() => setLocation("/")}
            data-testid="button-explore"
          >
            <Eye className="w-4 h-4 mr-2" />
            Learn without signing up
          </Button>
        </div>
      </div>
    </div>
  );
}
