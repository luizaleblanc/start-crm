export interface Identifiable {
  id: string;
}

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface SoftDeletable {
  ativo: boolean;
}

export type BaseEntity = Identifiable & Timestamps;
