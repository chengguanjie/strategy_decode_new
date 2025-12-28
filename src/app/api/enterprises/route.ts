import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { successResponse, errorFromCode } from '@/lib/api-response';
import { cachedApiResponse } from '@/lib/api-cache';
import { cache, CacheTags } from '@/lib/redis';

// GET: List enterprises
export async function GET() {
  try {
    return await cachedApiResponse(
      {
        key: 'api:enterprise:list',
        ttl: 60 * 5 // 5 minutes
      },
      async () => {
        const enterprises = await prisma.enterprise.findMany({
          include: {
            _count: {
              select: { users: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        return enterprises.map((ent) => ({
          id: ent.id,
          name: ent.name,
          code: ent.code,
          status: ent.status.toLowerCase(),
          users: ent._count.users,
          createdAt: ent.createdAt.toISOString().split('T')[0],
        }));
      }
    );
  } catch (error) {
    console.error('Error fetching enterprises:', error);
    return errorFromCode('ENT_LIST_FAILED', error);
  }
}

// POST: Create new enterprise
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, status, adminAccount, initialPassword } = body;

    // Transaction to create enterprise AND admin user
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Enterprise
      const enterprise = await tx.enterprise.create({
        data: {
          name,
          code,
          status: status.toUpperCase(),
        },
      });

      // 2. Create Admin User if account provided
      if (adminAccount && initialPassword) {
        const hashedPassword = await bcrypt.hash(initialPassword, 10);
        await tx.user.create({
          data: {
            email: adminAccount,
            name: `${name}管理员`,
            password: hashedPassword,
            role: 'ENTERPRISE_ADMIN',
            enterpriseId: enterprise.id,
          },
        });
      }

      return enterprise;
    });

    // Invalidate enterprise cache
    await cache.invalidateByTag(CacheTags.ENTERPRISE);

    return successResponse(result);
  } catch (error) {
    console.error('Error creating enterprise:', error);
    return errorFromCode('ENT_CREATE_FAILED', error);
  }
}
