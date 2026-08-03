"use client";

import { useState } from "react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { AppShell } from "@/shared/ui/layout/app-shell";
import { Modal } from "@/shared/ui/modal";
import { Select } from "@/shared/ui/select";
import { Input } from "@/shared/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

const sidebarItems = [
  { label: "Painel", href: "#painel", active: true },
  { label: "Leads", href: "#leads" },
  { label: "Negócios", href: "#negocios" },
  { label: "Relatórios", href: "#relatorios" },
];

export default function ComponentsShowcasePage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <AppShell
      sidebarItems={sidebarItems}
      sidebarHeader={<span className="text-h5 font-bold text-foreground">StartCRM</span>}
      pageTitle="Componentes base"
      pageActions={<Button onClick={() => setModalOpen(true)}>Abrir modal</Button>}
    >
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <h2 className="text-h6 uppercase text-muted-foreground">Tipografia</h2>
          <p className="text-display">Display 56</p>
          <p className="text-h1">Gestão de leads</p>
          <p className="text-h2">Captação de leads</p>
          <p className="text-h3">Relatórios e integrações</p>
          <p className="text-h4">Funil de conversão</p>
          <p className="text-h5">Origem dos contatos</p>
          <p className="text-h6">Última sincronização</p>
          <p className="text-body text-muted-foreground">
            Organize leads do LinkedIn, Meta e Google em um só funil.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-h6 uppercase text-muted-foreground">Botões</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primário</Button>
            <Button variant="secondary">Secundário</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button disabled>Desabilitado</Button>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-h6 uppercase text-muted-foreground">Badges</h2>
          <div className="flex flex-wrap gap-3">
            <Badge variant="default">Novo</Badge>
            <Badge variant="success">Ganho</Badge>
            <Badge variant="muted">Arquivado</Badge>
          </div>
        </section>

        <section className="flex max-w-md flex-col gap-3">
          <h2 className="text-h6 uppercase text-muted-foreground">Formulário</h2>
          <Input label="Nome" placeholder="Maria Souza" />
          <Input label="E-mail" placeholder="maria@example.com" error="Campo obrigatório" />
          <Select label="Estágio do funil" defaultValue="novo">
            <option value="novo">Novo</option>
            <option value="qualificacao">Qualificação</option>
            <option value="proposta">Proposta</option>
          </Select>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-h6 uppercase text-muted-foreground">Card</h2>
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle>Leads captados</CardTitle>
              <CardDescription>Últimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-h2">1.284</p>
              <Badge variant="success">+18,4%</Badge>
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-h6 uppercase text-muted-foreground">Tabela</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Estágio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Maria Souza</TableCell>
                <TableCell>Site</TableCell>
                <TableCell>
                  <Badge>Novo</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>João Lima</TableCell>
                <TableCell>Indicação</TableCell>
                <TableCell>
                  <Badge variant="muted">Qualificação</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo lead">
        <div className="flex flex-col gap-4">
          <Input label="Nome" placeholder="Nome do lead" />
          <Input label="E-mail" placeholder="email@example.com" />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setModalOpen(false)}>Salvar</Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
