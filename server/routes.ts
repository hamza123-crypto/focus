import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import path from "path";
import { mkdir } from "fs/promises";
import express from "express";
import {
  insertProjectSchema,
  insertTaskSchema,
  insertMessageSchema,
  insertPostSchema,
  insertCommentSchema,
  insertFileSchema,
  insertJoinRequestSchema,
  insertNotificationSchema,
} from "@shared/schema";

// File upload configuration
const uploadDir = path.join(process.cwd(), "uploads");
mkdir(uploadDir, { recursive: true }).catch(console.error);

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + "-" + file.originalname);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Middleware to check if user is authenticated
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "غير مصرح" });
    }
    next();
  };

  // Middleware to check project membership
  const requireProjectMember = async (req: any, res: any, next: any) => {
    try {
      const projectId = parseInt(req.params.id || req.body.projectId);
      const isMember = await storage.isProjectMember(projectId, req.user!.id);
      if (!isMember) {
        return res.status(403).json({ message: "غير مسموح - ليس عضواً في المشروع" });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  };

  // ============================================
  // USER ROUTES
  // ============================================
  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.put("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (userId !== req.user?.id) {
        return res.status(403).json({ message: "غير مسموح" });
      }
      
      const user = await storage.updateUser(userId, req.body);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.get("/api/users/:id/projects", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const projects = await storage.getUserProjects(userId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // ============================================
  // PROJECT ROUTES
  // ============================================
  app.get("/api/projects/my", requireAuth, async (req, res) => {
    try {
      const projects = await storage.getUserProjects(req.user!.id);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.get("/api/projects/public", requireAuth, async (req, res) => {
    try {
      const projects = await storage.getProjects({ isPublic: true });
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.get("/api/projects/:id", requireAuth, requireProjectMember, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "المشروع غير موجود" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.post("/api/projects", requireAuth, async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject({
        ...validatedData,
        creatorId: req.user!.id,
      });
      res.status(201).json(project);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.put("/api/projects/:id", requireAuth, requireProjectMember, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      // Check if user is project owner
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "المشروع غير موجود" });
      }
      if (project.creatorId !== req.user!.id) {
        return res.status(403).json({ message: "غير مسموح - فقط منشئ المشروع يمكنه تعديله" });
      }
      
      // Validate request body
      const validatedData = insertProjectSchema
        .partial()
        .parse(req.body);
      
      const updatedProject = await storage.updateProject(projectId, validatedData);
      res.json(updatedProject);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.get("/api/projects/:id/members", requireAuth, requireProjectMember, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const members = await storage.getProjectMembers(projectId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.post("/api/projects/:id/members", requireAuth, requireProjectMember, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      // Check if user is project owner or admin
      const userMembership = await storage.getProjectMembership(projectId, req.user!.id);
      if (!userMembership || (userMembership.role !== "owner" && userMembership.role !== "admin")) {
        return res.status(403).json({ message: "غير مسموح - فقط المشرفون يمكنهم إضافة أعضاء" });
      }
      
      // Validate role
      const { userId, role } = req.body;
      if (!userId || !role || !["member", "admin"].includes(role)) {
        return res.status(400).json({ message: "بيانات غير صحيحة - يجب تحديد userId و role صحيح" });
      }
      
      const member = await storage.addProjectMember({
        projectId,
        userId,
        role,
      });
      res.status(201).json(member);
    } catch (error) {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // ============================================
  // TASK ROUTES
  // ============================================
  app.get("/api/tasks/my", requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getUserTasks(req.user!.id);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.get("/api/projects/:id/tasks", requireAuth, requireProjectMember, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const tasks = await storage.getTasks(projectId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.get("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "المهمة غير موجودة" });
      }
      
      // Check if user is project member
      const isMember = await storage.isProjectMember(task.projectId, req.user!.id);
      if (!isMember) {
        return res.status(403).json({ message: "غير مسموح" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.post("/api/tasks", requireAuth, async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertTaskSchema.parse(req.body);
      
      // Check if user is project member
      const isMember = await storage.isProjectMember(validatedData.projectId, req.user!.id);
      if (!isMember) {
        return res.status(403).json({ message: "غير مسموح" });
      }
      
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.put("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "المهمة غير موجودة" });
      }
      
      // Check if user is project member
      const isMember = await storage.isProjectMember(task.projectId, req.user!.id);
      if (!isMember) {
        return res.status(403).json({ message: "غير مسموح" });
      }
      
      // Validate request body
      const validatedData = insertTaskSchema
        .partial()
        .parse(req.body);
      
      const updatedTask = await storage.updateTask(taskId, validatedData);
      res.json(updatedTask);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // ============================================
  // MESSAGE ROUTES (Chat)
  // ============================================
  app.get("/api/projects/:id/messages", requireAuth, requireProjectMember, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const messages = await storage.getMessages(projectId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertMessageSchema.parse(req.body);
      
      // Check if user is project member
      const isMember = await storage.isProjectMember(validatedData.projectId, req.user!.id);
      if (!isMember) {
        return res.status(403).json({ message: "غير مسموح" });
      }
      
      const message = await storage.createMessage({
        ...validatedData,
        senderId: req.user!.id,
      });
      res.status(201).json(message);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // ============================================
  // POST ROUTES
  // ============================================
  app.get("/api/posts", requireAuth, async (req, res) => {
    try {
      const posts = await storage.getPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.post("/api/posts", requireAuth, async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertPostSchema.parse(req.body);
      const post = await storage.createPost({
        ...validatedData,
        authorId: req.user!.id,
      });
      res.status(201).json(post);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.get("/api/posts/:id/comments", requireAuth, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const comments = await storage.getComments(postId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.post("/api/comments", requireAuth, async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertCommentSchema.parse(req.body);
      
      const comment = await storage.createComment({
        postId: validatedData.postId,
        content: validatedData.content,
        authorId: req.user!.id,
      });
      res.status(201).json(comment);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      console.error("Comment error:", error);
      res.status(500).json({ message: "خطأ في الخادم", error: error.message });
    }
  });

  // ============================================
  // FILE ROUTES
  // ============================================
  app.get("/api/projects/:id/files", requireAuth, requireProjectMember, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const files = await storage.getFiles(projectId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.post("/api/files/upload", requireAuth, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "لم يتم رفع أي ملف" });
      }

      const projectId = parseInt(req.body.projectId);
      
      // Check if user is project member
      const isMember = await storage.isProjectMember(projectId, req.user!.id);
      if (!isMember) {
        return res.status(403).json({ message: "غير مسموح" });
      }

      const file = await storage.createFile({
        projectId,
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        fileSize: req.file.size,
        uploadedById: req.user!.id,
      });

      res.status(201).json(file);
    } catch (error) {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // Serve uploaded files - mount static middleware once
  const staticHandler = express.static(uploadDir);
  app.use("/uploads", requireAuth, staticHandler);

  // ============================================
  // WHITEBOARD ROUTES
  // ============================================
  app.get("/api/projects/:id/whiteboard", requireAuth, requireProjectMember, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const whiteboard = await storage.getWhiteboard(projectId);
      res.json(whiteboard || { projectId, data: {} });
    } catch (error) {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.put("/api/projects/:id/whiteboard", requireAuth, requireProjectMember, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const whiteboard = await storage.updateWhiteboard(projectId, req.body.data);
      res.json(whiteboard);
    } catch (error) {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // ============================================
  // JOIN REQUEST ROUTES
  // ============================================
  app.post("/api/join-request", requireAuth, async (req, res) => {
    try {
      const { projectId } = req.body;
      if (!projectId) {
        return res.status(400).json({ message: "projectId مطلوب" });
      }

      // Check if user is already a member
      const isMember = await storage.isProjectMember(projectId, req.user!.id);
      if (isMember) {
        return res.status(400).json({ message: "أنت بالفعل عضو في هذا المشروع" });
      }

      // Create join request
      const joinRequest = await storage.createJoinRequest({
        projectId,
        userId: req.user!.id,
      });

      // Get project creator
      const project = await storage.getProject(projectId);
      if (project) {
        // Send notification to project creator
        await storage.createNotification({
          recipientId: project.creatorId,
          type: "join_request",
          fromUserId: req.user!.id,
          projectId,
          message: `طلب انضمام جديد من ${req.user!.fullName} للمشروع "${project.name}"`,
        });
      }

      res.status(201).json(joinRequest);
    } catch (error: any) {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.post("/api/join-request/:id/accept", requireAuth, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const joinRequest = await storage.updateJoinRequest(requestId, "approved");
      
      if (!joinRequest) {
        return res.status(404).json({ message: "الطلب غير موجود" });
      }

      // Add user to project as member
      await storage.addProjectMember({
        projectId: joinRequest.projectId,
        userId: joinRequest.userId,
        role: "member",
      });

      // Send notification to user
      const project = await storage.getProject(joinRequest.projectId);
      if (project) {
        await storage.createNotification({
          recipientId: joinRequest.userId,
          type: "join_approved",
          fromUserId: req.user!.id,
          projectId: joinRequest.projectId,
          message: `تم قبول طلب انضمامك للمشروع "${project.name}"`,
        });
      }

      res.json(joinRequest);
    } catch (error) {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.post("/api/join-request/:id/reject", requireAuth, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const joinRequest = await storage.updateJoinRequest(requestId, "rejected");
      
      if (!joinRequest) {
        return res.status(404).json({ message: "الطلب غير موجود" });
      }

      // Send notification to user
      const project = await storage.getProject(joinRequest.projectId);
      if (project) {
        await storage.createNotification({
          recipientId: joinRequest.userId,
          type: "join_request",
          fromUserId: req.user!.id,
          projectId: joinRequest.projectId,
          message: `تم رفض طلب انضمامك للمشروع "${project.name}"`,
        });
      }

      res.json(joinRequest);
    } catch (error) {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // ============================================
  // NOTIFICATION ROUTES
  // ============================================
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getNotifications(req.user!.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // ============================================
  // WebSocket Setup for Real-time features
  // ============================================
  // Use the existing server passed from app.ts
  const wss = new WebSocketServer({ noServer: true, path: '/ws' });
  
  // Upgrade HTTP connections to WebSocket when needed
  app.on('upgrade', (request: any, socket: any, head: any) => {
    if (request.url === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // Store WebSocket connections by project
  const projectConnections = new Map<number, Set<WebSocket>>();

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('New WebSocket connection');
    let currentProjectId: number | undefined;

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle join project
        if (data.type === 'join_project' || data.type === 'join_whiteboard') {
          currentProjectId = data.projectId;
          
          if (currentProjectId !== undefined) {
            if (!projectConnections.has(currentProjectId)) {
              projectConnections.set(currentProjectId, new Set());
            }
            projectConnections.get(currentProjectId)!.add(ws);
            console.log(`Client joined project ${currentProjectId}`);
          }
        }
        // Handle messages
        else if (data.type === 'new_message' || data.type === 'draw') {
          const projectId = data.projectId;
          
          // Broadcast only to clients in the same project
          const clients = projectConnections.get(projectId);
          if (clients) {
            clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN && client !== ws) {
                client.send(JSON.stringify(data));
              }
            });
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      
      // Remove from project connections
      if (currentProjectId !== undefined) {
        const clients = projectConnections.get(currentProjectId);
        if (clients) {
          clients.delete(ws);
          if (clients.size === 0 && currentProjectId !== undefined) {
            projectConnections.delete(currentProjectId);
          }
        }
      }
    });
  });

  // Return the express app server
  return app.listen();
}
