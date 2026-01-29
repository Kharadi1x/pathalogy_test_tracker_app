import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient';

export interface AuthedRequest extends Request {
  user?: any;
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization?.split(' ')[1];
    if (!auth) return res.status(401).json({ error: 'unauthorized' });
    const decoded: any = jwt.verify(auth, process.env.JWT_SECRET || 'change_me');
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'unauthorized' });
  }
}

export function requireRole(role: 'ADMIN' | 'PATIENT') {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    if (req.user.role !== role) return res.status(403).json({ error: 'forbidden' });
    next();
  };
}
