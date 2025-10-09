/**
 * Sends a verification email to a new user.
 * @param email - The user's email address.
 * @param token - The verification token.
 */
export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const verificationLink = `http://yourapi.com/api/v1/auth/verify-email?token=${token}`;
  
  console.log('--- SENDING VERIFICATION EMAIL ---');
  console.log(`To: ${email}`);
  console.log(`Link: ${verificationLink}`);
  console.log('------------------------------------');
  
  // In a real application, you would use a transactional email service here.
  // For example, using Nodemailer:
  // await transporter.sendMail({
  //   from: '"Your App" <noreply@yourapp.com>',
  //   to: email,
  //   subject: 'Verify Your Email Address',
  //   html: `<p>Please click this link to verify your email: <a href="${verificationLink}">Verify Email</a></p>`,
  // });
};

export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  const resetLink = `http://yourfrontend.com/reset-password?token=${token}`;
  
  console.log('--- SENDING PASSWORD RESET EMAIL ---');
  console.log(`To: ${email}`);
  console.log(`Link: ${resetLink}`);
  console.log('------------------------------------');
  
  // In a real app, use your email service here.
};