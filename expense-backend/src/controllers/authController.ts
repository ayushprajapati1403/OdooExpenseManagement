import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { config } from '../config';
import { AuthenticatedRequest } from '../middlewares/auth';

export class AuthController {
  async signup(req: Request, res: Response) {
    try {
      const { email, password, name, country } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Get country currency from API
      const countryResponse = await fetch(`${config.externalApis.countriesApi}/${country}?fields=name,currencies`);
      const countryData = await countryResponse.json();
      
      if (!countryData || countryData.length === 0) {
        return res.status(400).json({ error: 'Invalid country' });
      }

      const currency = Object.keys(countryData[0].currencies)[0];

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create company and admin user in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create company
        const company = await tx.company.create({
          data: {
            name: `${name}'s Company`,
            currency,
            country
          }
        });

        // Create admin user
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            role: 'ADMIN',
            companyId: company.id,
            isManagerApprover: true
          }
        });

        return { company, user };
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: result.user.id, email: result.user.email, role: result.user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.status(201).json({
        message: 'Company and admin user created successfully',
        token,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          companyId: result.user.companyId
        },
        company: {
          id: result.company.id,
          name: result.company.name,
          currency: result.company.currency,
          country: result.company.country
        }
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: { company: true }
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          isManagerApprover: user.isManagerApprover
        },
        company: {
          id: user.company.id,
          name: user.company.name,
          currency: user.company.currency,
          country: user.company.country
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        include: { company: true }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          isManagerApprover: user.isManagerApprover
        },
        company: {
          id: user.company.id,
          name: user.company.name,
          currency: user.company.currency,
          country: user.company.country
        }
      });
    } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
