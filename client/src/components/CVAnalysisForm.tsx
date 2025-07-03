import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { User, Bus, Briefcase, GraduationCap, Plus, X, Save, Database, Download, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ExtractedInfo } from "@shared/schema";

interface CVAnalysisFormProps {
  cvId: number;
}

const formSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
  skills: z.array(z.string()).default([]),
  experience: z.array(z.object({
    title: z.string(),
    company: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    description: z.string(),
  })).default([]),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    graduationYear: z.number(),
    gpa: z.string().optional(),
  })).default([]),
});

export default function CVAnalysisForm({ cvId }: CVAnalysisFormProps) {
  const [newSkill, setNewSkill] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: extractedInfo, isLoading } = useQuery({
    queryKey: [`/api/cv/${cvId}/extracted`],
    enabled: !!cvId,
  });

  const { data: cvFile } = useQuery({
    queryKey: [`/api/cv/${cvId}`],
    enabled: !!cvId,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: extractedInfo || {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      summary: "",
      skills: [],
      experience: [],
      education: [],
    },
  });

  // Update form when data loads
  React.useEffect(() => {
    if (extractedInfo) {
      form.reset(extractedInfo);
    }
  }, [extractedInfo, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest('PATCH', `/api/cv/${cvId}/extracted`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Changes saved",
        description: "CV information has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/cv/${cvId}/extracted`] });
      queryClient.invalidateQueries({ queryKey: ['/api/cv'] });
    },
    onError: () => {
      toast({
        title: "Save failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    updateMutation.mutate(data);
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      const currentSkills = form.getValues("skills");
      form.setValue("skills", [...currentSkills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (index: number) => {
    const currentSkills = form.getValues("skills");
    form.setValue("skills", currentSkills.filter((_, i) => i !== index));
  };

  const addExperience = () => {
    const currentExperience = form.getValues("experience");
    form.setValue("experience", [
      ...currentExperience,
      { title: "", company: "", startDate: "", endDate: "", description: "" }
    ]);
  };

  const removeExperience = (index: number) => {
    const currentExperience = form.getValues("experience");
    form.setValue("experience", currentExperience.filter((_, i) => i !== index));
  };

  const addEducation = () => {
    const currentEducation = form.getValues("education");
    form.setValue("education", [
      ...currentEducation,
      { degree: "", institution: "", graduationYear: new Date().getFullYear(), gpa: "" }
    ]);
  };

  const removeEducation = (index: number) => {
    const currentEducation = form.getValues("education");
    form.setValue("education", currentEducation.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isProcessing = cvFile?.status === "processing";
  const isCompleted = cvFile?.status === "completed";

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>
          <p className="text-gray-600">Extracted information from uploaded CV documents</p>
        </div>
        <div className="flex items-center space-x-2">
          {isCompleted && (
            <Badge variant="default" className="bg-green-50 text-green-600 border-green-200">
              <CheckCircle className="h-4 w-4 mr-2" />
              Analysis Complete
            </Badge>
          )}
          {isProcessing && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-200">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
              Processing
            </Badge>
          )}
        </div>
      </div>

      {isProcessing && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <div>
              <p className="font-medium text-blue-900">Analyzing CV content...</p>
              <p className="text-sm text-blue-600">Extracting text and identifying key information</p>
            </div>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <User className="h-5 w-5 text-primary mr-2" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Professional Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Bus className="h-5 w-5 text-primary mr-2" />
                  Professional Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Summary</FormLabel>
                      <FormControl>
                        <Textarea rows={6} className="resize-none" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div>
                  <FormLabel>Key Skills</FormLabel>
                  <div className="flex flex-wrap gap-2 mt-2 mb-3">
                    {form.watch("skills").map((skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-primary/10 text-primary">
                        {skill}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-auto p-0 text-primary/60 hover:text-primary"
                          onClick={() => removeSkill(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    />
                    <Button type="button" variant="outline" onClick={addSkill}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Experience Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-base">
                  <Briefcase className="h-5 w-5 text-primary mr-2" />
                  Work Experience
                </CardTitle>
                <Button type="button" onClick={addExperience}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Experience
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.watch("experience").map((_, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`experience.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`experience.${index}.company`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`experience.${index}.startDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="month" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`experience.${index}.endDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input type="month" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="mt-4">
                    <FormField
                      control={form.control}
                      name={`experience.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea rows={3} className="resize-none" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExperience(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Education Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-base">
                  <GraduationCap className="h-5 w-5 text-primary mr-2" />
                  Education
                </CardTitle>
                <Button type="button" onClick={addEducation}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Education
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.watch("education").map((_, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`education.${index}.degree`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Degree</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`education.${index}.institution`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Institution</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`education.${index}.graduationYear`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Graduation Year</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`education.${index}.gpa`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GPA (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEducation(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">
                <Save className="h-4 w-4 mr-1 inline" />
                Auto-saved at {new Date().toLocaleTimeString()}
              </span>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" type="button">
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                <Database className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Saving..." : "Save to Database"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
