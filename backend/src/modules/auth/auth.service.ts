import bcrypt from 'bcrypt';
import { prisma } from '../../db/prisma/client';
import { generateToken } from '../../middleware/auth';
import { ConflictError, UnauthorizedError, ValidationError } from '../../utils/errors';
import type { RegisterInput, LoginInput } from './auth.schema';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

export async function register(input: RegisterInput) {
  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError('Email already registered', 'DUPLICATE_EMAIL');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role as any,
    },
  });

  const token = generateToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remainingMinutes = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 60000
    );
    throw new UnauthorizedError(
      `Account is locked. Try again in ${remainingMinutes} minute(s).`,
      'ACCOUNT_LOCKED'
    );
  }

  // Verify password
  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    // Increment failed attempts
    const newAttempts = user.failedLoginAttempts + 1;
    const updateData: any = { failedLoginAttempts: newAttempts };

    // Lock account if max attempts exceeded
    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
    }

    await prisma.user.update({ where: { id: user.id }, data: updateData });

    const remaining = MAX_LOGIN_ATTEMPTS - newAttempts;
    const message =
      remaining > 0
        ? `Invalid email or password. ${remaining} attempt(s) remaining.`
        : 'Account is locked due to too many failed attempts. Try again in 15 minutes.';

    throw new UnauthorizedError(message, remaining > 0 ? 'INVALID_CREDENTIALS' : 'ACCOUNT_LOCKED');
  }

  // Successful login — reset attempts
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  const token = generateToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function logout() {
  // Stateless JWT — no server-side state to clear.
  // The frontend should discard the token client-side.
  return { message: 'Logged out successfully. Discard the token on the client.' };
}
