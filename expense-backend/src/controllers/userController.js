import bcrypt from 'bcryptjs';
import prisma from '../prisma.js';
export class UserController {
    async createUser(req, res) {
        try {
            const { email, password, name, role, managerId, isManagerApprover } = req.body;
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
        }
        catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async getAllUsers(req, res) {
        try {
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
        }
        catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async updateUserRole(req, res) {
        try {
            const { userId } = req.params;
            const { role, isManagerApprover } = req.body;
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
        }
        catch (error) {
            console.error('Update user role error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async assignManager(req, res) {
        try {
            const { userId } = req.params;
            const { managerId } = req.body;
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
            }
            else {
                // Create new relationship
                await prisma.managerRelation.create({
                    data: {
                        employeeId: userId,
                        managerId
                    }
                });
            }
            res.json({ message: 'Manager relationship assigned successfully' });
        }
        catch (error) {
            console.error('Assign manager error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async getTeamMembers(req, res) {
        try {
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
        }
        catch (error) {
            console.error('Get team members error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async getUserById(req, res) {
        try {
            const { userId } = req.params;
            const user = await prisma.user.findUnique({
                where: { id: userId },
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
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ user });
        }
        catch (error) {
            console.error('Get user by ID error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async deleteUser(req, res) {
        try {
            const { userId } = req.params;
            // Check if user exists
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            // Prevent deleting the last admin
            if (user.role === 'ADMIN') {
                const adminCount = await prisma.user.count({
                    where: {
                        companyId: user.companyId,
                        role: 'ADMIN'
                    }
                });
                if (adminCount <= 1) {
                    return res.status(400).json({ error: 'Cannot delete the last admin user' });
                }
            }
            // Delete user (cascade will handle related records)
            await prisma.user.delete({
                where: { id: userId }
            });
            res.json({ message: 'User deleted successfully' });
        }
        catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
//# sourceMappingURL=userController.js.map