import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import HomePage from "@/pages/home";
import CoursePage from "@/pages/course";
import LessonPage from "@/pages/lesson";
import MessagesPage from "@/pages/messages";
import MessageDetailPage from "@/pages/message-detail";
import AIChatPage from "@/pages/chat";
import CoursesPage from "@/pages/courses";
import ResourcesPage from "@/pages/resources";
import BookPage from "@/pages/book";
import SettingsPage from "@/pages/settings";
import AdminDashboard from "@/pages/admin/dashboard";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import EventsPage from "@/pages/events";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/courses" component={CoursesPage} />
      <Route path="/resources" component={ResourcesPage} />
      <Route path="/book" component={BookPage} />
      <Route path="/course/:id" component={CoursePage} />
      <Route path="/course/:courseId/lesson/:lessonId" component={LessonPage} />
      <Route path="/messages" component={MessagesPage} />
      <Route path="/messages/:id" component={MessageDetailPage} />
      <Route path="/ai-chat" component={AIChatPage} />
      <Route path="/events" component={EventsPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* <TooltipProvider> */}
        <Toaster />
        <Router />
      {/* </TooltipProvider> */}
    </QueryClientProvider>
  );
}

export default App;
