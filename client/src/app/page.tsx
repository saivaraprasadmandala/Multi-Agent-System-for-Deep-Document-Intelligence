"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sparkles,
  FileText,
  ListChecks,
  AlertTriangle,
  Loader2,
  Brain,
  Zap,
  Target,
  Upload,
  File,
  X,
  Download,
  Key,
  CheckCircle2,
  Users,
  ShieldAlert,
  Gauge,
} from "lucide-react";

// Particle positions - generated once on client
interface ParticleData {
  id: number;
  x: number;
  delay: number;
  duration: number;
}

// Animated background particles (client-only)
const FloatingParticles = () => {
  const [particles, setParticles] = useState<ParticleData[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: i * 0.5,
      duration: 8 + Math.random() * 4,
    }));
    setParticles(generated);
  }, []);

  return (
    <>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute h-1 w-1 rounded-full bg-primary/30"
          initial={{ x: `${particle.x}%`, y: "100%", opacity: 0 }}
          animate={{ y: "-10%", opacity: [0, 1, 0] }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </>
  );
};

// Agent status card component
const AgentCard = ({
  icon: Icon,
  title,
  description,
  color,
  isActive,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  isActive: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="relative group"
  >
    <div
      className={`absolute -inset-0.5 rounded-xl bg-linear-to-r ${color} opacity-0 group-hover:opacity-75 blur transition duration-500`}
    />
    <Card className="relative bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-linear-to-br ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {isActive && (
            <motion.div
              className="ml-auto h-2 w-2 rounded-full bg-green-500"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  </motion.div>
);

// API Response types matching backend
interface ActionItem {
  id: string;
  description: string;
  owner: string;
  deadline: string;
  dependencies: string[];
  priority: string;
}

interface RiskItem {
  type: string;
  detail: string;
  impact_level: string;
  probability: string;
  mitigation: string;
}

interface AnalysisResult {
  summary: string;
  decisions: string[];
  constraints: string[];
  stakeholders: string[];
  actions: ActionItem[];
  risks: RiskItem[];
  confidence: number;
}

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AnalysisResult | null>(null);

  // Download results as JSON
  const downloadJSON = () => {
    if (!results) return;

    const jsonData = {
      generatedAt: new Date().toISOString(),
      source: uploadedFile ? uploadedFile.name : "Unknown",
      analysis: results,
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `document-analysis-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setUploadedFile(file);
    } else {
      setError("Only PDF files are supported");
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    if (file) {
      if (file.type === "application/pdf") {
        setUploadedFile(file);
      } else {
        setError("Only PDF files are supported");
      }
    }
  };

  // Remove uploaded file
  const removeFile = () => {
    setUploadedFile(null);
    setError(null);
  };

  // Analyze document via backend API
  const handleAnalyze = async () => {
    if (!uploadedFile || !apiKey.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("api_key", apiKey);

      const response = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data: AnalysisResult = await response.json();
      setResults(data);
    } catch (err) {
      console.error("Analysis failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze document. Make sure the backend server is running."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const agents = [
    {
      icon: Brain,
      title: "Summary Agent",
      description: "Generates context-aware summaries preserving intent and critical decisions",
      color: "from-primary to-orange-600",
    },
    {
      icon: ListChecks,
      title: "Action Agent",
      description: "Extracts actionable tasks with dependencies, owners, and deadlines",
      color: "from-secondary to-teal-600",
    },
    {
      icon: AlertTriangle,
      title: "Risk Agent",
      description: "Identifies unresolved questions, missing data, and potential risks",
      color: "from-amber-500 to-red-500",
    },
  ];

  const canAnalyze = uploadedFile && apiKey.trim();

  return (
    <div className="relative min-h-screen bg-background overflow-hidden dark">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(231,138,83,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(231,138,83,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />
        <FloatingParticles />
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Multi-Agent Intelligence</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            <span className="text-foreground">Deep Document</span>
            <br />
            <span className="bg-linear-to-r from-primary via-orange-400 to-secondary bg-clip-text text-transparent">
              Intelligence System
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transform unstructured documents into actionable insights using our autonomous multi-agent
            orchestration system.
          </p>
        </motion.div>

        {/* Agent Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
        >
          {agents.map((agent, index) => (
            <motion.div
              key={agent.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <AgentCard {...agent} isActive={isAnalyzing} />
            </motion.div>
          ))}
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="relative"
        >
          <div className="absolute -inset-1 bg-linear-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-2xl blur-xl opacity-50" />

          <Card className="relative bg-card/90 backdrop-blur-md border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-linear-to-br from-primary to-orange-600">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <CardTitle>Document Analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Key Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" />
                  OpenAI API Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
                  />
                  {apiKey && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Your API key is sent directly to the backend and is not stored.
                </p>
              </div>

              {/* File Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : uploadedFile
                    ? "border-green-500/50 bg-green-500/5"
                    : "border-border/50 hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                {uploadedFile ? (
                  <div className="flex items-center justify-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <File className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-foreground">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={removeFile}
                      className="ml-4 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium text-foreground mb-2">
                      Drop your PDF here
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Only PDF files are supported
                    </p>
                    <label>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Button variant="outline" asChild className="cursor-pointer">
                        <span>
                          <Upload className="mr-2 h-4 w-4" />
                          Browse Files
                        </span>
                      </Button>
                    </label>
                  </>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              {/* Analyze Button */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {uploadedFile ? `Ready: ${uploadedFile.name}` : "Upload a PDF to begin"}
                </p>

                <Button
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={!canAnalyze || isAnalyzing}
                  className="bg-linear-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 text-primary-foreground font-semibold px-8"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-5 w-5" />
                      Ignite Analysis
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="mt-12 space-y-6"
            >
              <div className="flex items-center justify-between mb-8">
                <div /> {/* Spacer for centering */}
                <h2 className="text-2xl font-bold">
                  <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Intelligence Report
                  </span>
                </h2>
                <Button
                  onClick={downloadJSON}
                  variant="outline"
                  className="border-primary/50 text-primary hover:bg-primary/10"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download JSON
                </Button>
              </div>

              {/* Confidence Meter */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Gauge className="h-6 w-6 text-primary" />
                        <span className="font-semibold text-foreground">Analysis Confidence</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-48 h-3 bg-background rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-linear-to-r from-primary to-green-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${results.confidence * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                        <span className="text-2xl font-bold text-primary">
                          {(results.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Summary Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="lg:col-span-2"
                >
                  <Card className="h-full bg-card/80 backdrop-blur-sm border-primary/20">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-linear-to-br from-primary to-orange-600">
                          <Brain className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle>Contextual Summary</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-foreground leading-relaxed">{results.summary}</p>

                      {/* Decisions */}
                      {results.decisions && results.decisions.length > 0 && (
                        <div className="pt-4 border-t border-border/50">
                          <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Key Decisions
                          </h4>
                          <ul className="space-y-1">
                            {results.decisions.map((decision, idx) => (
                              <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                                <span className="text-primary">•</span>
                                {decision}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Constraints */}
                      {results.constraints && results.constraints.length > 0 && (
                        <div className="pt-4 border-t border-border/50">
                          <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4" />
                            Constraints
                          </h4>
                          <ul className="space-y-1">
                            {results.constraints.map((constraint, idx) => (
                              <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                                <span className="text-amber-500">•</span>
                                {constraint}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Stakeholders */}
                      {results.stakeholders && results.stakeholders.length > 0 && (
                        <div className="pt-4 border-t border-border/50">
                          <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Stakeholders
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {results.stakeholders.map((stakeholder, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-medium"
                              >
                                {stakeholder}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Risks Card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="h-full bg-card/80 backdrop-blur-sm border-amber-500/20">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-linear-to-br from-amber-500 to-red-500">
                          <AlertTriangle className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle>Risks & Issues</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-4">
                        {results.risks && results.risks.map((risk, index) => (
                          <li key={index} className="space-y-1">
                            <div className="flex items-start gap-2">
                              <span
                                className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                                  risk.impact_level === "high" || risk.impact_level === "High"
                                    ? "bg-red-500"
                                    : risk.impact_level === "medium" || risk.impact_level === "Medium"
                                    ? "bg-amber-500"
                                    : "bg-green-500"
                                }`}
                              />
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {risk.type}
                                </p>
                                <p className="text-xs text-muted-foreground">{risk.detail}</p>
                                {risk.mitigation && (
                                  <p className="text-xs text-secondary mt-1">
                                    💡 {risk.mitigation}
                                  </p>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Actions Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="lg:col-span-3"
                >
                  <Card className="bg-card/80 backdrop-blur-sm border-secondary/20">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-linear-to-br from-secondary to-teal-600">
                          <Target className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle>Action Items</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {results.actions && results.actions.map((action, index) => (
                          <div
                            key={index}
                            className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-foreground text-sm">
                                {action.description}
                              </p>
                              {action.priority && (
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                                    action.priority.toLowerCase() === "high"
                                      ? "bg-red-500/20 text-red-400"
                                      : action.priority.toLowerCase() === "medium"
                                      ? "bg-amber-500/20 text-amber-400"
                                      : "bg-green-500/20 text-green-400"
                                  }`}
                                >
                                  {action.priority}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{action.owner || "Unassigned"}</span>
                              {action.deadline && (
                                <span className="px-2 py-1 rounded bg-primary/10 text-primary">
                                  {action.deadline}
                                </span>
                              )}
                            </div>
                            {action.dependencies && action.dependencies.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Depends on: {action.dependencies.join(", ")}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
