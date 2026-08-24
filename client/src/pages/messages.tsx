import Layout from "@/components/layout";
import { messagesAPI, usersAPI } from "@/lib/api";
import { useUser } from "@/lib/user-context";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lock, MessageSquare, PlusCircle, CheckCircle2, FileText, HelpCircle, TrendingUp, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Message } from "@shared/schema";

interface Partner {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "admin" | "student";
}

interface Topic {
  id: string;
  subject: string;
  status: "open" | "resolved";
  participantId: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  messages: Message[];
}

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function MessagesPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showUnlockView, setShowUnlockView] = useState(false);
  const [isNewTopicOpen, setIsNewTopicOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");

  // Fetch messages
  const { data, isLoading } = useQuery<{ messages: Message[]; partners: Partner[] }>({
    queryKey: ["messages"],
    queryFn: messagesAPI.getAll,
    enabled: !!user,
  });


  // Send message mutation for new topics
  const sendMessageMutation = useMutation({
    mutationFn: ({ recipientId, text, subject }: { recipientId: string; text: string; subject?: string }) =>
      messagesAPI.send(recipientId, text, subject),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setIsNewTopicOpen(false);
      setNewSubject("");
      setNewMessage("");
      toast({ title: "Topic Created", description: "Product Dave will respond soon." });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create topic", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Group messages into topics
  const topics = useMemo<Topic[]>(() => {
    if (!data?.messages || !data?.partners || !user) return [];

    const { messages, partners } = data;
    
    // Find admin user (Product Dave)
    const adminUserInfo = partners.find(p => p.role === "admin") || {
      id: "admin1",
      name: "Product Dave",
      email: "david@davidwang.com.au",
      avatar: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2159999900/settings_images/246750-d158-4c37-0c6f-1a11e5262063_IMG_4971.JPG",
      role: "admin" as const,
    };

    // Group messages by topic (topicId or message id for root messages)
    const topicMap = new Map<string, Message[]>();
    
    messages.forEach(msg => {
      // Use topicId if it exists, otherwise use the message id (it's a root topic message)
      const topicKey = (msg as any).topicId || msg.id;
      
      if (!topicMap.has(topicKey)) {
        topicMap.set(topicKey, []);
      }
      topicMap.get(topicKey)!.push(msg);
    });

    // Convert to topic objects
    const topicList: Topic[] = [];
    
    topicMap.forEach((topicMessages, topicId) => {
      // Sort messages by creation time
      const sortedMessages = topicMessages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      // Get the first message (topic root) for subject and status
      const rootMsg = sortedMessages[0];
      const lastMsg = sortedMessages[sortedMessages.length - 1];
      
      // Determine the partner (other person in the conversation)
      const partnerId = rootMsg.senderId === user.id ? rootMsg.recipientId : rootMsg.senderId;
      const partner = partners.find(p => p.id === partnerId) || adminUserInfo;
      
      // Calculate unread count
      const unreadCount = topicMessages.filter(
        msg => msg.recipientId === user.id && !msg.isRead
      ).length;
      
      topicList.push({
        id: topicId,
        subject: (rootMsg as any).subject || "General Inquiry",
        status: ((rootMsg as any).status || "open") as "open" | "resolved",
        participantId: partnerId,
        participantName: partner.name,
        participantAvatar: partner.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name)}&background=random`,
        lastMessage: lastMsg.text,
        lastMessageTime: new Date(lastMsg.createdAt),
        unreadCount,
        messages: sortedMessages,
      });
    });

    // Sort topics by last message time (most recent first)
    return topicList.sort((a, b) => 
      b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
    );
  }, [data, user]);

  // Fetch admin user for creating new conversation
  const { data: adminData } = useQuery<Partner>({
    queryKey: ["admin-user"],
    queryFn: usersAPI.getAdmin,
    enabled: !!user,
  });

  // Find admin user - prefer from partners if available, fallback to fetched admin
  const adminUser = useMemo(() => {
    const fromPartners = data?.partners?.find(p => p.role === "admin");
    return fromPartners || adminData || null;
  }, [data?.partners, adminData]);

  const handleCreateTopic = () => {
    if (adminUser) {
      setIsNewTopicOpen(true);
    }
  };

  const handleSubmitTopic = () => {
    if (!adminUser || !newSubject.trim() || !newMessage.trim()) return;
    sendMessageMutation.mutate({
      recipientId: adminUser.id,
      text: newMessage.trim(),
      subject: newSubject.trim(),
    });
  };

  const handleGuestInteraction = () => {
    setShowUnlockView(true);
  };

  if (!user && showUnlockView) {
    return (
      <Layout>
        <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-slate-50 items-center justify-center px-6 py-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center text-white shadow-xl shadow-primary/20 mb-6 relative shrink-0">
            <MessageSquare className="w-10 h-10" />
            <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-full shadow-md">
              <Lock className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          
          <h1 className="text-2xl font-heading font-bold text-center mb-2">Unlock Private Help</h1>
          <p className="text-muted-foreground text-center max-w-sm mb-8 leading-relaxed text-sm">
            Log in to get direct help, personalized feedback, and 1-on-1 mentoring from Product Dave.
          </p>

          <div className="grid grid-cols-1 gap-3 w-full max-w-sm mb-8">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <FileText className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Resume & Portfolio Reviews</h3>
                <p className="text-xs text-muted-foreground">"Can you review my case study?"</p>
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl shadow-sm border border-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <HelpCircle className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Specific Course Q&A</h3>
                <p className="text-xs text-muted-foreground">"I'm stuck on the Week 3 assignment."</p>
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl shadow-sm border border-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Career Strategy Advice</h3>
                <p className="text-xs text-muted-foreground">"How do I transition to Senior PM?"</p>
              </div>
            </div>
          </div>

          <Button 
            className="w-full max-w-sm h-12 text-base font-bold rounded-full shadow-lg shadow-primary/20"
            onClick={() => window.location.href = "/"}
            data-testid="button-login"
          >
            Log In to Unlock
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
             Don't have an account? <span className="underline cursor-pointer hover:text-foreground" onClick={() => window.location.href = "/"}>Join now</span>
          </p>
          <button 
            onClick={() => setShowUnlockView(false)}
            className="mt-4 text-xs text-muted-foreground hover:text-foreground underline"
            data-testid="button-go-back"
          >
            Go back
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pt-8 px-6 pb-24 min-h-screen">
        <div className="mb-8">
          <h1 className="text-2xl font-heading font-bold mb-2">DM Support</h1>
          <p className="text-muted-foreground text-sm">
            Direct 1-on-1 coaching and feedback from Product Dave.
          </p>
        </div>
        
        <div className="space-y-6">
          {/* Value Prop Banner - Only show if logged in */}
          {user && (
            <div className="bg-gradient-to-r from-secondary to-secondary/30 rounded-2xl p-5 border border-border/50">
               <h3 className="font-bold text-foreground mb-1 flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4 text-green-600" />
                 Priority Support Active
               </h3>
               <p className="text-sm text-muted-foreground">
                 Your messages are prioritized. Expect a response within 24-48 hours during business days.
               </p>
            </div>
          )}

          {/* Threads List */}
          <div className="space-y-3">
            <div className="flex justify-between items-end px-1">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Conversations</h2>
                
                {user ? (
                  adminUser ? (
                    <button 
                      onClick={handleCreateTopic} 
                      className="text-primary text-xs font-bold flex items-center hover:underline" 
                      data-testid="button-new-topic"
                    >
                      <PlusCircle className="w-3 h-3 mr-1" /> New Topic
                    </button>
                  ) : (
                    <button className="text-muted-foreground text-xs font-bold flex items-center cursor-not-allowed" disabled data-testid="button-new-topic-loading">
                      <PlusCircle className="w-3 h-3 mr-1" /> New Topic
                    </button>
                  )
                ) : (
                  <button onClick={handleGuestInteraction} className="text-primary text-xs font-bold flex items-center hover:underline" data-testid="button-new-topic-guest">
                    <PlusCircle className="w-3 h-3 mr-1" /> New Topic
                  </button>
                )}
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-card rounded-2xl border border-border">
                <Spinner className="w-8 h-8 mb-4" />
                <p className="text-sm text-muted-foreground">Loading topics...</p>
              </div>
            ) : user && topics.length > 0 ? (
              topics.map((topic) => (
                <Link key={topic.id} href={`/messages/${topic.id}`}>
                  <div className="group flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer" data-testid={`topic-${topic.id}`}>
                    <div className="relative shrink-0">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        topic.status === "resolved" ? "bg-green-100" : "bg-primary/10"
                      )}>
                        {topic.status === "resolved" ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : (
                          <Circle className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      {topic.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-background animate-pulse" data-testid={`unread-badge-${topic.id}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-bold text-foreground truncate text-base" data-testid={`topic-subject-${topic.id}`}>{topic.subject}</h3>
                        <span className="text-xs text-muted-foreground font-medium shrink-0 ml-2" data-testid={`timestamp-${topic.id}`}>
                          {formatRelativeTime(topic.lastMessageTime)}
                        </span>
                      </div>
                      <p className={cn(
                        "text-sm truncate leading-relaxed",
                        topic.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                      )} data-testid={`last-message-${topic.id}`}>
                        {topic.lastMessage}
                      </p>
                      <span className={cn(
                        "text-xs font-medium mt-1 inline-block",
                        topic.status === "resolved" ? "text-green-600" : "text-amber-600"
                      )}>
                        {topic.status === "resolved" ? "Resolved" : "Open"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-card rounded-2xl border border-dashed border-border">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <MessageSquare className="w-8 h-8 text-primary" />
                  </div>
                 <h3 className="text-lg font-bold font-heading mb-2">Start your first topic</h3>
                 <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                   Have a question about the course, need career advice, or want a portfolio review? Create a new topic to get help.
                 </p>
                 <Button 
                   onClick={user ? handleCreateTopic : handleGuestInteraction} 
                   className="rounded-full font-bold px-8 shadow-lg shadow-primary/20"
                   data-testid="button-new-topic"
                   disabled={!!user && !adminUser}
                 >
                   <PlusCircle className="w-4 h-4 mr-2" />
                   New Topic
                 </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isNewTopicOpen} onOpenChange={setIsNewTopicOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Topic</DialogTitle>
            <DialogDescription>
              Create a new support topic. Product Dave will respond as soon as possible.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="What do you need help with?"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                data-testid="input-topic-subject"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Describe your question or issue..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={4}
                data-testid="input-topic-message"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewTopicOpen(false)}
              data-testid="button-cancel-topic"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitTopic}
              disabled={!newSubject.trim() || !newMessage.trim() || sendMessageMutation.isPending}
              data-testid="button-submit-topic"
            >
              {sendMessageMutation.isPending ? "Creating..." : "Create Topic"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
