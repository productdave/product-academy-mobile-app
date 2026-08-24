import { useRoute, Link } from "wouter";
import { useUser } from "@/lib/user-context";
import { messagesAPI } from "@/lib/api";
import { ChevronLeft, Send, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import type { Message } from "@shared/schema";

interface TopicData {
  messages: Message[];
  partner: {
    id: string;
    name: string;
    avatar?: string;
    role: "admin" | "student";
  };
  topic: {
    id: string;
    subject: string;
    status: "open" | "resolved";
  };
}

export default function MessageDetailPage() {
  const [match, params] = useRoute("/messages/:id");
  const topicId = params?.id;
  const { user } = useUser();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch topic with messages
  const { data: topicData, isLoading } = useQuery<TopicData>({
    queryKey: ["topic", topicId],
    queryFn: () => messagesAPI.getConversation(topicId!),
    enabled: !!topicId,
  });

  // Send reply mutation
  const sendMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          recipientId: topicData?.partner.id,
          text: messageText,
          topicId: topicId,
          isRead: false,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to send message");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topic", topicId] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setText("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle status mutation
  const statusMutation = useMutation({
    mutationFn: (newStatus: "open" | "resolved") => 
      messagesAPI.updateStatus(topicId!, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topic", topicId] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      toast({
        title: topicData?.topic.status === "open" ? "Topic Resolved" : "Topic Reopened",
        description: topicData?.topic.status === "open" 
          ? "This topic has been marked as resolved." 
          : "This topic has been reopened.",
      });
    },
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [topicData?.messages]);

  const handleSend = () => {
    if (!text.trim() || !topicId) return;
    sendMutation.mutate(text);
  };

  const handleToggleStatus = () => {
    if (!topicData) return;
    const newStatus = topicData.topic.status === "open" ? "resolved" : "open";
    statusMutation.mutate(newStatus);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!topicData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Topic not found</h2>
          <Link href="/messages">
            <Button variant="outline">Back to Topics</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { partner, topic, messages } = topicData;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="pt-8 px-4 pb-3 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Link href="/messages">
              <Button variant="ghost" size="icon" className="-ml-2" data-testid="button-back">
                <ChevronLeft className="w-6 h-6" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9">
                <AvatarImage src={partner?.avatar} />
                <AvatarFallback>{partner?.name?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-sm leading-none" data-testid="text-partner-name">
                  {partner?.name || "Unknown"}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {partner?.role === "admin" ? "Instructor" : "Student"}
                </span>
              </div>
            </div>
          </div>
          <Button 
            variant={topic.status === "open" ? "default" : "outline"}
            size="sm"
            onClick={handleToggleStatus}
            disabled={statusMutation.isPending}
            data-testid="button-toggle-status"
            className="gap-1.5"
          >
            {topic.status === "open" ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Mark Resolved
              </>
            ) : (
              <>
                <Circle className="w-4 h-4" />
                Reopen
              </>
            )}
          </Button>
        </div>
        <div className="ml-11">
          <h3 className="font-bold text-base" data-testid="text-topic-subject">{topic.subject}</h3>
          <span className={cn(
            "text-xs font-medium",
            topic.status === "resolved" ? "text-green-600" : "text-amber-600"
          )}>
            {topic.status === "resolved" ? "Resolved" : "Open"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">No messages yet.</p>
          </div>
        ) : (
          messages.map((msg: Message) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div 
                key={msg.id} 
                className={cn("flex", isMe ? "justify-end" : "justify-start")}
                data-testid={`message-${msg.id}`}
              >
                <div 
                  className={cn(
                    "max-w-[75%] px-4 py-3 rounded-2xl text-sm shadow-sm",
                    isMe 
                      ? "bg-primary text-primary-foreground rounded-tr-sm" 
                      : "bg-secondary text-secondary-foreground rounded-tl-sm"
                  )}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-background border-t border-border pb-safe-bottom">
        <form 
          className="flex gap-2"
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        >
          <Input 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message..." 
            className="rounded-full bg-secondary/50 border-none h-12 px-5 focus-visible:ring-1"
            disabled={sendMutation.isPending}
            data-testid="input-message"
          />
          <Button 
            type="submit" 
            size="icon" 
            className="rounded-full h-12 w-12 shrink-0"
            disabled={sendMutation.isPending || !text.trim()}
            data-testid="button-send"
          >
            {sendMutation.isPending ? (
              <Spinner className="w-5 h-5" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
