import { 
  users, 
  projects,
  projectMembers,
  tasks,
  taskAttachments,
  messages,
  posts,
  comments,
  files,
  whiteboards,
  joinRequests,
  notifications,
  type User,
  type InsertUser,
  type Project,
  type InsertProject,
  type ProjectMember,
  type InsertProjectMember,
  type Task,
  type InsertTask,
  type TaskAttachment,
  type InsertTaskAttachment,
  type Message,
  type InsertMessage,
  type Post,
  type InsertPost,
  type Comment,
  type InsertComment,
  type File,
  type InsertFile,
  type Whiteboard,
  type InsertWhiteboard,
  type JoinRequest,
  type InsertJoinRequest,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  
  // Project methods
  getProject(id: number): Promise<any | undefined>;
  getProjects(options?: { isPublic?: boolean; creatorId?: number }): Promise<any[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, data: Partial<InsertProject>): Promise<Project | undefined>;
  
  // Project Member methods
  getProjectMembers(projectId: number): Promise<any[]>;
  addProjectMember(member: InsertProjectMember): Promise<ProjectMember>;
  getUserProjects(userId: number): Promise<any[]>;
  isProjectMember(projectId: number, userId: number): Promise<boolean>;
  getProjectMembership(projectId: number, userId: number): Promise<ProjectMember | undefined>;
  
  // Task methods
  getTasks(projectId: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, data: Partial<InsertTask>): Promise<Task | undefined>;
  getUserTasks(userId: number): Promise<Task[]>;
  
  // Message methods
  getMessages(projectId: number): Promise<any[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Post methods
  getPosts(): Promise<any[]>;
  createPost(post: InsertPost): Promise<Post>;
  
  // Comment methods
  getComments(postId: number): Promise<any[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // File methods
  getFiles(projectId: number): Promise<any[]>;
  createFile(file: InsertFile): Promise<File>;
  
  // Whiteboard methods
  getWhiteboard(projectId: number): Promise<Whiteboard | undefined>;
  updateWhiteboard(projectId: number, data: any): Promise<Whiteboard>;
  
  // Join Request methods
  createJoinRequest(request: InsertJoinRequest): Promise<JoinRequest>;
  getJoinRequests(projectId: number): Promise<any[]>;
  getUserJoinRequests(userId: number): Promise<any[]>;
  updateJoinRequest(requestId: number, status: string): Promise<JoinRequest | undefined>;
  
  // Notification methods
  createNotification(notif: InsertNotification): Promise<Notification>;
  getNotifications(recipientId: number): Promise<any[]>;
  markNotificationAsRead(notificationId: number): Promise<void>;
  
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Project methods
  async getProject(id: number): Promise<any | undefined> {
    const [project] = await db.query.projects.findMany({
      where: eq(projects.id, id),
      with: {
        creator: true,
        members: {
          with: {
            user: true,
          },
        },
      },
    });
    return project || undefined;
  }

  async getProjects(options?: { isPublic?: boolean; creatorId?: number }): Promise<any[]> {
    let conditions: any[] = [];
    
    if (options?.isPublic !== undefined) {
      conditions.push(eq(projects.isPublic, options.isPublic));
    }
    if (options?.creatorId) {
      conditions.push(eq(projects.creatorId, options.creatorId));
    }

    return await db.query.projects.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        creator: true,
        members: {
          with: {
            user: true,
          },
        },
      },
      orderBy: [desc(projects.createdAt)],
    });
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    
    // Add creator as owner
    await db.insert(projectMembers).values({
      projectId: project.id,
      userId: insertProject.creatorId,
      role: "owner",
    });
    
    return project;
  }

  async updateProject(id: number, data: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project || undefined;
  }

  // Project Member methods
  async getProjectMembers(projectId: number): Promise<any[]> {
    return await db.query.projectMembers.findMany({
      where: eq(projectMembers.projectId, projectId),
      with: {
        user: true,
      },
    });
  }

  async addProjectMember(member: InsertProjectMember): Promise<ProjectMember> {
    const [newMember] = await db
      .insert(projectMembers)
      .values(member)
      .returning();
    return newMember;
  }

  async getUserProjects(userId: number): Promise<any[]> {
    const userMemberships = await db.query.projectMembers.findMany({
      where: eq(projectMembers.userId, userId),
      with: {
        project: {
          with: {
            creator: true,
          },
        },
      },
    });
    
    return userMemberships.map(m => m.project);
  }

  async isProjectMember(projectId: number, userId: number): Promise<boolean> {
    const [member] = await db
      .select()
      .from(projectMembers)
      .where(and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId)
      ));
    return !!member;
  }

  async getProjectMembership(projectId: number, userId: number): Promise<ProjectMember | undefined> {
    const [member] = await db
      .select()
      .from(projectMembers)
      .where(and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId)
      ));
    return member || undefined;
  }

  // Task methods
  async getTasks(projectId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.projectId, projectId));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(insertTask)
      .returning();
    return task;
  }

  async updateTask(id: number, data: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task || undefined;
  }

  async getUserTasks(userId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.assigneeId, userId));
  }

  // Message methods
  async getMessages(projectId: number): Promise<any[]> {
    return await db.query.messages.findMany({
      where: eq(messages.projectId, projectId),
      with: {
        sender: true,
      },
      orderBy: [desc(messages.createdAt)],
    });
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  // Post methods
  async getPosts(): Promise<any[]> {
    return await db.query.posts.findMany({
      with: {
        author: true,
        comments: {
          with: {
            author: true,
          },
        },
      },
      orderBy: [desc(posts.createdAt)],
    });
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(insertPost)
      .returning();
    return post;
  }

  // Comment methods
  async getComments(postId: number): Promise<any[]> {
    return await db.query.comments.findMany({
      where: eq(comments.postId, postId),
      with: {
        author: true,
      },
    });
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(insertComment)
      .returning();
    return comment;
  }

  // File methods
  async getFiles(projectId: number): Promise<any[]> {
    return await db.query.files.findMany({
      where: eq(files.projectId, projectId),
      with: {
        uploadedBy: true,
      },
    });
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const [file] = await db
      .insert(files)
      .values(insertFile)
      .returning();
    return file;
  }

  // Whiteboard methods
  async getWhiteboard(projectId: number): Promise<Whiteboard | undefined> {
    const [whiteboard] = await db
      .select()
      .from(whiteboards)
      .where(eq(whiteboards.projectId, projectId));
    return whiteboard || undefined;
  }

  async updateWhiteboard(projectId: number, data: any): Promise<Whiteboard> {
    const existing = await this.getWhiteboard(projectId);
    
    if (existing) {
      const [whiteboard] = await db
        .update(whiteboards)
        .set({ data, updatedAt: new Date() })
        .where(eq(whiteboards.projectId, projectId))
        .returning();
      return whiteboard;
    } else {
      const [whiteboard] = await db
        .insert(whiteboards)
        .values({ projectId, data })
        .returning();
      return whiteboard;
    }
  }

  // Join Request methods
  async createJoinRequest(request: InsertJoinRequest): Promise<JoinRequest> {
    const [joinRequest] = await db
      .insert(joinRequests)
      .values(request)
      .returning();
    return joinRequest;
  }

  async getJoinRequests(projectId: number): Promise<any[]> {
    return await db.query.joinRequests.findMany({
      where: eq(joinRequests.projectId, projectId),
      with: {
        user: true,
      },
    });
  }

  async getUserJoinRequests(userId: number): Promise<any[]> {
    return await db.query.joinRequests.findMany({
      where: eq(joinRequests.userId, userId),
      with: {
        project: {
          with: {
            creator: true,
          },
        },
      },
    });
  }

  async updateJoinRequest(requestId: number, status: string): Promise<JoinRequest | undefined> {
    const [joinRequest] = await db
      .update(joinRequests)
      .set({ status })
      .where(eq(joinRequests.id, requestId))
      .returning();
    return joinRequest || undefined;
  }

  // Notification methods
  async createNotification(notif: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(notif)
      .returning();
    return notification;
  }

  async getNotifications(recipientId: number): Promise<any[]> {
    return await db.query.notifications.findMany({
      where: eq(notifications.recipientId, recipientId),
      with: {
        fromUser: true,
        project: true,
      },
      orderBy: [desc(notifications.createdAt)],
    });
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }
}

export const storage = new DatabaseStorage();
