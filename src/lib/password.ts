import { hash, compare } from "bcryptjs";

export const BCRYPT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return compare(plain, hashed);
}
