import express from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './auth';

const router = express.Router();
const prisma = new PrismaClient();

// Create new user (Admin only)
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { email, password, name, role, managerId, isManagerApprover } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Email, password, name, and role are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Get current user's company
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { company: true }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        companyId: currentUser.companyId,
        isManagerApprover: isManagerApprover || false
      }
    });

    // Create manager relationship if managerId is provided
    if (managerId) {
      await prisma.managerRelation.create({
        data: {
          employeeId: user.id,
          managerId
        }
      });
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        isManagerApprover: user.isManagerApprover
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users in company (Admin only)
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const users = await prisma.user.findMany({
      where: { companyId: currentUser.companyId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isManagerApprover: true,
        createdAt: true,
        employeeRelation: {
          include: {
            manager: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        managedEmployees: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user role (Admin only)
router.put('/:userId/role', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    const { role, isManagerApprover } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        role,
        isManagerApprover: isManagerApprover !== undefined ? isManagerApprover : undefined
      }
    });

    res.json({
      message: 'User role updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isManagerApprover: user.isManagerApprover
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign manager relationship (Admin only)
router.post('/:userId/manager', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    const { managerId } = req.body;

    if (!managerId) {
      return res.status(400).json({ error: 'Manager ID is required' });
    }

    // Check if relationship already exists
    const existingRelation = await prisma.managerRelation.findUnique({
      where: { employeeId: userId }
    });

    if (existingRelation) {
      // Update existing relationship
      await prisma.managerRelation.update({
        where: { employeeId: userId },
        data: { managerId }
      });
    } else {
      // Create new relationship
      await prisma.managerRelation.create({
        data: {
          employeeId: userId,
          managerId
        }
      });
    }

    res.json({ message: 'Manager relationship assigned successfully' });
  } catch (error) {
    console.error('Assign manager error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get team members (Manager only)
router.get('/team', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'MANAGER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Manager or Admin access required' });
    }

    const teamMembers = await prisma.managerRelation.findMany({
      where: { managerId: req.user.userId },
      include: {
        employee: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true
          }
        }
      }
    });

    res.json({ teamMembers });
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
