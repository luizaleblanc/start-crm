import { randomUUID } from "crypto";
import type { BaseEntity, SoftDeletable } from "@/shared/domain/base-entity";
import type { PaginatedResult, PaginationParams } from "@/shared/domain/pagination";
import type { Repository } from "@/shared/domain/repository";

interface InMemoryRepositoryOptions {
  softDelete?: boolean;
}

export class InMemoryRepository<T extends BaseEntity> implements Repository<T> {
  private items: T[];
  private readonly softDelete: boolean;

  constructor(seed: T[], options: InMemoryRepositoryOptions = {}) {
    this.items = [...seed];
    this.softDelete = options.softDelete ?? false;
  }

  async list(
    { page, pageSize }: PaginationParams,
    filters?: Record<string, string>,
  ): Promise<PaginatedResult<T>> {
    let visible = this.softDelete
      ? this.items.filter((item) => (item as unknown as SoftDeletable).ativo !== false)
      : this.items;

    if (filters) {
      const entries = Object.entries(filters);
      visible = visible.filter((item) =>
        entries.every(([key, value]) => String((item as Record<string, unknown>)[key]) === value),
      );
    }

    const start = (page - 1) * pageSize;
    return {
      data: visible.slice(start, start + pageSize),
      meta: { page, pageSize, total: visible.length },
    };
  }

  async findById(id: string): Promise<T | undefined> {
    return this.items.find((item) => item.id === id);
  }

  async create(input: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T> {
    const now = new Date().toISOString();
    const record = { ...input, id: randomUUID(), createdAt: now, updatedAt: now } as T;
    this.items.push(record);
    return record;
  }

  async update(id: string, patch: Partial<Omit<T, "id" | "createdAt">>): Promise<T | undefined> {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) return undefined;
    const updated = {
      ...this.items[index],
      ...patch,
      updatedAt: new Date().toISOString(),
    } as T;
    this.items[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    if (this.softDelete) {
      return Boolean(await this.update(id, { ativo: false } as never));
    }
    const before = this.items.length;
    this.items = this.items.filter((item) => item.id !== id);
    return this.items.length < before;
  }
}
