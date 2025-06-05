import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

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

// Cache for Cloudflare public key
let cloudflarePublicKey: string | null = null;
let publicKeyFetchTime: number = 0;
const PUBLIC_KEY_CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Fetch Cloudflare's public signing key
async function getCloudflarePublicKey(): Promise<string | null> {
  const now = Date.now();
  
  // Return cached key if it's still valid
  if (cloudflarePublicKey && (now - publicKeyFetchTime < PUBLIC_KEY_CACHE_DURATION)) {
    return cloudflarePublicKey;
  }
  
  const keyUrl = process.env.CLOUDFLARE_PUBLIC_SIGNING_KEY_URL;
  if (!keyUrl) {
    console.warn("CLOUDFLARE_PUBLIC_SIGNING_KEY_URL environment variable not set");
    return null;
  }
  
  try {
    const response = await fetch(keyUrl);
    if (!response.ok) {
      console.error(`Failed to fetch Cloudflare public key: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const keyData = await response.text();
    cloudflarePublicKey = keyData;
    publicKeyFetchTime = now;
    
    return keyData;
  } catch (error) {
    console.error("Error fetching Cloudflare public key:", error);
    return null;
  }
}

// Verify JWT signature using Cloudflare's public key
async function verifyJwtSignature(token: string): Promise<boolean> {
  try {
    const publicKey = await getCloudflarePublicKey();
    if (!publicKey) {
      console.warn("Cannot verify JWT: Cloudflare public key not available");
      return false;
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }
    
    const [header, payload, signature] = parts;
    const headerObj = JSON.parse(atob(header.replace(/-/g, '+').replace(/_/g, '/')));
    
    // Check if algorithm is RS256 (RSA with SHA-256)
    if (headerObj.alg !== 'RS256') {
      console.warn(`Unsupported JWT algorithm: ${headerObj.alg}`);
      return false;
    }
    
    // Create the signing input (header + '.' + payload)
    const signingInput = `${header}.${payload}`;
    
    // Decode the signature from base64url
    const signatureBuffer = Buffer.from(signature.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    
    // Verify the signature
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(signingInput);
    
    return verifier.verify(publicKey, signatureBuffer);
  } catch (error) {
    console.error("Error verifying JWT signature:", error);
    return false;
  }
}

// Parse CF_Authorization header and extract user information
async function parseAuthorizationHeader(header: string): Promise<{ userId: string; role?: UserRole } | null> {
  try {
    // CF_Authorization contains a JWT token from Cloudflare Access
    // JWT format: header.payload.signature (three Base64-URL encoded parts separated by dots)
    
    // Check if it looks like a JWT (three parts separated by dots)
    const parts = header.split('.');
    if (parts.length === 3) {
      try {
        // Verify JWT signature first
        const isValidSignature = await verifyJwtSignature(header);
        if (!isValidSignature) {
          console.warn("JWT signature verification failed");
          return null;
        }
        
        // Decode the payload (second part of JWT)
        const payload = parts[1];
        // Add padding if needed for proper base64 decoding
        const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
        const decodedPayload = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'));
        const claims = JSON.parse(decodedPayload);
        
        // Check token expiration
        if (claims.exp && Date.now() >= claims.exp * 1000) {
          console.warn("JWT token has expired");
          return null;
        }
        
        // Extract user information from JWT claims
        // Common JWT claims for user identification: sub (subject), email, preferred_username, name
        const userId = claims.sub || claims.email || claims.preferred_username || claims.name;
        
        if (!userId) {
          console.warn("No user identifier found in JWT claims");
          return null;
        }
        
        // Check for role in various common claim fields
        const roleFromClaims = claims.role || claims.roles || claims.groups;
        let role: UserRole | undefined;
        
        if (typeof roleFromClaims === 'string') {
          role = Object.values(UserRole).includes(roleFromClaims as UserRole) 
            ? (roleFromClaims as UserRole) 
            : undefined;
        } else if (Array.isArray(roleFromClaims)) {
          // If roles is an array, find the first matching UserRole
          role = roleFromClaims.find(r => Object.values(UserRole).includes(r as UserRole)) as UserRole;
        }
        
        return { userId, role };
      } catch (jwtError) {
        console.warn("Failed to decode JWT from CF_Authorization header:", jwtError);
        return null;
      }
    }
    
    // Fallback: support legacy formats for backward compatibility
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
export async function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers["cf_authorization"] as string;
  
  if (!authHeader) {
    res.status(401).json({ error: "Missing CF_Authorization header" });
    return;
  }
  
  const parsed = await parseAuthorizationHeader(authHeader);
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
  }).catch(next);
}