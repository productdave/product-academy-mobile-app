import Layout from "@/components/layout";
import { useState, useRef, useEffect } from "react";
import { Lock, Loader2, AlertCircle, Zap, Package, UserCheck, HelpCircle, ArrowLeft } from "lucide-react";
import { useUser } from "@/lib/user-context";
import { useStore } from "@/lib/mock-data";
import { ChatKit, useChatKit } from "@openai/chatkit-react";

type AssessmentType = "quick_quiz" | "product_teardown" | "interview_prep" | "general_question";

const assessmentOptions: { type: AssessmentType; label: string; description: string; icon: React.ElementType }[] = [
  { 
    type: "quick_quiz", 
    label: "Quick Quiz", 
    description: "Fast 5-question assessment",
    icon: Zap 
  },
  { 
    type: "product_teardown", 
    label: "5-Min Product Teardown", 
    description: "Comprehensive product analysis",
    icon: Package 
  },
  { 
    type: "interview_prep", 
    label: "Interview Prep", 
    description: "Mock PM interview practice",
    icon: UserCheck 
  },
  { 
    type: "general_question", 
    label: "General Question", 
    description: "Review general PM concepts",
    icon: HelpCircle 
  },
];

function ChatKitWrapper({ userId, assessmentType, onBack }: { userId: string; assessmentType: AssessmentType; onBack: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const hasInitialized = useRef(false);
  const hasSentInitialMessage = useRef(false);
  
  const getInitialMessage = () => {
    switch (assessmentType) {
      case "quick_quiz":
        return "I'd like to take a Quick Quiz to test my PM knowledge. Please start the 5-question assessment.";
      case "product_teardown":
        return "I'd like to do a 5-Minute Product Teardown exercise. Please guide me through analyzing a product.";
      case "interview_prep":
        return "I'd like to practice for PM interviews. Please start a mock interview session with me.";
      case "general_question":
        return "I have a general question about Product Management. I'm ready to chat.";
      default:
        return "Hello! I'm ready to start.";
    }
  };

  const { control, sendUserMessage } = useChatKit({
    api: {
      async getClientSecret(existing) {
        if (existing) {
          return existing;
        }

        try {
          const res = await fetch('/api/chatkit/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userId,
              assessmentType: assessmentType,
            }),
          });
          
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to create chat session');
          }
          
          const { client_secret } = await res.json();
          setIsReady(true);
          return client_secret;
        } catch (err) {
          console.error('ChatKit session error:', err);
          setError(err instanceof Error ? err.message : 'Failed to initialize chat');
          throw err;
        }
      },
    },
  });

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      const timer = setTimeout(() => {
        if (!isReady && !error) {
          setIsReady(true);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isReady, error]);
  
  useEffect(() => {
    if (isReady && !hasSentInitialMessage.current && sendUserMessage) {
      hasSentInitialMessage.current = true;
      const sendInitial = async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
          await sendUserMessage({ text: getInitialMessage() });
        } catch (err) {
          console.error('Failed to send initial message:', err);
        }
      };
      sendInitial();
    }
  }, [isReady, sendUserMessage, assessmentType]);

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-heading font-bold mb-2">Connection Error</h2>
          <p className="text-muted-foreground text-sm max-w-xs mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentOption = assessmentOptions.find(o => o.type === assessmentType);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <div className="px-4 py-2 bg-slate-100 border-b border-border/50 flex items-center gap-2 shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
          data-testid="button-back-to-selection"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <span className="text-sm font-medium text-slate-700">{currentOption?.label}</span>
      </div>
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Connecting to AI...</p>
          </div>
        </div>
      )}
      <div className="flex-1 w-full overflow-hidden">
        <ChatKit 
          control={control} 
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}

function AssessmentSelector({ onSelect }: { onSelect: (type: AssessmentType) => void }) {
  return (
    <div className="flex-1 flex flex-col p-6 overflow-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-heading font-bold mb-2">Choose Your Assessment</h2>
        <p className="text-muted-foreground text-sm">
          Select the type of PM assessment you'd like to take
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-3 max-w-md mx-auto w-full">
        {assessmentOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.type}
              onClick={() => onSelect(option.type)}
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-border/50 hover:border-primary/50 hover:shadow-md transition-all text-left group"
              data-testid={`button-assessment-${option.type}`}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-pink-100 flex items-center justify-center group-hover:from-primary/20 group-hover:to-pink-200 transition-colors">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-800">{option.label}</h3>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AIChatPage() {
  const { user } = useUser();
  const { setShowLoginModal } = useStore();
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentType | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const flow = params.get('flow');
    if (flow && ['quick_quiz', 'product_teardown', 'interview_prep', 'general_question'].includes(flow)) {
      return flow as AssessmentType;
    }
    return null;
  });

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleBack = () => {
    setSelectedAssessment(null);
    window.history.replaceState({}, '', '/ai-chat');
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100dvh-4rem)] bg-slate-50">
        <div className="pt-6 sm:pt-10 px-4 sm:px-6 pb-3 sm:pb-4 border-b border-border/50 bg-white sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-heading font-bold" data-testid="text-ai-coach-title">AI Coach</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Powered by OpenAI Agent</p>
              </div>
            </div>
          </div>
        </div>

        {!user ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-heading font-bold mb-2">Login Required</h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                Log in to access the AI Coach and get personalized Product Management guidance.
              </p>
            </div>
            <button
              onClick={handleLoginClick}
              className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              data-testid="button-login-ai-test"
            >
              Log in to Start
            </button>
          </div>
        ) : selectedAssessment ? (
          <ChatKitWrapper userId={user.id} assessmentType={selectedAssessment} onBack={handleBack} />
        ) : (
          <AssessmentSelector onSelect={setSelectedAssessment} />
        )}
      </div>
    </Layout>
  );
}
