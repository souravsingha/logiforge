import type { Request } from "express";

export type Role =
  | "ADMIN"
  | "LOGISTICS_PLANNER"
  | "DEPOT_MANAGER"
  | "FIELD_OPERATOR"
  | "ANALYST";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export interface AuthRequest extends Request {
  user?: AuthUser;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}