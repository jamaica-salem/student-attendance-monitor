import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as blazeface from "@tensorflow-models/blazeface";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, CameraOff, Eye, EyeOff, Users, Clock, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AttendanceLog {
  timestamp: Date;
  count: number;
  event: "appeared" | "disappeared" | "change";
}

const WebcamDetector = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<blazeface.BlazeFaceModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [attendanceMode, setAttendanceMode] = useState(false);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [fps, setFps] = useState(0);
  const [avgCount, setAvgCount] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();
  const lastCountRef = useRef(0);
  const countHistoryRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef(Date.now());
  const { toast } = useToast();

  // Load BlazeFace model
  useEffect(() => {
    const loadModel = async () => {
      setIsLoading(true);
      try {
        await tf.ready();
        const loadedModel = await blazeface.load();
        setModel(loadedModel);
        toast({
          title: "Model Loaded",
          description: "BlazeFace detection ready!",
        });
      } catch (error) {
        console.error("Error loading model:", error);
        toast({
          title: "Error",
          description: "Failed to load detection model",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadModel();
  }, [toast]);

  // Start camera
  const startCamera = async () => {
    if (!model) {
      toast({
        title: "Model Not Ready",
        description: "Please wait for the model to load",
        variant: "destructive",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        toast({
          title: "Camera Started",
          description: "Detection is now active",
        });
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera Error",
        description: "Could not access webcam",
        variant: "destructive",
      });
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsCameraActive(false);
    setFaceCount(0);
    toast({
      title: "Camera Stopped",
      description: "Detection paused",
    });
  };

  // Detection loop
  useEffect(() => {
    if (!isCameraActive || !model || !videoRef.current || !canvasRef.current) {
      return;
    }

    const detectFaces = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      // Calculate FPS
      const now = Date.now();
      const elapsed = now - lastFrameTimeRef.current;
      const currentFps = Math.round(1000 / elapsed);
      lastFrameTimeRef.current = now;
      setFps(currentFps);

      const predictions = await model.estimateFaces(video, false);
      const count = predictions.length;

      // Update count with smooth transition
      setFaceCount(count);

      // Track count history for average
      countHistoryRef.current.push(count);
      if (countHistoryRef.current.length > 30) {
        countHistoryRef.current.shift();
      }
      const avg =
        countHistoryRef.current.reduce((a, b) => a + b, 0) /
        countHistoryRef.current.length;
      setAvgCount(Math.round(avg * 10) / 10);

      // Attendance logging
      if (attendanceMode && count !== lastCountRef.current) {
        const event =
          count > lastCountRef.current
            ? "appeared"
            : count < lastCountRef.current
            ? "disappeared"
            : "change";
        setAttendanceLogs((prev) => [
          { timestamp: new Date(), count, event },
          ...prev.slice(0, 9),
        ]);
      }
      lastCountRef.current = count;

      // Draw overlay
      if (showOverlay && canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          predictions.forEach((prediction) => {
            const start = prediction.topLeft as [number, number];
            const end = prediction.bottomRight as [number, number];
            const size = [end[0] - start[0], end[1] - start[1]];

            // Draw bounding box with glow
            ctx.strokeStyle = "#06b6d4";
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#06b6d4";
            ctx.strokeRect(start[0], start[1], size[0], size[1]);

            // Draw corner accents
            const cornerSize = 20;
            ctx.lineWidth = 4;
            // Top-left
            ctx.beginPath();
            ctx.moveTo(start[0], start[1] + cornerSize);
            ctx.lineTo(start[0], start[1]);
            ctx.lineTo(start[0] + cornerSize, start[1]);
            ctx.stroke();
            // Top-right
            ctx.beginPath();
            ctx.moveTo(end[0] - cornerSize, start[1]);
            ctx.lineTo(end[0], start[1]);
            ctx.lineTo(end[0], start[1] + cornerSize);
            ctx.stroke();
            // Bottom-left
            ctx.beginPath();
            ctx.moveTo(start[0], end[1] - cornerSize);
            ctx.lineTo(start[0], end[1]);
            ctx.lineTo(start[0] + cornerSize, end[1]);
            ctx.stroke();
            // Bottom-right
            ctx.beginPath();
            ctx.moveTo(end[0] - cornerSize, end[1]);
            ctx.lineTo(end[0], end[1]);
            ctx.lineTo(end[0], end[1] - cornerSize);
            ctx.stroke();
          });
        }
      }

      animationRef.current = requestAnimationFrame(detectFaces);
    };

    detectFaces();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isCameraActive, model, showOverlay, attendanceMode]);

  const getCountText = () => {
    if (faceCount === 0) return "No students detected";
    if (faceCount === 1) return "1 student detected";
    return `${faceCount} students detected`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-6">
      {/* Header */}
      <div className="text-center space-y-3 animate-fade-in">
        <h1 className="text-5xl font-bold gradient-text">
          AI Student Detection System
        </h1>
        <p className="text-muted-foreground text-lg">
          Real-time face detection powered by TensorFlow.js
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl">
        {/* Main Video Card */}
        <Card className="flex-1 glass-card p-6 space-y-6 animate-scale-in">
          {/* Video Container */}
          <div className="relative rounded-lg overflow-hidden bg-secondary/50 aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
            />
            {!isCameraActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-secondary/80 backdrop-blur-sm">
                <div className="text-center space-y-3">
                  <Camera className="w-16 h-16 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {isLoading ? "Loading model..." : "Camera inactive"}
                  </p>
                  {isLoading && (
                    <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden mx-auto">
                      <div className="h-full bg-gradient-primary animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Count Display */}
          <div className="text-center p-6 rounded-lg bg-gradient-primary/10 border border-primary/20">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Users className="w-8 h-8 text-accent" />
              <p className="text-5xl font-bold text-primary animate-scale-in">
                {faceCount}
              </p>
            </div>
            <p className="text-xl text-foreground font-medium">{getCountText()}</p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              onClick={isCameraActive ? stopCamera : startCamera}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary transition-all"
              size="lg"
            >
              {isCameraActive ? (
                <>
                  <CameraOff className="mr-2 h-5 w-5" />
                  Stop Camera
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-5 w-5" />
                  Start Camera
                </>
              )}
            </Button>

            <Button
              onClick={() => setShowOverlay(!showOverlay)}
              disabled={!isCameraActive}
              variant="secondary"
              size="lg"
            >
              {showOverlay ? (
                <>
                  <EyeOff className="mr-2 h-5 w-5" />
                  Hide Overlay
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-5 w-5" />
                  Show Overlay
                </>
              )}
            </Button>

            <Button
              onClick={() => setAttendanceMode(!attendanceMode)}
              disabled={!isCameraActive}
              variant={attendanceMode ? "default" : "outline"}
              size="lg"
              className={attendanceMode ? "bg-accent text-accent-foreground glow-accent" : ""}
            >
              <Clock className="mr-2 h-5 w-5" />
              {attendanceMode ? "Attendance: ON" : "Attendance: OFF"}
            </Button>
          </div>
        </Card>

        {/* Insights Panel */}
        <Card className="lg:w-80 glass-card p-6 space-y-6 animate-fade-in">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Activity className="w-6 h-6 text-accent" />
              Insights
            </h2>
            <p className="text-sm text-muted-foreground">Real-time statistics</p>
          </div>

          {/* Stats */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <p className="text-sm text-muted-foreground mb-1">Detection FPS</p>
              <p className="text-3xl font-bold text-primary">{fps}</p>
            </div>

            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <p className="text-sm text-muted-foreground mb-1">Average Count</p>
              <p className="text-3xl font-bold text-accent">{avgCount}</p>
            </div>

            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isCameraActive ? "bg-accent animate-pulse-slow" : "bg-muted"
                  }`}
                />
                <p className="text-sm font-medium">
                  {isCameraActive ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
          </div>

          {/* Attendance Logs */}
          {attendanceMode && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Attendance Log</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {attendanceLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No events yet
                  </p>
                ) : (
                  attendanceLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-secondary/50 border border-border text-sm"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium">
                          {log.count} student{log.count !== 1 ? "s" : ""}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            log.event === "appeared"
                              ? "bg-accent/20 text-accent"
                              : "bg-destructive/20 text-destructive"
                          }`}
                        >
                          {log.event}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {log.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default WebcamDetector;
