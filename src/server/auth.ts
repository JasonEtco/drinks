import { Request, Response, NextFunction } from "express";
import * as jose from "jose";

export interface AuthenticatedRequest extends Request {
  writer: boolean;
}

const issuer = process.env.CLOUDFLARE_TEAM_DOMAIN || 'https://example.cloudflareaccess.com';
const publicKeyURL = new URL(issuer + "/cdn-cgi/access/certs");
const JWKS = jose.createRemoteJWKSet(publicKeyURL);

// Dynamic function to get writer emails (not cached)
function getWriterEmails(): string[] {
  return (process.env.WRITER_USERS || '').split(",").filter(Boolean);
}

// Middleware to authenticate and authorize requests
export async function authenticateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers["cf_authorization"] as string;

  if (!authHeader) {
    res.status(401).json({ error: "Missing CF_Authorization header" });
    return;
  }

  try {
    // Verify the JWT token from the CF_Authorization header
    const result = await jose.jwtVerify(authHeader, JWKS, {
      issuer,
    });
    if (!result || !result.payload || typeof result.payload.email !== "string") {
      throw new Error("Invalid JWT token");
    }

    const email = result.payload.email as string
    req.writer = getWriterEmails().includes(email);

    next();
  } catch (error) {
    console.error("Error parsing CF_Authorization header:", error);
    res.status(401).json({ error: "Invalid CF_Authorization header" });
    return;
  }
}

// Middleware to require editor role for modification operations
export function requireEditor(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.writer) {
    res.status(403).json({
      error: "Insufficient permissions",
      message: "Editor role required for this operation",
    });
    return;
  }

  next();
}

// Combined middleware for editor operations
export async function requireEditorAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers["cf_authorization"] as string;

  if (!authHeader) {
    res.status(401).json({ error: "Missing CF_Authorization header" });
    return;
  }

  try {
    // Verify the JWT token from the CF_Authorization header
    const result = await jose.jwtVerify(authHeader, JWKS, {
      issuer,
    });
    if (!result || !result.payload || typeof result.payload.email !== "string") {
      throw new Error("Invalid JWT token");
    }

    const email = result.payload.email as string
    req.writer = getWriterEmails().includes(email);

    // Check if user has editor permissions
    if (!req.writer) {
      res.status(403).json({
        error: "Insufficient permissions",
        message: "Editor role required for this operation",
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Error parsing CF_Authorization header:", error);
    res.status(401).json({ error: "Invalid CF_Authorization header" });
    return;
  }
}
