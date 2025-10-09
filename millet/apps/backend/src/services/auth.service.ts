import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '@prisma/client';
import { prisma, Prisma } from '@repo/db/src/index';
import { ApiError } from '../utils/Api';
import jwt from 'jsonwebtoken';
import { env } from '../config'; // Apne config file ka sahi path daalein
import { generateAccessToken, generateRefreshToken } from '../utils/tokenutils';
import { sendVerificationEmail, sendPasswordResetEmail } from './mail.service';

type UserRegistrationData = Pick<User, 'email' | 'password'> & { username?: string | null };
type UserLoginData = Pick<User, 'email' | 'password'>;

/**
 * Registers a new user.
 * @param data - The user registration data.
 * @returns The newly created user object (without the password).
 */
export const register = async (data: UserRegistrationData) => {
  const { email, password, username } = data;

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username: username! }] },
  });

  if (existingUser) {
    throw new ApiError(409, 'User with this email or username already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString('hex');

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      username: username!,
      verificationToken,
    },
  });
  
  // Asynchronously send verification email
  await sendVerificationEmail(user.email, verificationToken);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Logs in a user.
 * @param data - The user login data.
 * @returns An object containing the user and an access token.
 */
// 👇 MODIFY THIS SERVICE
export const login = async (data: UserLoginData) => {
  const { email, password } = data;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.emailVerified) {
    throw new ApiError(403, 'Email not verified. Please check your inbox.');
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // Store hashed refresh token in DB for security
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, refreshToken: __, ...userWithoutPasswordAndTokens } = user;
  
  return { user: userWithoutPasswordAndTokens, accessToken, refreshToken };
};


// ✅ ADD THIS SERVICE
export const logout = async (userId: string) => {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
  return { message: "Logged out successfully" };
};


// ✅ ADD THIS SERVICE
export const refreshAccessToken = async (token: string) => {
    if (!token) {
        throw new ApiError(401, 'Unauthorized: No refresh token provided');
    }

    const decoded = jwt.verify(token, env.JWT_REFRESH_TOKEN_SECRET) as { id: string };

    const user = await prisma.user.findUnique({
        where: { id: decoded.id },
    });

    if (!user || user.refreshToken !== token) {
        throw new ApiError(401, 'Unauthorized: Invalid refresh token');
    }

    const newAccessToken = generateAccessToken(user.id);

    return { accessToken: newAccessToken };
}
export const verifyEmail = async (token: string) => {
    if (!token) {
        throw new ApiError(400, "Verification token is required");
    }

    const user = await prisma.user.findFirst({
        where: { verificationToken: token }
    });

    if (!user) {
        throw new ApiError(404, "Invalid verification token");
    }

    if (user.emailVerified) {
        return { message: "Email is already verified" };
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerified: true,
            verificationToken: null, // Clear the token after use
        }
    });

    return { message: "Email verified successfully" };
}
export const requestPasswordReset = async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        // To prevent email enumeration, we don't reveal if the user exists
        return { message: "If a user with that email exists, a password reset link has been sent." };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // Token valid for 1 hour

    await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry },
    });

    await sendPasswordResetEmail(email, resetToken);

    return { message: "If a user with that email exists, a password reset link has been sent." };
}

export const performPasswordReset = async (token: string, newPassword: string) => {
    if (!token) {
        throw new ApiError(400, "Reset token is required");
    }

    const user = await prisma.user.findFirst({
        where: { 
            resetToken: token,
            resetTokenExpiry: { gt: new Date() } // Check if token is not expired
        }
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired password reset token");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
        }
    });

    return { message: "Password has been reset successfully." };
}