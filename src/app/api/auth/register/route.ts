import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';
import { validateBody } from '@/lib/validations/validate';
import { successResponse, errorFromCode } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input using Zod schema
    const validation = validateBody(body, registerSchema);
    if (!validation.success) {
      return validation.error;
    }
    
    const { name, email, password, enterpriseCode } = validation.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorFromCode('REG_EMAIL_EXISTS');
    }

    let enterpriseId: string | undefined;
    if (enterpriseCode) {
      const enterprise = await prisma.enterprise.findUnique({
        where: { code: enterpriseCode },
      });
      if (!enterprise) {
        return errorFromCode('REG_INVALID_ENTERPRISE');
      }
      enterpriseId = enterprise.id;
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: enterpriseId ? 'EMPLOYEE' : 'ENTERPRISE_ADMIN',
        enterpriseId,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      enterpriseId: user.enterpriseId || undefined,
    });

    return successResponse({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        enterpriseId: user.enterpriseId,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return errorFromCode('REG_FAILED', error);
  }
}
