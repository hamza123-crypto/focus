import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Pencil, 
  Square, 
  Circle, 
  Type, 
  Eraser,
  Trash2,
  Download
} from "lucide-react";

interface ProjectWhiteboardProps {
  projectId: number;
}

export function ProjectWhiteboard({ projectId }: ProjectWhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // WebSocket connection for real-time collaboration
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("Whiteboard WebSocket connected");
      ws.send(JSON.stringify({ type: "join_whiteboard", projectId }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "draw" && data.projectId === projectId) {
        // Draw remote user's strokes
        drawLine(ctx, data.fromX, data.fromY, data.toX, data.toY, data.tool);
      }
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [projectId]);

  const drawLine = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    currentTool: "pen" | "eraser"
  ) => {
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = currentTool === "pen" ? "#000" : "#fff";
    ctx.lineWidth = currentTool === "pen" ? 2 : 10;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prevX = e.clientX - e.movementX - rect.left;
    const prevY = e.clientY - e.movementY - rect.top;

    drawLine(ctx, prevX, prevY, x, y, tool);

    // Send to other users via WebSocket
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "draw",
        projectId,
        fromX: prevX,
        fromY: prevY,
        toX: x,
        toY: y,
        tool,
      }));
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>الوايت بورد التفاعلي</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={tool === "pen" ? "default" : "outline"}
              size="icon"
              onClick={() => setTool("pen")}
              data-testid="tool-pen"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === "eraser" ? "default" : "outline"}
              size="icon"
              onClick={() => setTool("eraser")}
              data-testid="tool-eraser"
            >
              <Eraser className="h-4 w-4" />
            </Button>
            <div className="w-px bg-border mx-1" />
            <Button variant="outline" size="icon" onClick={clearCanvas} data-testid="button-clear-canvas">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <canvas
          ref={canvasRef}
          className="w-full h-full bg-white cursor-crosshair border-t"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          data-testid="whiteboard-canvas"
        />
      </CardContent>
    </Card>
  );
}
