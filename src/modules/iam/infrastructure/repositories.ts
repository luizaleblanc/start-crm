import { InMemoryRepository } from "@/shared/infrastructure/mock/in-memory-repository";
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

export const organizationsRepository = new InMemoryRepository<Organization>(organizationsSeed, {
  softDelete: true,
});
export const usersRepository = new InMemoryRepository<User>(usersSeed, { softDelete: true });
export const rolesRepository = new InMemoryRepository<Role>(rolesSeed, { softDelete: true });
export const permissionsRepository = new InMemoryRepository<Permission>(permissionsSeed, {
  softDelete: true,
});
export const rolePermissionsRepository = new InMemoryRepository<RolePermission>(
  rolePermissionsSeed,
);
export const userRolesRepository = new InMemoryRepository<UserRole>(userRolesSeed);
