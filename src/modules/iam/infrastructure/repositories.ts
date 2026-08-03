import { createResourceRepository } from "@/shared/infrastructure/repository-factory";
import type {
  Organization,
  Permission,
  Role,
  RolePermission,
  User,
  UserRole,
} from "../domain/entities";
import {
  organizationsSeed,
  permissionsSeed,
  rolePermissionsSeed,
  rolesSeed,
  userRolesSeed,
  usersSeed,
} from "./seed";

export const organizationsRepository = createResourceRepository<Organization>({
  resource: "organizations",
  seed: organizationsSeed,
  softDelete: true,
});
export const usersRepository = createResourceRepository<User>({
  resource: "users",
  seed: usersSeed,
  softDelete: true,
});
export const rolesRepository = createResourceRepository<Role>({
  resource: "roles",
  seed: rolesSeed,
  softDelete: true,
});
export const permissionsRepository = createResourceRepository<Permission>({
  resource: "permissions",
  seed: permissionsSeed,
  softDelete: true,
});
export const rolePermissionsRepository = createResourceRepository<RolePermission>({
  resource: "role-permissions",
  seed: rolePermissionsSeed,
});
export const userRolesRepository = createResourceRepository<UserRole>({
  resource: "user-roles",
  seed: userRolesSeed,
});
