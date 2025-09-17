import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import { 
  Briefcase, 
  Search,
  MapPin, 
  Clock,
  Building,
  DollarSign,
  ExternalLink,
  BookmarkPlus,
  Send,
  Filter,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type Job = Tables<'jobs'>;

const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchQuery, selectedType, selectedLevel]);

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setJobs(data);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast({
        title: "Error loading jobs",
        description: "There was a problem loading job listings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(job => job.job_type === selectedType);
    }

    // Apply experience level filter
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(job => job.experience_level === selectedLevel);
    }

    setFilteredJobs(filtered);
  };

  const handleApply = async (jobId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('applications')
        .insert({
          job_id: jobId,
          applicant_id: user.id,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Application submitted!",
        description: "Your job application has been submitted successfully.",
      });
    } catch (error) {
      console.error('Error applying for job:', error);
      toast({
        title: "Error submitting application",
        description: "There was a problem submitting your application.",
        variant: "destructive"
      });
    }
  };

  const jobTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'internship', label: 'Internship' },
    { value: 'contract', label: 'Contract' },
  ];

  const experienceLevels = [
    { value: 'all', label: 'All Levels' },
    { value: 'entry', label: 'Entry Level' },
    { value: 'mid', label: 'Mid Level' },
    { value: 'senior', label: 'Senior Level' },
    { value: 'executive', label: 'Executive' },
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Job Opportunities</h1>
            <p className="text-muted-foreground">
              Discover career opportunities tailored for your college community
            </p>
          </div>
          <Button className="bg-accent-teal hover:bg-accent-teal-hover">
            <Plus className="h-4 w-4 mr-2" />
            Post a Job
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-card mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by job title, company, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex gap-2">
                  {jobTypes.map((type) => (
                    <Button
                      key={type.value}
                      variant={selectedType === type.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedType(type.value)}
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  {experienceLevels.map((level) => (
                    <Button
                      key={level.value}
                      variant={selectedLevel === level.value ? "teal" : "outline"}
                      size="sm"
                      onClick={() => setSelectedLevel(level.value)}
                    >
                      {level.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{jobs.filter(j => j.job_type === 'full-time').length}</p>
                  <p className="text-sm text-muted-foreground">Full-time Jobs</p>
                </div>
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{jobs.filter(j => j.job_type === 'internship').length}</p>
                  <p className="text-sm text-muted-foreground">Internships</p>
                </div>
                <Clock className="h-8 w-8 text-accent-teal" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{jobs.filter(j => j.experience_level === 'entry').length}</p>
                  <p className="text-sm text-muted-foreground">Entry Level</p>
                </div>
                <Building className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{jobs.length}</p>
                  <p className="text-sm text-muted-foreground">Total Opportunities</p>
                </div>
                <Search className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs List */}
        <div className="space-y-6">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <Card key={job.id} className="shadow-card hover:shadow-card-hover transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Job Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                          <div className="flex items-center gap-4 text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <Building className="h-4 w-4" />
                              <span>{job.company}</span>
                            </div>
                            {job.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>{job.location}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{new Date(job.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 mb-4">
                            <Badge variant="secondary">
                              {job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1)}
                            </Badge>
                            <Badge variant="outline">
                              {job.experience_level.charAt(0).toUpperCase() + job.experience_level.slice(1)} Level
                            </Badge>
                            {job.salary_range && (
                              <Badge className="bg-success/10 text-success hover:bg-success/20">
                                <DollarSign className="h-3 w-3 mr-1" />
                                {job.salary_range}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {job.description}
                      </p>
                      
                      {job.requirements && (
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2">Requirements:</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {job.requirements}
                          </p>
                        </div>
                      )}
                      
                      {job.application_deadline && (
                        <div className="flex items-center gap-1 text-sm text-warning mb-4">
                          <Clock className="h-4 w-4" />
                          <span>
                            Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col gap-3 lg:w-48">
                      <Button 
                        className="w-full"
                        onClick={() => handleApply(job.id)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Apply Now
                      </Button>
                      <Button variant="outline" className="w-full">
                        <BookmarkPlus className="h-4 w-4 mr-2" />
                        Save Job
                      </Button>
                      {job.external_url && (
                        <Button variant="ghost" className="w-full" asChild>
                          <a href={job.external_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            External Link
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="shadow-card">
              <CardContent className="pt-12 pb-12 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Try adjusting your search or filters.' : 'No job opportunities available at the moment.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;