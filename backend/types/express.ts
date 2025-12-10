import { Request } from "express";
import multer from "multer";
import { IUser } from "./index";

export interface AuthRequest extends Request {
  user?: IUser | null;
  headers: any;
  upload?: multer.Instance;
  file?: Express.Multer.File;
}

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}
