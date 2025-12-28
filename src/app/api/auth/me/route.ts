import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorFromCode, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return errorFromCode('AUTH_MISSING_TOKEN');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        enterpriseId: true,
        enterprise: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return errorFromCode('AUTH_USER_NOT_FOUND');
    }

    return successResponse(user);
  } catch (error) {
    console.error('Get user error:', error);
    return errorResponse('AUTH_008', '获取用户信息失败', 500, error);
  }
}
