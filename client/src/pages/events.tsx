import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { eventsAPI } from "@/lib/api";
import { CalendarDays, MapPin, Clock, ExternalLink, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO, isValid } from "date-fns";

interface LumaEvent {
  id: string;
  name: string;
  description: string;
  start_at: string;
  end_at: string;
  cover_url: string | null;
  url: string;
  geo_address_info?: {
    city?: string;
    region?: string;
    country?: string;
    full_address?: string;
  } | null;
  timezone: string;
}

export default function Events() {
  const { data: events = [], isLoading, error } = useQuery<LumaEvent[]>({
    queryKey: ["luma-events"],
    queryFn: eventsAPI.getAll,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const formatEventDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return "";
    try {
      const date = parseISO(dateStr);
      if (!isValid(date)) return "";
      return format(date, "EEE, MMM d");
    } catch {
      return "";
    }
  };

  const formatEventTime = (dateStr: string | undefined | null) => {
    if (!dateStr) return "";
    try {
      const date = parseISO(dateStr);
      if (!isValid(date)) return "";
      return format(date, "h:mm a");
    } catch {
      return "";
    }
  };

  const formatEventDay = (dateStr: string | undefined | null) => {
    if (!dateStr) return "—";
    try {
      const date = parseISO(dateStr);
      if (!isValid(date)) return "—";
      return format(date, "d");
    } catch {
      return "—";
    }
  };

  const formatEventWeekday = (dateStr: string | undefined | null) => {
    if (!dateStr) return "";
    try {
      const date = parseISO(dateStr);
      if (!isValid(date)) return "";
      return format(date, "EEE");
    } catch {
      return "";
    }
  };

  const getLocationString = (event: LumaEvent) => {
    if (!event.geo_address_info) return "Online";
    const { city, region, country } = event.geo_address_info;
    if (city && region) return `${city}, ${region}`;
    if (city) return city;
    if (region) return region;
    if (country) return country;
    return "Online";
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background" data-testid="events-page">
        <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-background px-6 py-8">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-heading font-bold" data-testid="text-events-title">Upcoming Events</h1>
                <p className="text-sm text-muted-foreground" data-testid="text-events-subtitle">PM workshops, meetups & more</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 max-w-lg mx-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16" data-testid="status-events-loading">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading events...</p>
            </div>
          )}

          {error && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center" data-testid="status-events-error">
              <Calendar className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h3 className="font-semibold text-amber-800 mb-2" data-testid="text-error-title">Events Unavailable</h3>
              <p className="text-sm text-amber-700 mb-4" data-testid="text-error-message">
                {(error as Error).message || "Unable to load events right now. Please check back later."}
              </p>
            </div>
          )}

          {!isLoading && !error && events.length === 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center" data-testid="status-events-empty">
              <CalendarDays className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700 mb-2" data-testid="text-empty-title">No Upcoming Events</h3>
              <p className="text-sm text-slate-600" data-testid="text-empty-message">
                Check back soon for new PM events and workshops!
              </p>
            </div>
          )}

          {!isLoading && !error && events.length > 0 && (
            <div className="space-y-4" data-testid="list-events">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  data-testid={`event-card-${event.id}`}
                >
                  {event.cover_url && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={event.cover_url}
                        alt={event.name}
                        className="w-full h-full object-cover"
                        data-testid={`img-event-cover-${event.id}`}
                      />
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-primary/10 rounded-xl p-2 text-center min-w-[56px]" data-testid={`event-date-badge-${event.id}`}>
                        <div className="text-xs font-medium text-primary uppercase">
                          {formatEventWeekday(event.start_at)}
                        </div>
                        <div className="text-xl font-bold text-primary">
                          {formatEventDay(event.start_at)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base line-clamp-2 mb-1" data-testid={`text-event-name-${event.id}`}>
                          {event.name}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1" data-testid={`text-event-time-${event.id}`}>
                            <Clock className="w-3 h-3" />
                            {formatEventTime(event.start_at) || "TBD"}
                          </span>
                          <span className="flex items-center gap-1" data-testid={`text-event-location-${event.id}`}>
                            <MapPin className="w-3 h-3" />
                            {getLocationString(event)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4" data-testid={`text-event-description-${event.id}`}>
                        {event.description.replace(/<[^>]*>/g, '')}
                      </p>
                    )}

                    <Button
                      className="w-full"
                      onClick={() => window.open(event.url, "_blank")}
                      data-testid={`button-event-view-${event.id}`}
                    >
                      View Event
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
