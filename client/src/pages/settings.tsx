import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { currentUser, useStore } from "@/lib/mock-data";
import { ArrowLeft, LogOut, Trash2, Mail, CheckCircle2, User, Camera, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const { toast } = useToast();
  const { updateAvatar, logout } = useStore();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("product.dave@example.com"); // Mock initial email
  const [newEmail, setNewEmail] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  
  // Profile Name State
  const [firstName, setFirstName] = useState(currentUser.name.split(" ")[0]);
  const [lastName, setLastName] = useState(currentUser.name.split(" ")[1] || "");
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profile Updated",
      description: "Your personal information has been saved successfully.",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatar(result);
        updateAvatar(result); // Update in store/mock data
        toast({
          title: "Profile Picture Updated",
          description: "Looking good! Your new avatar has been saved.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmailChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    
    // Simulate API call
    setTimeout(() => {
      setIsEmailSent(true);
      toast({
        title: "Confirmation Email Sent",
        description: `We've sent a confirmation link to ${newEmail}. Please check your inbox.`,
      });
      setNewEmail("");
    }, 1000);
  };

  const handleLogout = () => {
    // Simulate logout
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    // In a real app, this would clear auth state
    setLocation("/");
  };

  const handleDeleteAccount = () => {
    // Simulate account deletion
    toast({
      variant: "destructive",
      title: "Account Deleted",
      description: "Your account and data have been permanently removed.",
    });
    setLocation("/");
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 pb-20">
        {/* Header */}
        <div className="bg-white border-b border-border px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
          <Link href="/">
            <Button variant="ghost" size="icon" className="-ml-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-heading font-bold">Profile Settings</h1>
        </div>

        <div className="p-6 max-w-2xl mx-auto space-y-8">
          
          {/* Profile Info */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-secondary overflow-hidden border-2 border-white shadow-sm cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <img src={avatar} alt="Profile" className="w-full h-full object-cover transition-opacity group-hover:opacity-75" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:text-primary-foreground"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-3 h-3" />
              </Button>
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading">{firstName} {lastName}</h2>
              <p className="text-sm text-muted-foreground capitalize">{currentUser.role}</p>
            </div>
          </div>

          <Separator />

          {/* Personal Information */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <User className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">Personal Information</h3>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </section>

          <Separator />

          {/* Email Settings */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">Email Address</h3>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
              <div className="mb-4">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Current Email</Label>
                <div className="font-medium text-foreground">{email}</div>
              </div>
              
              {isEmailSent ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3 items-start animate-in fade-in zoom-in-95">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-green-800 text-sm">Check your inbox</h4>
                    <p className="text-sm text-green-700 mt-1">
                      We've sent a confirmation link to confirm your new email address.
                    </p>
                    <Button 
                      variant="link" 
                      className="text-green-800 p-0 h-auto text-xs mt-2 underline"
                      onClick={() => setIsEmailSent(false)}
                    >
                      Use a different email
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleEmailChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-email">New Email Address</Label>
                    <Input 
                      id="new-email" 
                      type="email" 
                      placeholder="Enter new email..." 
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={!newEmail}>
                    Update Email
                  </Button>
                </form>
              )}
            </div>
          </section>

          <Separator />

          {/* Account Actions */}
          <section className="space-y-4">
             <h3 className="font-bold text-lg">Account Actions</h3>
             
             <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
               <div 
                 className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors border-b border-border"
                 onClick={handleLogout}
               >
                 <div className="flex items-center gap-3">
                   <LogOut className="w-5 h-5 text-slate-500" />
                   <div>
                     <div className="font-medium">Log Out</div>
                     <div className="text-xs text-muted-foreground">Sign out of your account on this device</div>
                   </div>
                 </div>
               </div>

               <div className="p-4 flex items-center justify-between hover:bg-red-50 cursor-pointer transition-colors">
                 <AlertDialog>
                   <AlertDialogTrigger asChild>
                     <div className="flex items-center gap-3 w-full">
                       <Trash2 className="w-5 h-5 text-red-500" />
                       <div>
                         <div className="font-medium text-red-600">Delete Account</div>
                         <div className="text-xs text-red-400">Permanently delete your profile and data</div>
                       </div>
                     </div>
                   </AlertDialogTrigger>
                   <AlertDialogContent>
                     <AlertDialogHeader>
                       <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                       <AlertDialogDescription>
                         This action cannot be undone. This will permanently delete your account
                         and remove your data from our servers.
                       </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                       <AlertDialogCancel>Cancel</AlertDialogCancel>
                       <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                         Delete Account
                       </AlertDialogAction>
                     </AlertDialogFooter>
                   </AlertDialogContent>
                 </AlertDialog>
               </div>
             </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
