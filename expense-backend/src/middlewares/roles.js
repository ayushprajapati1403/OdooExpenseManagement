export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                required: allowedRoles,
                current: req.user.role
            });
        }
        next();
    };
};
export const requireAdmin = requireRole(['ADMIN']);
export const requireManager = requireRole(['MANAGER', 'ADMIN']);
export const requireEmployee = requireRole(['EMPLOYEE', 'MANAGER', 'ADMIN']);
//# sourceMappingURL=roles.js.map