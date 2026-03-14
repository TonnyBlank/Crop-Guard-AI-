import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Camera, Leaf, AlertTriangle, CheckCircle, Pill, Search, Sparkles, Shield, XCircle, Heart, Bug, Droplets, Download, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import leafDiagnosis from "@/assets/leaf-diagnosis.png";

interface DiagnosisResult {
  isHealthy: boolean;
  disease: string;
  scientificName: string;
  confidence: number;
  severity: "None" | "Low" | "Medium" | "High" | "Critical";
  plantType: string;
  description: string;
  affectedArea: string;
  spreadRisk: "Low" | "Medium" | "High";
  treatments: string[];
  prevention: string[];
  organicAlternatives: string[];
}

const analysisSteps = [
  "Validating image content...",
  "Identifying plant species...",
  "Scanning for disease markers...",
  "Cross-referencing pathogen database...",
  "Assessing severity & spread risk...",
  "Generating treatment protocol...",
];

const Diagnose = () => {
  const { user } = useAuth();
  const [image, setImage ] = useState<string | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [notLeafMsg, setNotLeafMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ image: string; result: DiagnosisResult; time: Date }>>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera is not supported in this browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: unknown) {
      stopCamera();
      setCameraOpen(false);
      const message = err instanceof Error ? err.message : "Unable to access camera.";
      setCameraError(message);
      toast.error(message);
    }
  }, [stopCamera]);

  useEffect(() => {
    if (!cameraOpen) {
      stopCamera();
      return;
    }
    startCamera();
    return () => stopCamera();
  }, [cameraOpen, startCamera, stopCamera]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setImage(dataUrl);
    setResult(null);
    setNotLeafMsg(null);
    setCameraOpen(false);
  }, []);

  const openCamera = useCallback(() => {
    setCameraOpen(true);
  }, []);

  const handleFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum 10MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setResult(null);
      setNotLeafMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  }, []);

  const runDiagnosis = async () => {
    if (!image) return;
    setDiagnosing(true);
    setCurrentStep(0);
    setResult(null);
    setNotLeafMsg(null);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < analysisSteps.length - 1 ? prev + 1 : prev));
    }, 800);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-crop", {
        body: { imageBase64: image },
      });

      clearInterval(stepInterval);

      if (error) {
        console.error("Edge function error:", error);
        toast.error("Analysis failed. Please try again.");
        setDiagnosing(false);
        return;
      }

      if (data.error) {
        toast.error(data.error);
        setDiagnosing(false);
        return;
      }

      if (!data.isLeaf) {
        setNotLeafMsg(data.message);
        setDiagnosing(false);
        return;
      }

      setCurrentStep(analysisSteps.length - 1);
      await new Promise((r) => setTimeout(r, 500));
      setResult(data.diagnosis);
      setHistory((prev) => [{ image: image!, result: data.diagnosis, time: new Date() }, ...prev].slice(0, 5));

      // Save to diagnosis_history
      if (user) {
        await supabase.from("diagnosis_history").insert({
          user_id: user.id,
          disease: data.diagnosis.disease,
          confidence: data.diagnosis.confidence,
          plant_type: data.diagnosis.plantType,
          severity: data.diagnosis.severity,
          treatments: data.diagnosis.treatments,
          image_url: image,
        });
      }
    } catch (err) {
      console.error("Diagnosis error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      clearInterval(stepInterval);
      setDiagnosing(false);
    }
  };

  const downloadReport = () => {
    if (!result || !image) return;

    // Create a canvas-based downloadable report with image
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 1200;

    // Background
    ctx.fillStyle = "#f5f5f0";
    ctx.fillRect(0, 0, 800, 1200);

    // Header bar
    ctx.fillStyle = "#1a5c2e";
    ctx.fillRect(0, 0, 800, 80);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 28px Arial";
    ctx.fillText("CropGuard AI — Diagnosis Report", 30, 52);

    // Date
    ctx.fillStyle = "#666";
    ctx.font = "14px Arial";
    ctx.fillText(`Generated: ${new Date().toLocaleString()}`, 30, 110);

    // Load and draw the uploaded image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Image section
      const imgX = 30, imgY = 130, imgW = 300, imgH = 225;
      ctx.strokeStyle = "#ddd";
      ctx.strokeRect(imgX - 1, imgY - 1, imgW + 2, imgH + 2);
      ctx.drawImage(img, imgX, imgY, imgW, imgH);

      // Info next to image
      let infoY = 150;
      ctx.fillStyle = "#333";
      ctx.font = "bold 20px Arial";
      ctx.fillText(result!.disease, 350, infoY); infoY += 30;
      if (result!.scientificName) {
        ctx.font = "italic 14px Arial";
        ctx.fillStyle = "#888";
        ctx.fillText(result!.scientificName, 350, infoY); infoY += 25;
      }
      ctx.font = "16px Arial";
      ctx.fillStyle = "#333";
      ctx.fillText(`Plant: ${result!.plantType}`, 350, infoY); infoY += 25;
      ctx.fillText(`Confidence: ${result!.confidence}%`, 350, infoY); infoY += 25;
      ctx.fillText(`Severity: ${result!.severity}`, 350, infoY); infoY += 25;
      ctx.fillText(`Spread Risk: ${result!.spreadRisk}`, 350, infoY); infoY += 25;
      ctx.fillText(`Affected Area: ${result!.affectedArea}`, 350, infoY);

      // Description
      let y = 380;
      ctx.fillStyle = "#1a5c2e";
      ctx.font = "bold 18px Arial";
      ctx.fillText("Description", 30, y); y += 25;
      ctx.fillStyle = "#444";
      ctx.font = "14px Arial";
      const descLines = wrapText(ctx, result!.description, 740);
      descLines.forEach((line) => { ctx.fillText(line, 30, y); y += 20; });

      // Treatments
      y += 15;
      ctx.fillStyle = "#1a5c2e";
      ctx.font = "bold 18px Arial";
      ctx.fillText("Treatment Plan", 30, y); y += 25;
      ctx.fillStyle = "#444";
      ctx.font = "14px Arial";
      result!.treatments.forEach((t) => {
        const lines = wrapText(ctx, `• ${t}`, 740);
        lines.forEach((line) => { ctx.fillText(line, 30, y); y += 20; });
      });

      // Organic alternatives
      if (result!.organicAlternatives.length > 0) {
        y += 15;
        ctx.fillStyle = "#1a5c2e";
        ctx.font = "bold 18px Arial";
        ctx.fillText("Organic Alternatives", 30, y); y += 25;
        ctx.fillStyle = "#444";
        ctx.font = "14px Arial";
        result!.organicAlternatives.forEach((o) => {
          const lines = wrapText(ctx, `• ${o}`, 740);
          lines.forEach((line) => { ctx.fillText(line, 30, y); y += 20; });
        });
      }

      // Prevention
      if (result!.prevention.length > 0) {
        y += 15;
        ctx.fillStyle = "#1a5c2e";
        ctx.font = "bold 18px Arial";
        ctx.fillText("Prevention Tips", 30, y); y += 25;
        ctx.fillStyle = "#444";
        ctx.font = "14px Arial";
        result!.prevention.forEach((p) => {
          const lines = wrapText(ctx, `• ${p}`, 740);
          lines.forEach((line) => { ctx.fillText(line, 30, y); y += 20; });
        });
      }

      // Footer
      ctx.fillStyle = "#1a5c2e";
      ctx.fillRect(0, 1160, 800, 40);
      ctx.fillStyle = "#fff";
      ctx.font = "12px Arial";
      ctx.fillText("CropGuard AI — Powered by Gemini Vision Engine", 30, 1185);

      // Download
      const link = document.createElement("a");
      link.download = `cropguard-diagnosis-${result!.plantType}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Report downloaded!");
    };
    img.src = image;
  };

  const useSample = () => {
    setImage(leafDiagnosis);
    setResult(null);
    setNotLeafMsg(null);
  };

  const severityColor = (s: string) => {
    const map: Record<string, string> = {
      Critical: "bg-destructive text-destructive-foreground",
      High: "bg-destructive text-destructive-foreground",
      Medium: "bg-warning text-warning-foreground",
      Low: "bg-secondary text-secondary-foreground",
      None: "bg-success text-success-foreground",
    };
    return map[s] || "bg-muted text-muted-foreground";
  };

  const spreadColor = (s: string) => {
    const map: Record<string, string> = { High: "text-destructive", Medium: "text-warning", Low: "text-success" };
    return map[s] || "text-muted-foreground";
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">AI Disease Diagnosis</h1>
        <p className="text-muted-foreground">
          Powered by Gemini Vision — upload a leaf image for instant, real AI-powered analysis
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Camera className="h-5 w-5 text-primary" /> Upload Leaf Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              {cameraOpen ? (
                <div className="space-y-4">
                  <video
                    ref={videoRef}
                    className="w-full rounded-xl object-cover h-72 bg-black"
                    playsInline
                  />
                  {cameraError ? (
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                      <p className="text-sm text-destructive mb-2">{cameraError}</p>
                      <Button variant="outline" onClick={() => setCameraOpen(false)} className="w-full">
                        Close Camera
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Button onClick={capturePhoto} className="flex-1">
                        <Camera className="h-4 w-4 mr-2" />
                        Capture Photo
                      </Button>
                      <Button variant="outline" onClick={() => setCameraOpen(false)} className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              ) : !image ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-background p-12 md:p-16 transition-all hover:border-primary hover:bg-accent/50"
                  >
                    <div className="mb-4 rounded-full bg-accent p-4 transition-colors group-hover:bg-primary">
                      <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary-foreground" />
                    </div>
                    <p className="mb-1 font-display font-semibold text-center">Upload Photo</p>
                    <p className="text-xs text-muted-foreground text-center">JPG, PNG up to 10MB</p>
                  </div>
                  <div
                    className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary bg-gradient-to-br from-primary/5 to-accent p-12 md:p-16 transition-all hover:border-primary/75 hover:bg-primary/10"
                    onClick={openCamera}
                  >
                    <div className="mb-4 rounded-full bg-primary/20 p-4 transition-colors group-hover:bg-primary">
                      <Video className="h-8 w-8 text-primary group-hover:text-primary-foreground" />
                    </div>
                    <p className="mb-1 font-display font-semibold text-center text-primary">Open Camera</p>
                    <p className="text-xs text-muted-foreground text-center">Live preview & capture</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-xl border bg-background">
                    <img src={image} alt="Uploaded leaf" className="h-72 w-full object-contain" />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={runDiagnosis} disabled={diagnosing} size="lg" className="flex-1 gap-2">
                      <Sparkles className="h-4 w-4" />
                      {diagnosing ? "Analyzing..." : "Run AI Diagnosis"}
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => { setImage(null); setResult(null); setNotLeafMsg(null); }}>
                      Clear
                    </Button>
                  </div>
                </div>
              )}
              {!image && (
                <Button variant="ghost" className="mt-4 w-full gap-2 text-sm text-muted-foreground" onClick={useSample}>
                  <Search className="h-4 w-4" /> Try with a sample image
                </Button>
              )}
            </CardContent>
          </Card>

          {/* How it works */}
          <Card className="bg-accent/30">
            <CardContent className="p-6">
              <h3 className="mb-3 font-display text-sm font-semibold text-accent-foreground">How it works</h3>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="font-semibold text-primary">1.</span> Upload a clear photo of the affected leaf</li>
                <li className="flex gap-2"><span className="font-semibold text-primary">2.</span> AI validates it's a plant image, then analyzes disease patterns</li>
                <li className="flex gap-2"><span className="font-semibold text-primary">3.</span> Receive diagnosis, severity, treatments & organic alternatives</li>
              </ol>
            </CardContent>
          </Card>

          {/* Recent History */}
          {history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Recent Diagnoses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border bg-background p-3">
                    <img src={h.image} alt="" className="h-12 w-12 rounded-md object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{h.result.disease}</p>
                      <p className="text-xs text-muted-foreground">{h.result.plantType} • {h.time.toLocaleTimeString()}</p>
                    </div>
                    <Badge className={severityColor(h.result.severity)} variant="secondary">{h.result.severity}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Results */}
        <div className="space-y-6">
          {/* Analysis Progress */}
          {diagnosing && (
            <Card className="border-primary/30">
              <CardContent className="p-8">
                <div className="mb-6 flex items-center gap-3">
                  <Leaf className="h-8 w-8 animate-pulse text-primary" />
                  <div>
                    <p className="font-display text-lg font-semibold">AI Analysis in Progress</p>
                    <p className="text-sm text-muted-foreground">Gemini Vision Engine processing</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {analysisSteps.map((step, i) => (
                    <div key={i} className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                      i <= currentStep ? "text-foreground" : "text-muted-foreground/40"
                    }`}>
                      {i < currentStep ? (
                        <CheckCircle className="h-4 w-4 shrink-0 text-success" />
                      ) : i === currentStep ? (
                        <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      ) : (
                        <div className="h-4 w-4 shrink-0 rounded-full border-2 border-muted" />
                      )}
                      {step}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Not a leaf warning */}
          {notLeafMsg && (
            <Card className="border-destructive/30">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-destructive/10 p-3">
                    <XCircle className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold">Not a Plant Leaf</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{notLeafMsg}</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => { setImage(null); setNotLeafMsg(null); }}>
                      Try Another Image
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Diagnosis Results */}
          {result && (
            <>
              {/* Main Result */}
              <Card className={`overflow-hidden ${result.isHealthy ? "border-success/40" : "border-warning/40"}`}>
                <div className={`h-1.5 ${result.isHealthy ? "bg-success" : "bg-gradient-to-r from-warning via-secondary to-warning"}`} />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="flex items-center gap-2 font-display text-lg">
                      {result.isHealthy ? (
                        <Heart className="h-5 w-5 text-success" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-warning" />
                      )}
                      {result.isHealthy ? "Healthy Plant" : "Disease Detected"}
                    </CardTitle>
                    <Badge className={severityColor(result.severity)}>{result.severity} Severity</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <p className="font-display text-xl font-bold">{result.disease}</p>
                    {result.scientificName && (
                      <p className="text-sm italic text-muted-foreground">{result.scientificName}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-1000"
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>
                    <span className="font-display text-lg font-bold text-primary">{result.confidence}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">AI Confidence Score</p>

                  <p className="text-sm leading-relaxed text-muted-foreground">{result.description}</p>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-accent/50 p-3 text-center">
                      <Leaf className="mx-auto mb-1 h-4 w-4 text-primary" />
                      <p className="text-xs text-muted-foreground">Plant</p>
                      <p className="text-sm font-semibold">{result.plantType}</p>
                    </div>
                    <div className="rounded-lg bg-accent/50 p-3 text-center">
                      <Bug className="mx-auto mb-1 h-4 w-4 text-warning" />
                      <p className="text-xs text-muted-foreground">Affected</p>
                      <p className="text-sm font-semibold">{result.affectedArea}</p>
                    </div>
                    <div className="rounded-lg bg-accent/50 p-3 text-center">
                      <AlertTriangle className={`mx-auto mb-1 h-4 w-4 ${spreadColor(result.spreadRisk)}`} />
                      <p className="text-xs text-muted-foreground">Spread Risk</p>
                      <p className={`text-sm font-semibold ${spreadColor(result.spreadRisk)}`}>{result.spreadRisk}</p>
                    </div>
                  </div>

                  {/* Download Button */}
                  <Button onClick={downloadReport} variant="outline" className="w-full gap-2">
                    <Download className="h-4 w-4" /> Download Report (with image)
                  </Button>
                </CardContent>
              </Card>

              {/* Treatment Plan */}
              {result.treatments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-display text-lg">
                      <Pill className="h-5 w-5 text-success" /> Treatment Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {result.treatments.map((t, i) => (
                        <li key={i} className="flex gap-3 text-sm">
                          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Organic Alternatives */}
              {result.organicAlternatives.length > 0 && (
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-display text-lg">
                      <Droplets className="h-5 w-5 text-primary" /> Organic Alternatives
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {result.organicAlternatives.map((o, i) => (
                        <li key={i} className="flex gap-3 text-sm">
                          <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Prevention */}
              {result.prevention.length > 0 && (
                <Card className="bg-accent/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-display text-lg">
                      <Shield className="h-5 w-5 text-primary" /> Prevention Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {result.prevention.map((p, i) => (
                        <li key={i} className="flex gap-3 text-sm">
                          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Empty state */}
          {!diagnosing && !result && !notLeafMsg && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center p-16 text-center">
                <div className="mb-4 rounded-full bg-accent p-4">
                  <Sparkles className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="font-display text-lg font-semibold text-muted-foreground">Awaiting image</p>
                <p className="mt-1 text-sm text-muted-foreground/60">Upload a leaf photo to start real AI analysis</p>
                <div className="mt-6 grid grid-cols-3 gap-4 text-center text-xs text-muted-foreground/60">
                  <div><Leaf className="mx-auto mb-1 h-4 w-4" />Species ID</div>
                  <div><Bug className="mx-auto mb-1 h-4 w-4" />Disease Detection</div>
                  <div><Pill className="mx-auto mb-1 h-4 w-4" />Treatment Plan</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    const test = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export default Diagnose;
