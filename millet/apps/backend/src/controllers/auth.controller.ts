import type { Request, Response } from 'express';
import { asyncHandler, ApiResponse, } from '../utils/Api';
import { 
  register, 
  login, 
  logout, 
  refreshAccessToken, 
  verifyEmail, 
  requestPasswordReset, 
  performPasswordReset 
} from '../services/auth.service';  

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, username } = req.body;
  const user = await register({ email, password, username });
  res.status(201).json(new ApiResponse(201, user, 'User registered successfully. Please verify your email.'));
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await login({ email, password });
  
  const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
  };

  res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, { user, accessToken }, 'Login successful'));
});

// ✅ ADD THESE CONTROLLERS
export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
    await logout(req.user!.id);
    
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    };

    res
      .status(200)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "Logout successful"));
});

export const refreshTokens = asyncHandler(async (req: Request, res: Response) => {
    // Note: In a real app, you'd get the refresh token from an httpOnly cookie.
    // Assuming for now it might be sent in the body for simpler testing.
    const incomingRefreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    const { accessToken } = await refreshAccessToken(incomingRefreshToken);

    res.status(200).json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
});

export const verifyUserEmail = asyncHandler(async (req: Request, res: Response) => {
    const token = req.query.token as string;
    const result = await verifyEmail(token);
    res.status(200).json(new ApiResponse(200, result, result.message));
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await requestPasswordReset(email);
    res.status(200).json(new ApiResponse(200, result, result.message));
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const token = req.query.token as string;
    const { password } = req.body;
    const result = await performPasswordReset(token, password);
    res.status(200).json(new ApiResponse(200, result, result.message));
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  // The user object is attached by the `protect` middleware
  res.status(200).json(new ApiResponse(200, req.user, 'Current user fetched successfully'));
});