import { ConflictError, NotFoundError } from "../errors/http.errors.js";
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
export const getUserOrgs = async(userId: string)=>{

    const memeberShip = await prisma.organizationMember.findMany({
        where:{
            userId:userId
        },
        include:{
            organization:true
        }
    });

    return memeberShip.map((m)=>({
        ...m.organization,
        role:m.role,
    }));
};


// ── Get single Org (must be a member) ──────────────────────────────────────
export const getOrg = async(userId: string, orgId: string)=>{
    const membership = await prisma.organizationMember.findUnique({
        where:{
            userId_orgId:{userId,orgId}
        },
        include:{
            organization:true
        }
    })

    if(!membership) throw new NotFoundError('Organization not found');

    return {...membership.organization,  role: membership.role }
}


// ── Invite Member ───────────────────────────────────────────────────────────
export const inviteMember = async(
    requestingUserId: string,
    orgId: string,
    targetUserId: string,
    role:'ADMIN' | 'MEMBER'
)=>{
    
    
}