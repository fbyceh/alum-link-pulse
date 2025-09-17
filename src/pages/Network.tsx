import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import { 
  Users, 
  Search,
  MapPin, 
  Briefcase,
  GraduationCap,
  MessageCircle,
  UserPlus,
  Star,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

const Network: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    filterProfiles();
  }, [profiles, searchQuery, selectedFilter]);

  const loadProfiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setProfiles(data);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast({
        title: "Error loading network",
        description: "There was a problem loading profiles. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProfiles = () => {
    let filtered = profiles;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(profile => 
        profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.current_position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.course?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply role filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(profile => profile.role === selectedFilter);
    }

    setFilteredProfiles(filtered);
  };

  const handleConnect = async (profileId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('connections')
        .insert({
          requester_id: user.id,
          addressee_id: profileId,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Connection request sent!",
        description: "Your connection request has been sent successfully.",
      });
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast({
        title: "Error sending request",
        description: "There was a problem sending your connection request.",
        variant: "destructive"
      });
    }
  };

  const filters = [
    { value: 'all', label: 'All People' },
    { value: 'student', label: 'Students' },
    { value: 'alumni', label: 'Alumni' },
    { value: 'mentor', label: 'Mentors' },
    { value: 'faculty', label: 'Faculty' },
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Network</h1>
          <p className="text-muted-foreground">
            Discover and connect with students, alumni, and mentors in your college community
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-card mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, position, company, skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {filters.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={selectedFilter === filter.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter(filter.value)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{profiles.filter(p => p.role === 'student').length}</p>
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{profiles.filter(p => p.role === 'alumni').length}</p>
                  <p className="text-sm text-muted-foreground">Alumni</p>
                </div>
                <Users className="h-8 w-8 text-accent-teal" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{profiles.filter(p => p.is_mentor_available).length}</p>
                  <p className="text-sm text-muted-foreground">Mentors Available</p>
                </div>
                <Star className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{profiles.length}</p>
                  <p className="text-sm text-muted-foreground">Total Network</p>
                </div>
                <Users className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* People Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.length > 0 ? (
            filteredProfiles.map((profile) => (
              <Card key={profile.id} className="shadow-card hover:shadow-card-hover transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-20 w-20 mb-4">
                      <AvatarFallback className="text-lg">
                        {profile.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{profile.full_name}</h3>
                      {profile.is_verified && (
                        <Badge variant="secondary" className="text-xs">
                          ✓ Verified
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-muted-foreground text-sm mb-2">
                      {profile.current_position && profile.company 
                        ? `${profile.current_position} at ${profile.company}`
                        : profile.course || 'Student'
                      }
                    </p>
                    
                    {profile.batch_year && (
                      <p className="text-xs text-muted-foreground mb-3">
                        Class of {profile.batch_year}
                      </p>
                    )}
                    
                    {profile.bio && (
                      <p className="text-sm text-center text-muted-foreground mb-4 line-clamp-2">
                        {profile.bio}
                      </p>
                    )}
                    
                    {profile.skills && profile.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4 justify-center">
                        {profile.skills.slice(0, 3).map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {profile.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{profile.skills.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="flex gap-2 w-full">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleConnect(profile.user_id)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Connect
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {profile.is_mentor_available && (
                      <div className="mt-3 w-full">
                        <Badge className="w-full justify-center bg-accent-teal hover:bg-accent-teal-hover">
                          Available for Mentorship
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card className="shadow-card">
                <CardContent className="pt-12 pb-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No people found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Try adjusting your search or filters.' : 'No profiles available in your network yet.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Network;