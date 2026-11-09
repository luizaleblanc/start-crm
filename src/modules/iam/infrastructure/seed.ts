import type {
  Organization,
  Permission,
  Role,
  RolePermission,
  User,
  UserRole,
} from "../domain/entities";

const now = new Date().toISOString();

export const organizationsSeed: Organization[] = [
  {
    id: "org_1",
    name: "Start CRM",
    slug: "start-crm",
    ativo: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const usersSeed: User[] = [
  {
    id: "user_admin",
    organizationId: "org_1",
    name: "Administrador",
    email: "admin@startcrm.local",
    ativo: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "user_luiza",
    organizationId: "org_1",
    name: "Luiza Ferraz",
    email: "luizaa.fq@gmail.com",
    ativo: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "user_cleiton",
    organizationId: "org_1",
    name: "Cleiton",
    email: "cleiton@startcrm.local",
    ativo: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "user_si",
    organizationId: "org_1",
    name: "Si",
    email: "si@startcrm.local",
    ativo: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "user_elis",
    organizationId: "org_1",
    name: "Elis",
    email: "elis@startcrm.local",
    ativo: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "user_bruno",
    organizationId: "org_1",
    name: "Bruno",
    email: "bruno@startcrm.local",
    ativo: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const rolesSeed: Role[] = [
  {
    id: "role_admin",
    organizationId: "org_1",
    name: "Admin",
    ativo: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const permissionsSeed: Permission[] = [
  {
    id: "perm_all",
    code: "*",
    description: "Acesso total",
    ativo: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const rolePermissionsSeed: RolePermission[] = [
  { id: "rp_1", roleId: "role_admin", permissionId: "perm_all", createdAt: now, updatedAt: now },
];

export const userRolesSeed: UserRole[] = [
  { id: "ur_1", userId: "user_admin", roleId: "role_admin", createdAt: now, updatedAt: now },
  { id: "ur_2", userId: "user_luiza", roleId: "role_admin", createdAt: now, updatedAt: now },
  { id: "ur_3", userId: "user_cleiton", roleId: "role_admin", createdAt: now, updatedAt: now },
  { id: "ur_4", userId: "user_si", roleId: "role_admin", createdAt: now, updatedAt: now },
  { id: "ur_5", userId: "user_elis", roleId: "role_admin", createdAt: now, updatedAt: now },
  { id: "ur_6", userId: "user_bruno", roleId: "role_admin", createdAt: now, updatedAt: now },
];
