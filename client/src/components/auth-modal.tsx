import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/user-context";
import { authAPI } from "@/lib/api";
import { Mail, ArrowRight, Lock, CheckCircle2, Loader2 } from "lucide-react";

export default function AuthModal() {
  const { showLoginModal, setShowLoginModal } = useStore();
  const { login } = useUser();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Email required", description: "Please enter your email address", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    try {
      await authAPI.sendCode(email);
      setStep("code");
      toast({ title: "Code sent!", description: "Check your email for the login code (Hint: 1234)" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to send code. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    try {
      await login(email, code);
      toast({ title: "Welcome back!", description: "You are now logged in." });
      setShowLoginModal(false);
      // Reset state after close
      setTimeout(() => {
        setStep("email");
        setEmail("");
        setCode("");
      }, 500);
    } catch (error) {
      toast({ title: "Invalid code", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <div>
            <DialogTitle className="text-2xl font-bold font-heading">Don't lose your progress</DialogTitle>
            <DialogDescription className="mt-2">
              Log in to save your progress, track your stats, and take the AI Test.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="py-4">
          {step === "email" ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <Button type="submit" className="w-full font-bold cursor-pointer" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Login Code <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
               <div className="text-center mb-4">
                 <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200 mb-2">
                   <CheckCircle2 className="w-3 h-3 mr-1" /> Code sent to {email}
                 </div>
               </div>
              <div className="space-y-2">
                <Label htmlFor="code">Enter Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="1234"
                  className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                  maxLength={4}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-center text-muted-foreground">Use code <b>1234</b> for this demo</p>
              </div>
              <Button type="submit" className="w-full font-bold cursor-pointer" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Login"
                )}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full text-xs text-muted-foreground"
                onClick={() => setStep("email")}
              >
                Back to email
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
