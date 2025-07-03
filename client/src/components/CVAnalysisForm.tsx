import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { User, Briefcase, GraduationCap, Plus, X, Save, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ExtractedInfo, CvFile } from "@shared/schema";

interface CVAnalysisFormProps {
  cvId: number;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experience: {
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  education: {
    degree: string;
    institution: string;
    graduationYear: number;
    gpa?: string;
  }[];
}

export default function CVAnalysisForm({ cvId }: CVAnalysisFormProps) {
  const [newSkill, setNewSkill] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: extractedInfo, isLoading } = useQuery<ExtractedInfo>({
    queryKey: [`/api/cv/${cvId}/extracted`],
    enabled: !!cvId,
  });

  const { data: cvFile } = useQuery({
    queryKey: [`/api/cv/${cvId}`],
    enabled: !!cvId,
  }) as { data: CvFile | undefined };

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
    skills: [],
    experience: [],
    education: [],
  });

  useEffect(() => {
    if (extractedInfo) {
      setFormData({
        fullName: extractedInfo.fullName || "",
        email: extractedInfo.email || "",
        phone: extractedInfo.phone || "",
        location: extractedInfo.location || "",
        summary: extractedInfo.summary || "",
        skills: extractedInfo.skills || [],
        experience: extractedInfo.experience || [],
        education: extractedInfo.education || [],
      });
    }
  }, [extractedInfo]);

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest('PUT', `/api/cv/${cvId}/extracted`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Information updated",
        description: "CV information has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/cv/${cvId}/extracted`] });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update CV information. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        { title: "", company: "", startDate: "", endDate: "", description: "" }
      ]
    }));
  };

  const removeExperience = (index: number) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [
        ...prev.education,
        { degree: "", institution: "", graduationYear: new Date().getFullYear(), gpa: "" }
      ]
    }));
  };

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const updateExperience = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const updateEducation = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
        <p className="text-center text-gray-600 mt-4">Loading CV information...</p>
      </div>
    );
  }

  const isProcessing = cvFile?.status === "processing";
  const isCompleted = cvFile?.status === "completed";
  const isFailed = cvFile?.status === "failed";

  if (isProcessing) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="text-center">
          <Clock className="w-16 h-16 mx-auto text-blue-600 mb-4 animate-pulse" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Document</h3>
          <p className="text-gray-600">Your CV is being analyzed. This may take a few moments...</p>
        </div>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Failed</h3>
          <p className="text-gray-600">Failed to process your CV. Please try uploading again.</p>
        </div>
      </div>
    );
  }

  if (!extractedInfo) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Information Found</h3>
          <p className="text-gray-600">Unable to extract information from this CV.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">CV Analysis Results</h2>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter location"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
              <Textarea
                value={formData.summary}
                onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="Enter professional summary"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <Button type="button" onClick={addSkill} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {skill}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-600"
                    onClick={() => removeSkill(index)}
                  />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Experience */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formData.experience.map((exp, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-gray-900">Experience {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExperience(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      placeholder="Job title"
                      value={exp.title}
                      onChange={(e) => updateExperience(index, 'title', e.target.value)}
                    />
                    <Input
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) => updateExperience(index, 'company', e.target.value)}
                    />
                    <Input
                      placeholder="Start date"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                    />
                    <Input
                      placeholder="End date"
                      value={exp.endDate}
                      onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                    />
                  </div>
                  <Textarea
                    placeholder="Job description"
                    value={exp.description}
                    onChange={(e) => updateExperience(index, 'description', e.target.value)}
                    rows={3}
                  />
                </div>
              ))}
              <Button type="button" onClick={addExperience} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Experience
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Education */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formData.education.map((edu, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-gray-900">Education {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEducation(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      placeholder="Degree"
                      value={edu.degree}
                      onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                    />
                    <Input
                      placeholder="Institution"
                      value={edu.institution}
                      onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Graduation year"
                      value={edu.graduationYear}
                      onChange={(e) => updateEducation(index, 'graduationYear', parseInt(e.target.value))}
                    />
                    <Input
                      placeholder="GPA (optional)"
                      value={edu.gpa || ""}
                      onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                    />
                  </div>
                </div>
              ))}
              <Button type="button" onClick={addEducation} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Education
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}