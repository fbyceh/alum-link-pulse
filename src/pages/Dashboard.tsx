import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import { 
  Users, 
  Briefcase, 
  Calendar, 
  TrendingUp, 
  MapPin, 
  Clock,
  ArrowRight,
  Star,
  MessageCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type Job = Tables<'jobs'>;
type Event = Tables<'events'>;

const Dashboard: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [suggestedConnections, setSuggestedConnections] = useState<Profile[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Load suggested connections (other profiles, limit 3)
      const { data: connectionsData } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.id)
        .limit(3);

      if (connectionsData) {
        setSuggestedConnections(connectionsData);
      }

      // Load recent jobs
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (jobsData) {
        setRecentJobs(jobsData);
      }

      // Load upcoming events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(3);

      if (eventsData) {
        setUpcomingEvents(eventsData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error loading dashboard",
        description: "There was a problem loading your dashboard. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Network Connections', value: '127', icon: Users, change: '+12 this month' },
    { label: 'Job Applications', value: '8', icon: Briefcase, change: '+3 this week' },
    { label: 'Events Attended', value: '15', icon: Calendar, change: '+2 this month' },
    { label: 'Profile Views', value: '43', icon: TrendingUp, change: '+8 this week' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarFallback className="text-lg">
                      {profile?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-semibold mb-1">
                    {profile?.full_name || 'Complete your profile'}
                  </h3>
                  <p className="text-muted-foreground mb-2">
                    {profile?.current_position && profile?.company 
                      ? `${profile.current_position} at ${profile.company}`
                      : 'Add your current position'
                    }
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {profile?.course && profile?.batch_year 
                      ? `${profile.course} • Class of ${profile.batch_year}`
                      : 'Add your education details'
                    }
                  </p>
                  <Link to="/profile" className="w-full">
                    <Button variant="outline" className="w-full">
                      View Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Your Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{stat.label}</p>
                          <p className="text-xs text-muted-foreground">{stat.change}</p>
                        </div>
                      </div>
                      <span className="text-xl font-bold">{stat.value}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Content Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Message */}
            <Card className="shadow-card bg-gradient-card">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-2">
                  Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}! 👋
                </h2>
                <p className="text-muted-foreground mb-4">
                  Here's what's happening in your college network today.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link to="/network">
                    <Button size="sm" className="bg-accent-teal hover:bg-accent-teal-hover">
                      Find Connections
                    </Button>
                  </Link>
                  <Link to="/jobs">
                    <Button size="sm" variant="outline">
                      Browse Jobs
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Jobs */}
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recommended Jobs</CardTitle>
                  <CardDescription>Based on your profile and interests</CardDescription>
                </div>
                <Link to="/jobs">
                  <Button variant="ghost" size="sm">
                    View all <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentJobs.length > 0 ? (
                  recentJobs.map((job) => (
                    <div key={job.id} className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{job.title}</h4>
                        <p className="text-sm text-muted-foreground">{job.company}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            {job.location || 'Remote'}
                          </div>
                          <Badge variant="secondary">{job.job_type}</Badge>
                          {job.salary_range && (
                            <span className="text-xs text-muted-foreground">{job.salary_range}</span>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Apply</Button>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No jobs available at the moment. Check back later!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Upcoming Events</CardTitle>
                  <CardDescription>Don't miss these networking opportunities</CardDescription>
                </div>
                <Link to="/events">
                  <Button variant="ghost" size="sm">
                    View all <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                      <div className="p-2 bg-accent-teal/10 rounded-lg">
                        <Calendar className="h-5 w-5 text-accent-teal" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{event.title}</h4>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(event.start_time).toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            {event.location || 'Online'}
                          </div>
                          <Badge variant="secondary">{event.event_type}</Badge>
                        </div>
                      </div>
                      <Button size="sm" className="bg-accent-teal hover:bg-accent-teal-hover">
                        RSVP
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No upcoming events. Create or join events to expand your network!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Suggested Connections */}
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">People you may know</CardTitle>
                  <CardDescription>Expand your professional network</CardDescription>
                </div>
                <Link to="/network">
                  <Button variant="ghost" size="sm">
                    View all <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suggestedConnections.length > 0 ? (
                    suggestedConnections.map((connection, index) => (
                      <div key={index} className="p-4 rounded-lg border hover:shadow-card-hover transition-shadow">
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>
                              {connection.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{connection.full_name}</h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {connection.current_position && connection.company 
                                ? `${connection.current_position} at ${connection.company}`
                                : connection.course || 'Student'
                              }
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Button size="sm" className="h-8">
                                <MessageCircle className="h-3 w-3 mr-1" />
                                Connect
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8 col-span-2">
                      No suggested connections available. Complete your profile to get better recommendations!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;