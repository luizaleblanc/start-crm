import type { SoftDeletable, Timestamps } from "@/shared/domain/base-entity";

export interface Organization extends Timestamps, SoftDeletable {
  id: string;
  name: string;
  slug: string;
}

export interface User extends Timestamps, SoftDeletable {
  id: string;
  organizationId: string;
  name: string;
  email: string;
}

export interface Role extends Timestamps, SoftDeletable {
  id: string;
  organizationId: string;
  name: string;
}

export interface Permission extends Timestamps, SoftDeletable {
  id: string;
  code: string;
  description: string;
}

export interface RolePermission extends Timestamps {
  id: string;
  roleId: string;
  permissionId: string;
}

export interface UserRole extends Timestamps {
  id: string;
  userId: string;
  roleId: string;
}
