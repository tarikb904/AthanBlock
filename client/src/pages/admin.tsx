import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { 
  BookOpen, 
  Users, 
  Calendar, 
  BarChart3, 
  Plus, 
  Save, 
  Eye, 
  Trash2,
  Shield,
  Settings
} from "lucide-react";

export default function Admin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [newAdhkar, setNewAdhkar] = useState({
    titleEn: "",
    titleAr: "",
    textAr: "",
    textEn: "",
    transliteration: "",
    category: "morning",
    repetitions: 1,
    audioUrl: "",
    published: true,
  });

  const { data: adhkar, isLoading: adhkarLoading } = useQuery({
    queryKey: ["/api/adhkar"],
  });

  const { data: templates } = useQuery({
    queryKey: ["/api/time-blocks/templates"],
  });

  const createAdhkarMutation = useMutation({
    mutationFn: async (adhkarData: any) => {
      const response = await apiRequest("POST", "/api/adhkar", adhkarData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adhkar"] });
      setNewAdhkar({
        titleEn: "",
        titleAr: "",
        textAr: "",
        textEn: "",
        transliteration: "",
        category: "morning",
        repetitions: 1,
        audioUrl: "",
        published: true,
      });
      toast({
        title: "Adhkar created",
        description: "The new adhkar has been added to the library.",
      });
    },
    onError: () => {
      toast({
        title: "Creation failed",
        description: "There was an error creating the adhkar.",
        variant: "destructive",
      });
    },
  });

  const deleteAdhkarMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/adhkar/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adhkar"] });
      toast({
        title: "Adhkar deleted",
        description: "The adhkar has been removed from the library.",
      });
    },
  });

  const handleCreateAdhkar = () => {
    createAdhkarMutation.mutate(newAdhkar);
  };

  const stats = [
    { label: "Total Adhkar", value: adhkar?.length || 0, color: "text-primary" },
    { label: "Active Users", value: "1.2K", color: "text-chart-2" },
    { label: "Completion Rate", value: "89%", color: "text-chart-3" },
    { label: "Templates", value: templates?.length || 0, color: "text-chart-4" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Admin Warning */}
          <Card className="bg-destructive/10 border-destructive">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-destructive" />
                <div>
                  <h3 className="font-semibold text-destructive">Admin Dashboard</h3>
                  <p className="text-sm text-muted-foreground">Content management interface for administrators</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-bold ${stat.color}`} data-testid={`stat-${stat.label.toLowerCase().replace(" ", "-")}`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Admin Sidebar */}
            <Card>
              <CardHeader>
                <CardTitle>Admin Panel</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  <Button 
                    variant="default" 
                    className="w-full justify-start"
                    data-testid="nav-adhkar-content"
                  >
                    <BookOpen className="w-4 h-4 mr-3" />
                    Adhkar Content
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    data-testid="nav-prayer-settings"
                  >
                    <i className="fas fa-mosque w-4 h-4 mr-3"></i>
                    Prayer Settings
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    data-testid="nav-templates"
                  >
                    <Calendar className="w-4 h-4 mr-3" />
                    Templates
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    data-testid="nav-user-management"
                  >
                    <Users className="w-4 h-4 mr-3" />
                    User Management
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    data-testid="nav-analytics"
                  >
                    <BarChart3 className="w-4 h-4 mr-3" />
                    Analytics
                  </Button>
                </nav>
              </CardContent>
            </Card>

            {/* Content Management */}
            <div className="lg:col-span-3 space-y-6">
              <Tabs defaultValue="create" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="create" data-testid="tab-create-adhkar">Create Adhkar</TabsTrigger>
                  <TabsTrigger value="manage" data-testid="tab-manage-adhkar">Manage Adhkar</TabsTrigger>
                </TabsList>

                <TabsContent value="create" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Add New Adhkar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="titleEn">Title (English)</Label>
                          <Input
                            id="titleEn"
                            value={newAdhkar.titleEn}
                            onChange={(e) => setNewAdhkar(prev => ({ ...prev, titleEn: e.target.value }))}
                            placeholder="Ayat al-Kursi"
                            data-testid="input-title-en"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="titleAr">Title (Arabic)</Label>
                          <Input
                            id="titleAr"
                            value={newAdhkar.titleAr}
                            onChange={(e) => setNewAdhkar(prev => ({ ...prev, titleAr: e.target.value }))}
                            placeholder="آية الكرسي"
                            dir="rtl"
                            className="font-serif"
                            data-testid="input-title-ar"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Select value={newAdhkar.category} onValueChange={(value) => setNewAdhkar(prev => ({ ...prev, category: value }))}>
                            <SelectTrigger data-testid="select-adhkar-category">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="morning">Morning Adhkar</SelectItem>
                              <SelectItem value="evening">Evening Adhkar</SelectItem>
                              <SelectItem value="prayer">Before Prayer</SelectItem>
                              <SelectItem value="after-prayer">After Prayer</SelectItem>
                              <SelectItem value="sleep">Before Sleep</SelectItem>
                              <SelectItem value="general">General</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="repetitions">Repetitions</Label>
                          <Input
                            id="repetitions"
                            type="number"
                            value={newAdhkar.repetitions}
                            onChange={(e) => setNewAdhkar(prev => ({ ...prev, repetitions: parseInt(e.target.value) || 1 }))}
                            min="1"
                            data-testid="input-repetitions"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="textAr">Arabic Text</Label>
                        <Textarea
                          id="textAr"
                          value={newAdhkar.textAr}
                          onChange={(e) => setNewAdhkar(prev => ({ ...prev, textAr: e.target.value }))}
                          placeholder="النص العربي"
                          className="h-24 font-serif text-right"
                          dir="rtl"
                          data-testid="textarea-text-ar"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="textEn">English Translation</Label>
                        <Textarea
                          id="textEn"
                          value={newAdhkar.textEn}
                          onChange={(e) => setNewAdhkar(prev => ({ ...prev, textEn: e.target.value }))}
                          placeholder="English translation"
                          className="h-24"
                          data-testid="textarea-text-en"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="transliteration">Transliteration (Optional)</Label>
                        <Input
                          id="transliteration"
                          value={newAdhkar.transliteration}
                          onChange={(e) => setNewAdhkar(prev => ({ ...prev, transliteration: e.target.value }))}
                          placeholder="Phonetic pronunciation"
                          data-testid="input-transliteration"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="audioUrl">Audio URL (Optional)</Label>
                        <Input
                          id="audioUrl"
                          value={newAdhkar.audioUrl}
                          onChange={(e) => setNewAdhkar(prev => ({ ...prev, audioUrl: e.target.value }))}
                          placeholder="https://example.com/audio.mp3"
                          data-testid="input-audio-url"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            checked={newAdhkar.published}
                            onCheckedChange={(checked) => setNewAdhkar(prev => ({ ...prev, published: !!checked }))}
                            data-testid="checkbox-published"
                          />
                          <Label>Publish immediately</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" data-testid="button-preview-adhkar">
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </Button>
                          <Button 
                            onClick={handleCreateAdhkar}
                            disabled={createAdhkarMutation.isPending}
                            data-testid="button-save-adhkar"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {createAdhkarMutation.isPending ? "Saving..." : "Save Adhkar"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="manage" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Adhkar Library Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {adhkarLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                          <p className="text-muted-foreground mt-4">Loading adhkar...</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {adhkar?.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center space-x-3">
                                  <h4 className="font-semibold text-card-foreground">{item.titleEn}</h4>
                                  <Badge variant="outline">{item.category}</Badge>
                                  {item.published ? (
                                    <Badge className="bg-chart-2 text-chart-2-foreground">Published</Badge>
                                  ) : (
                                    <Badge variant="secondary">Draft</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground truncate max-w-md">
                                  {item.textEn}
                                </p>
                                <div className="text-xs text-muted-foreground">
                                  {item.repetitions} repetition{item.repetitions > 1 ? 's' : ''}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="sm" data-testid={`button-edit-adhkar-${item.id}`}>
                                  <i className="fas fa-edit w-4 h-4"></i>
                                </Button>
                                <Button variant="ghost" size="sm" data-testid={`button-preview-adhkar-${item.id}`}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => deleteAdhkarMutation.mutate(item.id)}
                                  disabled={deleteAdhkarMutation.isPending}
                                  data-testid={`button-delete-adhkar-${item.id}`}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Template Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Schedule Templates</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-card-foreground">Islamic Daily Template</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{templates?.length || 0} blocks</Badge>
                        <Button variant="outline" size="sm" data-testid="button-edit-template">
                          <Settings className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid gap-2 text-sm">
                      {templates?.map((template: any) => (
                        <div key={template.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="font-mono text-primary">{template.startTime.slice(0, 5)}</span>
                            <span className="text-card-foreground">{template.title}</span>
                          </div>
                          <Badge variant="secondary">{Math.floor(template.duration / 60)}h {template.duration % 60}m</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Usage Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-primary/5 rounded-lg">
                        <div className="text-sm text-muted-foreground">Most Popular Adhkar</div>
                        <div className="text-lg font-semibold text-primary">Ayat al-Kursi</div>
                        <div className="text-xs text-muted-foreground">Completed 892 times this week</div>
                      </div>
                      <div className="p-4 bg-chart-2/5 rounded-lg">
                        <div className="text-sm text-muted-foreground">Average Daily Completion</div>
                        <div className="text-lg font-semibold text-chart-2">67%</div>
                        <div className="text-xs text-muted-foreground">Up 12% from last month</div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-2">Prayer Time Preferences</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>ISNA Method</span>
                          <span className="text-primary font-medium">65%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Muslim World League</span>
                          <span className="text-primary font-medium">25%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Other Methods</span>
                          <span className="text-primary font-medium">10%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
