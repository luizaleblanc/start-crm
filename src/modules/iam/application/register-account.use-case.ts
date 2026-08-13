import { randomUUID } from "crypto";
import { credentialExists, saveCredential } from "../infrastructure/auth-credentials.mock";
import {
  organizationsRepository,
  permissionsRepository,
  rolePermissionsRepository,
  rolesRepository,
  userRolesRepository,
  usersRepository,
} from "../infrastructure/repositories";
import { hashPassword, isStrongPassword } from "@/shared/infrastructure/auth/password";
import { ApiError } from "@/shared/infrastructure/http/api-error";

interface RegisterAccountInput {
  name: string;
  organizationName: string;
  email: string;
  password: string;
}

const DIACRITICS_PATTERN = new RegExp(
  "[" + String.fromCharCode(0x0300) + "-" + String.fromCharCode(0x036f) + "]",
  "g",
);

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(DIACRITICS_PATTERN, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function registerAccount(input: RegisterAccountInput) {
  const { name, organizationName, email, password } = input;

  if (!name || !organizationName || !email || !password) {
    throw new ApiError(400, "Nome, empresa, e-mail e senha são obrigatórios");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, "E-mail inválido");
  }
  if (!isStrongPassword(password)) {
    throw new ApiError(400, "Senha deve ter ao menos 8 caracteres, com letras e números");
  }

  const existingUsers = await usersRepository.list({ page: 1, pageSize: 1 }, { email });
  if (existingUsers.data.length > 0 || credentialExists(email)) {
    throw new ApiError(409, "Já existe uma conta com este e-mail");
  }

  const baseSlug = slugify(organizationName) || "empresa";
  let slug = baseSlug;
  const slugTaken = await organizationsRepository.list({ page: 1, pageSize: 1 }, { slug });
  if (slugTaken.data.length > 0) {
    slug = `${baseSlug}-${randomUUID().slice(0, 4)}`;
  }

  const organization = await organizationsRepository.create({
    name: organizationName,
    slug,
    ativo: true,
  });

  try {
    const role = await rolesRepository.create({
      organizationId: organization.id,
      name: "Admin",
      ativo: true,
    });

    const adminPermission = await permissionsRepository.list(
      { page: 1, pageSize: 1 },
      { code: "*" },
    );
    const [permission] = adminPermission.data;
    if (permission) {
      await rolePermissionsRepository.create({
        roleId: role.id,
        permissionId: permission.id,
      });
    }

    const user = await usersRepository.create({
      organizationId: organization.id,
      name,
      email,
      ativo: true,
    });

    await userRolesRepository.create({ userId: user.id, roleId: role.id });

    saveCredential(email, { userId: user.id, passwordHash: hashPassword(password) });

    return { organization, user };
  } catch (error) {
    await organizationsRepository.delete(organization.id).catch(() => undefined);
    throw error;
  }
}
