import { Router, Request, Response } from "express";
import { prisma } from "@repo/db";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { protect } from "../../middleware/authmiddleware";
import { asyncHandler, ApiError } from "../../utils/Api";

const router = Router();
// Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZ3dqZGVhYzAwMDB3Ymo4Y2h4NHhxc3EiLCJpYXQiOjE3NjA4MDc1ODMsImV4cCI6MTc2MDgwODQ4M30.8RWo_bwln9vVjZOYaJpmfD0V-HCRyjL7WHcUDmW7Yuk
// Helper function to generate tokens
const generateTokens = (userId: string) => {
  const accessTokenSecret = process.env.JWT_ACCESS_TOKEN_SECRET;
  const refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET;

  if (!accessTokenSecret || !refreshTokenSecret) {
    throw new ApiError(500, "JWT secrets are not configured");
  }

  const accessTokenOptions: SignOptions = {
    expiresIn: Number(process.env.JWT_ACCESS_TOKEN_EXPIRY) || 15 * 60 // 15 minutes
  };

  const refreshTokenOptions: SignOptions = {
    expiresIn: Number(process.env.JWT_REFRESH_TOKEN_EXPIRY) || 7 * 24 * 60 * 60 // 7 days
  };

  const accessToken = jwt.sign(
    { id: userId },
    accessTokenSecret,
    accessTokenOptions
  );

  const refreshToken = jwt.sign(
    { id: userId },
    refreshTokenSecret,
    refreshTokenOptions
  );

  return { accessToken, refreshToken };
};

// POST /api/v1/auth/signup - Register new user
router.post(
  "/signup",
  asyncHandler(async (req: Request, res: Response) => {
    const { email, username, password, phone } = req.body;

    // Validation
    if (!email?.trim()) {
      throw new ApiError(400, "Email is required");
    }
    if (!password?.trim()) {
      throw new ApiError(400, "Password is required");
    }
    if (password.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters");
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          ...(username ? [{ username: username.toLowerCase() }] : []),
        ],
      },
    });

    if (existingUser) {
      throw new ApiError(400, "User with this email or username already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username?.toLowerCase() || null,
        password: hashedPassword,
        phone: phone || null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        phone: true,
        role: true,
        emailVerified: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Save refresh token to database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  })
);

// POST /api/v1/auth/signin - Login user
router.post(
  "/signin",
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Validation
    if (!email?.trim()) {
      throw new ApiError(400, "Email is required");
    }
    if (!password?.trim()) {
      throw new ApiError(400, "Password is required");
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ApiError(403, "Your account has been deactivated");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid email or password");
    }

    // Generate tokens
    const tokens = generateTokens(user.id);

    // Save refresh token to database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    // Return user data without password
    const { password: _, refreshToken: __, ...userWithoutSensitiveData } = user;

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: userWithoutSensitiveData,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  })
);

// POST /api/v1/auth/refresh - Refresh access token
router.post(
  "/refresh",
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ApiError(400, "Refresh token is required");
    }

    // Verify refresh token
    let decoded;
    try {
      const refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET;
      if (!refreshTokenSecret) {
        throw new ApiError(500, "JWT refresh secret is not configured");
      }

      decoded = jwt.verify(refreshToken, refreshTokenSecret) as { id: string };
    } catch (error) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    // Find user and verify refresh token matches
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || user.refreshToken !== refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (!user.isActive) {
      throw new ApiError(403, "Your account has been deactivated");
    }

    // Generate new tokens
    const tokens = generateTokens(user.id);

    // Update refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: tokens,
    });
  })
);

// POST /api/v1/auth/logout - Logout user
router.post(
  "/logout",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    // Remove refresh token from database
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  })
);

// GET /api/v1/auth/me - Get current user
router.get(
  "/me",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        phone: true,
        role: true,
        emailVerified: true,
        isActive: true,
        avatarUrl: true,
        dateOfBirth: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res.json({
      success: true,
      message: "User retrieved successfully",
      data: user,
    });
  })
);
// PATCH /api/v1/auth/me - Update current user profile
router.patch(
  "/me",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    const { username, phone, dateOfBirth } = req.body;

    // Build update data object
    const updateData: any = {};

    if (username !== undefined) {
      if (username.trim().length < 2) {
        throw new ApiError(400, "Username must be at least 2 characters");
      }
      updateData.username = username.trim();
    }

    if (phone !== undefined) {
      updateData.phone = phone.trim() || null;
    }

    if (dateOfBirth !== undefined) {
      updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        phone: true,
        role: true,
        emailVerified: true,
        isActive: true,
        avatarUrl: true,
        dateOfBirth: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  })
);
// Temporary - make user admin (REMOVE IN PRODUCTION!)
router.patch("/make-admin", protect, asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if(!userId) {
    throw new ApiError(401, "User not authenticated");
  }
  await prisma.user.update({
    where: { id: userId },
    data: { role: "ADMIN" }
  });
  res.json({ success: true, message: "User is now admin" });
}));
// Test endpoint - add this at the top of your routes
router.post("/test", asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, message: "Auth route is working" });
}));
export default router;