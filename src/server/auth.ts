import { Request, Response, NextFunction } from "express";

export enum UserRole {
  EDITOR = "editor",
  VIEWER = "viewer",
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
  };
}

// Configuration for user role mapping
// In production, this could be loaded from environment variables or a config file
const getUserRoleMapping = (): Record<string, UserRole> => {
  const mapping = process.env.USER_ROLE_MAPPING;
  if (mapping) {
    try {
      return JSON.parse(mapping);
    } catch (error) {
      console.warn("Failed to parse USER_ROLE_MAPPING, using defaults");
    }
  }
  
  // Default mapping for development/testing
  return {
    "editor-user": UserRole.EDITOR,
    "viewer-user": UserRole.VIEWER,
    "admin": UserRole.EDITOR,
    "guest": UserRole.VIEWER,
  };
};

// Parse CF_Authorization header and extract user information
function parseAuthorizationHeader(header: string): { userId: string; role?: UserRole } | null {
  try {
    // For CF_Authorization, the format can vary, but commonly it's a JWT or simple identifier
    // For this implementation, we'll support both:
    // 1. Simple format: "user:role" or just "user"
    // 2. JSON format: {"user": "id", "role": "role"}
    
    // First check for JSON format (starts with { and ends with })
    if (header.startsWith("{") && header.endsWith("}")) {
      try {
        const parsed = JSON.parse(header);
        const role = Object.values(UserRole).includes(parsed.role as UserRole) 
          ? (parsed.role as UserRole) 
          : undefined;
        return { userId: parsed.user || parsed.userId || parsed.id, role };
      } catch (jsonError) {
        console.warn("Failed to parse JSON in CF_Authorization header:", jsonError);
        return null;
      }
    }
    
    // Check for simple format: "user:role"
    if (header.includes(":")) {
      const [userId, roleString] = header.split(":");
      const role = Object.values(UserRole).includes(roleString as UserRole) 
        ? (roleString as UserRole) 
        : undefined;
      return { userId, role };
    }
    
    // Simple user identifier
    return { userId: header };
  } catch (error) {
    console.warn("Failed to parse CF_Authorization header:", error);
    return null;
  }
}

// Middleware to authenticate and authorize requests
export function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers["cf_authorization"] as string;
  
  if (!authHeader) {
    res.status(401).json({ error: "Missing CF_Authorization header" });
    return;
  }
  
  const parsed = parseAuthorizationHeader(authHeader);
  if (!parsed) {
    res.status(401).json({ error: "Invalid CF_Authorization header format" });
    return;
  }
  
  const userRoleMapping = getUserRoleMapping();
  const userRole = parsed.role || userRoleMapping[parsed.userId] || UserRole.VIEWER;
  
  req.user = {
    id: parsed.userId,
    role: userRole,
  };
  
  next();
}

// Middleware to require editor role for modification operations
export function requireEditor(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  
  if (req.user.role !== UserRole.EDITOR) {
    res.status(403).json({ 
      error: "Insufficient permissions", 
      message: "Editor role required for this operation" 
    });
    return;
  }
  
  next();
}

// Combined middleware for editor operations
export function requireEditorAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  authenticateUser(req, res, (err) => {
    if (err) return next(err);
    requireEditor(req, res, next);
  });
}