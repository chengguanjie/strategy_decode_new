import { prisma } from '@/lib/prisma';
import { successResponse, errorFromCode } from '@/lib/api-response';

// PUT: Update enterprise
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, code, status, adminAccount } = body;

    // Update enterprise details
    const enterprise = await prisma.enterprise.update({
      where: { id },
      data: {
        name,
        code,
        status: status ? status.toUpperCase() : undefined,
      },
    });

    // Optionally update admin account if logic permits
    if (adminAccount) {
      const existingAdmin = await prisma.user.findFirst({
        where: { enterpriseId: id, role: 'ENTERPRISE_ADMIN' }
      });

      if (existingAdmin && existingAdmin.email !== adminAccount) {
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { email: adminAccount }
        });
      }
    }

    return successResponse(enterprise);
  } catch (error) {
    console.error('Error updating enterprise:', error);
    return errorFromCode('ENT_UPDATE_FAILED', error);
  }
}

// DELETE: Delete enterprise
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.enterprise.delete({
      where: { id },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    console.error('Error deleting enterprise:', error);
    return errorFromCode('ENT_DELETE_FAILED', error);
  }
}
