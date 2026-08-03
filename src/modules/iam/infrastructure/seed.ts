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
];
