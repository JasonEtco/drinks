import { Router, Request, Response } from "express";
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { database } from "../lib/database.js";
import { User } from "../lib/types.js";

// Only configure OAuth strategies if we have the required environment variables
const isOAuthConfigured = () => {
  return !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && 
           process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
};

// Configure GitHub OAuth strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || "/auth/github/callback"
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      // Check if user already exists
      let user = await database.getUserByProviderId('github', profile.id);
      
      if (user) {
        // Update existing user info
        user = await database.updateUser(user.id, {
          name: profile.displayName || profile.username,
          email: profile.emails?.[0]?.value || `${profile.username}@github.local`
        });
      } else {
        // Create new user
        user = await database.createUser({
          name: profile.displayName || profile.username,
          email: profile.emails?.[0]?.value || `${profile.username}@github.local`,
          provider: 'github',
          providerId: profile.id
        });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

// Configure Google OAuth strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback"
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      // Check if user already exists
      let user = await database.getUserByProviderId('google', profile.id);
      
      if (user) {
        // Update existing user info
        user = await database.updateUser(user.id, {
          name: profile.displayName,
          email: profile.emails?.[0]?.value
        });
      } else {
        // Create new user
        user = await database.createUser({
          name: profile.displayName,
          email: profile.emails?.[0]?.value,
          provider: 'google',
          providerId: profile.id
        });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

// Passport serialization
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await database.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Authentication middleware
export const requireAuth = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

// Create auth router
export function authRouter(): Router {
  const router = Router();

  // GitHub OAuth routes
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
    
    router.get('/github/callback', 
      passport.authenticate('github', { failureRedirect: '/login?error=github' }),
      (req: Request, res: Response) => {
        res.redirect('/');
      }
    );
  } else {
    router.get('/github', (req: Request, res: Response) => {
      res.status(503).json({ error: 'GitHub OAuth not configured' });
    });
    router.get('/github/callback', (req: Request, res: Response) => {
      res.status(503).json({ error: 'GitHub OAuth not configured' });
    });
  }

  // Google OAuth routes
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
    
    router.get('/google/callback',
      passport.authenticate('google', { failureRedirect: '/login?error=google' }),
      (req: Request, res: Response) => {
        res.redirect('/');
      }
    );
  } else {
    router.get('/google', (req: Request, res: Response) => {
      res.status(503).json({ error: 'Google OAuth not configured' });
    });
    router.get('/google/callback', (req: Request, res: Response) => {
      res.status(503).json({ error: 'Google OAuth not configured' });
    });
  }

  // Get current user
  router.get('/me', (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
      res.json({ user: req.user });
    } else {
      res.json({ user: null });
    }
  });

  // Logout
  router.post('/logout', (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  });

  return router;
}