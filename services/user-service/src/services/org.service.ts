import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../errors/http.errors.js";
import { prisma } from "../lib/prisma.js";

interface Organization {
  userId: string;
  organizationName: string;
}

const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

// ── Create Org ──────────────────────────────────────────────────────────────
export const createOrg = async (organization: Organization) => {
  const slug = slugify(organization.organizationName);

  const existing = await prisma.organization.findUnique({
    where: {
      slug: slug,
    },
  });

  if (existing) {
    throw new ConflictError("Organization name already taken");
  }

  // if either fails, both roll back
  const org = await prisma.$transaction(async (tx) => {
    const newOrg = await tx.organization.create({
      data: {
        name: organization.organizationName,
        slug: slug,
      },
    });

    await tx.organizationMember.create({
      data: {
        userId: organization.userId,
        orgId: newOrg.id,
        role: "OWNER",
      },
    });

    return newOrg;
  });

  return org;
};

// ── Get Orgs for a User ─────────────────────────────────────────────────────
export const getUserOrgs = async (userId: string) => {
  const memeberShip = await prisma.organizationMember.findMany({
    where: {
      userId: userId,
    },
    include: {
      organization: true,
    },
  });

  return memeberShip.map((m) => ({
    ...m.organization,
    role: m.role,
  }));
};

// ── Get single Org (must be a member) ──────────────────────────────────────
export const getOrg = async (userId: string, orgId: string) => {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_orgId: { userId, orgId },
    },
    include: {
      organization: true,
    },
  });

  if (!membership) throw new NotFoundError("Organization not found");

  return { ...membership.organization, role: membership.role };
};

// ── Invite Member ───────────────────────────────────────────────────────────
export const inviteMember = async (
  requestingUserId: string,
  orgId: string,
  targetUserId: string,
  role: "ADMIN" | "MEMBER",
) => {
  const requester = await prisma.organizationMember.findUnique({
    where: {
      userId_orgId: { userId: requestingUserId, orgId },
    },
  });

  if (!requester) throw new NotFoundError("Organization not found");

  if (requester.role === "MEMBER")
    throw new ForbiddenError("Insufficient permissions");

  const alreadyMemeber = await prisma.organizationMember.findUnique({
    where: {
      userId_orgId: {
        userId: targetUserId,
        orgId,
      },
    },
  });

  if (alreadyMemeber) throw new ConflictError("User is already a member");

  return prisma.organizationMember.create({
    data: {
      userId: targetUserId,
      orgId,
      role,
    },
  });
};

// ── Get Members ─────────────────────────────────────────────────────────────
export const getMembers = async (userId: string, orgId: string) => {
  // verify requester is a member first
  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_orgId: { userId, orgId },
    },
  });

  if (!membership) throw new NotFoundError("Organization not found");

  const memebers = await prisma.organizationMember.findMany({
    where: {
      orgId: orgId,
    },
    select: {
      id: true,
      userId: true,
      role: true,
      createdAt: true,
    },
  });
};

// ── Remove Member ───────────────────────────────────────────────────────────
export const removeMember = async (
  requestingUserId: string,
  orgId: string,
  targetUserId: string,
) => {
  const requester = await prisma.organizationMember.findUnique({
    where: { userId_orgId: { userId: requestingUserId, orgId } },
  });

  if (!requester) throw new NotFoundError("Organization not found");

  const target = await prisma.organizationMember.findUnique({
    where: { userId_orgId: { userId: targetUserId, orgId } },
  });

  if (!target) throw new NotFoundError("Member not found");
  if (target.role === "OWNER")
    throw new ForbiddenError("Cannot remove the owner");

  if (requester.role === "MEMBER")
    throw new ForbiddenError("Insufficient permissions");

  if (requester.role === "ADMIN" && target.role === "ADMIN") {
    throw new ForbiddenError("Admins cannot remove other admins");
  }

  await prisma.organizationMember.delete({
    where: { userId_orgId: { userId: targetUserId, orgId } },
  });
};

// ── Delete Organization ───────────────────────────────────────────────────────────

export const deleteOrganization = async (orgId: string, userId: string) => {
  const memebership = await prisma.organizationMember.findUnique({
    where: {
      userId_orgId: { userId, orgId },
    },
  });

  if (!memebership) throw new NotFoundError("Organization not found");

  if (memebership.role === "MEMBER" || memebership.role === "ADMIN")
    throw new ForbiddenError("Insufficient permissions");

  await prisma.organization.delete({
    where: {
      id: orgId,
    },
  });
};
