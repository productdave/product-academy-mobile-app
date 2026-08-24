import { Link, useLocation } from "wouter";
import { Home, Bot, FolderOpen, Calendar, Lock, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/mock-data";
import { useUser } from "@/lib/user-context";
import AuthModal from "@/components/auth-modal";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { setShowLoginModal } = useStore();

  const navItems = [
    { icon: Home, label: "Home", href: "/", locked: false },
    { icon: Bot, label: "AI Coach", href: "/ai-chat", locked: false },
    { icon: FolderOpen, label: "Resources", href: "/resources", locked: false },
    { icon: CalendarDays, label: "Events", href: "/events", locked: false },
    { icon: Calendar, label: "Book", href: "/book", locked: false },
  ];

  const handleNavClick = (e: React.MouseEvent, item: typeof navItems[0]) => {
    if (item.locked) {
      e.preventDefault();
      setShowLoginModal(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans text-foreground">
      <AuthModal />
      <main className="flex-1 pb-24">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-black/90 backdrop-blur-lg border-t border-border z-50 pb-safe-bottom">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={(e) => handleNavClick(e, item)}>
                <div className={cn(
                  "flex flex-col items-center justify-center w-16 h-full space-y-1 transition-all duration-200 cursor-pointer relative",
                  isActive ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground"
                )}>
                  <div className="relative">
                    <item.icon className={cn("w-6 h-6", isActive && "stroke-[2.5px]")} />
                    {item.locked && (
                      <div className="absolute -top-1 -right-1 bg-muted text-muted-foreground rounded-full p-[2px] border border-background">
                         <Lock className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
