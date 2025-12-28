import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { createUserSchema } from '@/lib/validations';
import { validateBody } from '@/lib/validations/validate';
import { successResponse, errorFromCode } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

// GET: List all users for the current enterprise, optionally filtered by department
export const GET = withAuth(
  async ({ user, request }: AuthContext) => {
    try {
      const { searchParams } = new URL(request.url);
      const departmentId = searchParams.get('departmentId');

      const whereClause: Record<string, string | undefined> = {
        enterpriseId: user.enterpriseId,
      };

      if (departmentId) {
        whereClause.departmentId = departmentId;
      }

      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          position: true,
          departmentId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      return successResponse(users);
    } catch (error) {
      console.error('Error fetching enterprise users:', error);
      return errorFromCode('USER_LIST_FAILED', error);
    }
  },
  { requireEnterprise: true }
);

// POST: Create a new user (admin or employee)
export const POST = withAuth(
  async ({ user: currentUser, request }: AuthContext) => {
    try {
      // Only ENTERPRISE_ADMIN or MANAGER can add users
      if (currentUser.role !== 'ENTERPRISE_ADMIN' && currentUser.role !== 'MANAGER') {
        return errorFromCode('AUTH_UNAUTHORIZED');
      }

      const body = await request.json();
      
      // Validate input using Zod schema
      const validation = validateBody(body, createUserSchema);
      if (!validation.success) {
        return validation.error;
      }
      
      const { name, email, password, role, departmentId, position } = validation.data;

      // Check if email/account already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        return errorFromCode('USER_EMAIL_EXISTS');
      }

      const hashedPassword = await hashPassword(password);

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role || 'EMPLOYEE',
          position: position || null,
          enterpriseId: currentUser.enterpriseId!,
          departmentId: departmentId || null,
        },
      });

      return successResponse({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        position: newUser.position,
        departmentId: newUser.departmentId,
        createdAt: newUser.createdAt,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      return errorFromCode('USER_CREATE_FAILED', error);
    }
  },
  { requireEnterprise: true, roles: ['enterprise_admin', 'department_manager'] }
);
