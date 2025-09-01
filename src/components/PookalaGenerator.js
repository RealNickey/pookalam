"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

// Traditional Onam color palettes
const COLOR_PALETTES = [
  {
    name: "Traditional",
    colors: [
      "#FF6B35",
      "#F7931E",
      "#FFD23F",
      "#06FFA5",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FECA57",
    ],
  },
  {
    name: "Vibrant",
    colors: [
      "#E74C3C",
      "#F39C12",
      "#F1C40F",
      "#2ECC71",
      "#1ABC9C",
      "#3498DB",
      "#9B59B6",
      "#E67E22",
    ],
  },
  {
    name: "Royal",
    colors: [
      "#8E44AD",
      "#3498DB",
      "#E74C3C",
      "#F39C12",
      "#2ECC71",
      "#E67E22",
      "#34495E",
      "#95A5A6",
    ],
  },
  {
    name: "Sunset",
    colors: [
      "#FF7675",
      "#FDCB6E",
      "#E17055",
      "#00B894",
      "#00CEC9",
      "#74B9FF",
      "#A29BFE",
      "#FD79A8",
    ],
  },
];

const PookalaGenerator = () => {
  const canvasRef = useRef(null);
  const faceCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [currentPalette, setCurrentPalette] = useState(0);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [processedFace, setProcessedFace] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [size, setSize] = useState(600);

  // --- Geometry helpers (polar coordinates) ---
  const polar = (cx, cy, r, theta) => ({
    x: cx + r * Math.cos(theta),
    y: cy + r * Math.sin(theta),
  });

  const drawTriangle = (
    ctx,
    cx,
    cy,
    baseAngle,
    rOuter,
    rInner,
    halfWidth,
    fill,
    stroke
  ) => {
    // Apex pointing outward at rOuter, base at rInner with lateral spread by halfWidth
    const apex = polar(cx, cy, rOuter, baseAngle);
    const baseLeft = polar(cx, cy, rInner, baseAngle - halfWidth);
    const baseRight = polar(cx, cy, rInner, baseAngle + halfWidth);
    ctx.beginPath();
    ctx.moveTo(apex.x, apex.y);
    ctx.lineTo(baseLeft.x, baseLeft.y);
    ctx.lineTo(baseRight.x, baseRight.y);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  };

  const drawDiamond = (
    ctx,
    cx,
    cy,
    baseAngle,
    rOuter,
    rInner,
    sideOffset,
    fill,
    stroke
  ) => {
    // Four points: top (outer), right (mid + side), bottom (inner), left (mid - side)
    const top = polar(cx, cy, rOuter, baseAngle);
    const bottom = polar(cx, cy, rInner, baseAngle + Math.PI);
    const right = polar(
      cx,
      cy,
      (rOuter + rInner) / 2,
      baseAngle + Math.PI / 2 + sideOffset
    );
    const left = polar(
      cx,
      cy,
      (rOuter + rInner) / 2,
      baseAngle - Math.PI / 2 - sideOffset
    );
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(right.x, right.y);
    ctx.lineTo(bottom.x, bottom.y);
    ctx.lineTo(left.x, left.y);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  };

  // Generate Pookalam pattern
  const generatePookalam = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.9;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const palette = COLOR_PALETTES[currentPalette].colors;
    const layers = 8;
    const petalsPerLayer = 12;

    // Base: fully fill the circular area with a vivid radial gradient
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.clip();
    const grad = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      maxRadius
    );
    const stops = palette.length - 1;
    palette.forEach((color, i) => {
      grad.addColorStop(stops === 0 ? 1 : i / stops, color);
    });
    ctx.fillStyle = grad;
    ctx.fillRect(
      centerX - maxRadius,
      centerY - maxRadius,
      maxRadius * 2,
      maxRadius * 2
    );
    ctx.restore();

    // Decorative outer triangle ring
    const triCount = 54;
    const triOuter = maxRadius * 0.98;
    const triInner = maxRadius * 0.8;
    const triHalfWidth = ((2 * Math.PI) / triCount / 2) * 0.9; // angular half width
    ctx.lineWidth = 1.5;
    for (let i = 0; i < triCount; i++) {
      const angle = (i * 2 * Math.PI) / triCount;
      const color = palette[i % palette.length];
      drawTriangle(
        ctx,
        centerX,
        centerY,
        angle,
        triOuter,
        triInner,
        triHalfWidth,
        color,
        "#ffffff20"
      );
    }

    // Middle diamond ring
    const diaCount = 36;
    const diaOuter = maxRadius * 0.7;
    const diaInner = maxRadius * 0.52;
    const sideOffset = 0; // symmetric
    for (let i = 0; i < diaCount; i++) {
      const angle = (i * 2 * Math.PI) / diaCount;
      const color = palette[(i + 2) % palette.length];
      drawDiamond(
        ctx,
        centerX,
        centerY,
        angle,
        diaOuter,
        diaInner,
        sideOffset,
        color,
        "#00000010"
      );
    }

    // Draw concentric layers
    for (let layer = layers; layer >= 1; layer--) {
      const radius = (maxRadius / layers) * layer;
      const colorIndex = (layer - 1) % palette.length;
      const color = palette[colorIndex];

      // Skip the innermost layer if we have a face
      if (layer === 1 && processedFace) continue;

      ctx.fillStyle = color;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;

      // Draw petals in a circular pattern
      for (let i = 0; i < petalsPerLayer; i++) {
        const angle = (i * 2 * Math.PI) / petalsPerLayer;
        const petalRadius = (radius / layers) * 0.8;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);

        // Draw petal shape
        ctx.beginPath();
        ctx.ellipse(
          radius * 0.7,
          0,
          petalRadius,
          petalRadius * 0.6,
          0,
          0,
          2 * Math.PI
        );
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      }

      // Add decorative inner circle for each layer to increase coverage/texture
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.35, 0, 2 * Math.PI);
      ctx.fillStyle = palette[(colorIndex + 2) % palette.length];
      ctx.fill();
      ctx.stroke();
    }

    // Draw center face if available
    if (processedFace) {
      const faceRadius = (maxRadius / layers) * 1.2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, faceRadius, 0, 2 * Math.PI);
      ctx.clip();

      ctx.drawImage(
        processedFace,
        centerX - faceRadius,
        centerY - faceRadius,
        faceRadius * 2,
        faceRadius * 2
      );
      ctx.restore();

      // Add decorative border around face
      ctx.beginPath();
      ctx.arc(centerX, centerY, faceRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = palette[0];
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  }, [currentPalette, processedFace]);

  // Process uploaded face image
  const processFaceImage = useCallback((imageFile) => {
    setIsProcessing(true);

    const img = new Image();
    img.onload = () => {
      const faceCanvas = faceCanvasRef.current;
      const ctx = faceCanvas.getContext("2d");

      // Set canvas size
      const size = 300;
      faceCanvas.width = size;
      faceCanvas.height = size;

      // Draw and crop image to circle
      const scale = Math.max(size / img.width, size / img.height);
      const x = (size - img.width * scale) / 2;
      const y = (size - img.height * scale) / 2;

      ctx.clearRect(0, 0, size, size);
      ctx.save();

      // Create circular clipping path
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
      ctx.clip();

      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      ctx.restore();

      // Apply stylization effect
      stylizeFace(ctx, size);

      setProcessedFace(faceCanvas);
      setIsProcessing(false);
    };

    img.src = URL.createObjectURL(imageFile);
  }, []);

  // Stylize face to match Pookalam aesthetic
  const stylizeFace = (ctx, size) => {
    const palette = COLOR_PALETTES[currentPalette].colors;
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;

    // Apply color quantization and dithering effect
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3];

      if (alpha > 0) {
        // Find closest color in palette
        let closestColor = palette[0];
        let minDistance = Infinity;

        palette.forEach((color) => {
          const hexR = parseInt(color.slice(1, 3), 16);
          const hexG = parseInt(color.slice(3, 5), 16);
          const hexB = parseInt(color.slice(5, 7), 16);

          const distance = Math.sqrt(
            Math.pow(r - hexR, 2) +
              Math.pow(g - hexG, 2) +
              Math.pow(b - hexB, 2)
          );

          if (distance < minDistance) {
            minDistance = distance;
            closestColor = color;
          }
        });

        // Apply the closest color with some dithering
        const hexR = parseInt(closestColor.slice(1, 3), 16);
        const hexG = parseInt(closestColor.slice(3, 5), 16);
        const hexB = parseInt(closestColor.slice(5, 7), 16);

        data[i] = hexR;
        data[i + 1] = hexG;
        data[i + 2] = hexB;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setUploadedImage(file);
      processFaceImage(file);
      toast.success("Photo uploaded!", {
        description: "We stylized it to match the rangoli vibes.",
      });
    }
  };

  // Randomize colors
  const randomizeColors = () => {
    setCurrentPalette((prev) => (prev + 1) % COLOR_PALETTES.length);

    // Re-process face if available
    if (uploadedImage) {
      processFaceImage(uploadedImage);
    }
  };

  // Download final image
  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = "onam-pookalam.png";
    link.href = canvas.toDataURL();
    link.click();
    toast("Your Pookalam is ready!", {
      description: "Saved as onam-pookalam.png",
    });
  };

  // Generate initial Pookalam
  useEffect(() => {
    generatePookalam();
  }, [generatePookalam, size]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-3xl">
                  🌸 Onam Pookalam Generator
                </CardTitle>
                <CardDescription>
                  Create a vibrant rangoli with your photo at the center.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-sm">
                Bright & Festive
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Controls */}
            <div className="flex flex-wrap items-end gap-4 mb-6">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                    >
                      📁 Upload Photo
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Choose a clear, front-facing photo
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="grid gap-2">
                <Label htmlFor="palette">Palette</Label>
                <Select
                  value={String(currentPalette)}
                  onValueChange={(v) => setCurrentPalette(Number(v))}
                >
                  <SelectTrigger id="palette" className="w-[200px]">
                    <SelectValue placeholder="Select palette" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_PALETTES.map((p, idx) => (
                      <SelectItem key={p.name} value={String(idx)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="size">Canvas Size</Label>
                <Select
                  value={String(size)}
                  onValueChange={(v) => setSize(Number(v))}
                >
                  <SelectTrigger id="size" className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[400, 600, 800].map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s} × {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="ml-auto flex gap-2">
                <Button variant="secondary" onClick={randomizeColors}>
                  🎲 Randomize
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={downloadImage}>⬇️ Download</Button>
                    </TooltipTrigger>
                    <TooltipContent>Save your Pookalam as PNG</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Current palette info */}
            <div className="text-center mb-4">
              <p className="text-muted-foreground mb-2">
                Current Palette:{" "}
                <span className="font-semibold">
                  {COLOR_PALETTES[currentPalette].name}
                </span>
              </p>
              <div className="flex justify-center gap-2">
                {COLOR_PALETTES[currentPalette].colors.map((color, index) => (
                  <div
                    key={index}
                    className="w-6 h-6 rounded-full border shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Canvas */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={size}
                  height={size}
                  className="border rounded-lg shadow bg-card max-w-full h-auto"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                    <div className="text-white text-sm">Processing face...</div>
                  </div>
                )}
              </div>
            </div>

            {/* Hidden canvas for face processing */}
            <canvas ref={faceCanvasRef} className="hidden" />

            {/* Progress hint (shows while processing) */}
            {isProcessing ? (
              <div className="grid gap-2">
                <Label>Stylizing</Label>
                <Progress value={70} />
              </div>
            ) : null}

            {/* Instructions */}
            <div className="text-center text-muted-foreground max-w-2xl mx-auto mt-6">
              <h3 className="font-semibold mb-2">How to use</h3>
              <ol className="text-sm space-y-1">
                <li>1. Upload a front-facing photo for the center</li>
                <li>2. Try different color palettes or hit Randomize</li>
                <li>3. Download your beautiful Onam Pookalam!</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PookalaGenerator;
