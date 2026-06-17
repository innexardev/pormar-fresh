import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  list(search?: string) {
    const where: Prisma.SupplierWhereInput = search
      ? {
          OR: [
            { legalName: { contains: search, mode: 'insensitive' } },
            { tradeName: { contains: search, mode: 'insensitive' } },
            { cnpj: { contains: search.replace(/\D/g, '') } },
          ],
        }
      : {};

    return this.prisma.supplier.findMany({
      where,
      orderBy: { legalName: 'asc' },
      include: { _count: { select: { purchases: true, invoices: true } } },
    });
  }

  get(id: string) {
    return this.prisma.supplier.findUnique({
      where: { id },
      include: {
        invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
        purchases: { orderBy: { purchaseDate: 'desc' }, take: 10, include: { ingredient: true } },
      },
    });
  }

  create(data: {
    legalName: string;
    tradeName?: string;
    cnpj?: string;
    phone?: string;
    email?: string;
    contactName?: string;
    categories?: string[];
    paymentTerms?: string;
    notes?: string;
  }) {
    return this.prisma.supplier.create({
      data: {
        ...data,
        cnpj: data.cnpj?.replace(/\D/g, '') || undefined,
        categories: data.categories ?? [],
      },
    });
  }

  update(
    id: string,
    data: Partial<{
      legalName: string;
      tradeName: string;
      cnpj: string;
      phone: string;
      email: string;
      contactName: string;
      categories: string[];
      paymentTerms: string;
      notes: string;
      active: boolean;
    }>,
  ) {
    return this.prisma.supplier.update({
      where: { id },
      data: {
        ...data,
        cnpj: data.cnpj?.replace(/\D/g, ''),
      },
    });
  }

  delete(id: string) {
    return this.prisma.supplier.update({ where: { id }, data: { active: false } });
  }

  async findOrCreateByCnpj(cnpj: string, name: string) {
    const clean = cnpj.replace(/\D/g, '');
    let supplier = await this.prisma.supplier.findUnique({ where: { cnpj: clean } });
    if (!supplier) {
      supplier = await this.prisma.supplier.create({
        data: { legalName: name, cnpj: clean, categories: ['hortifruti'] },
      });
    }
    return supplier;
  }
}

@Injectable()
export class PurchaseInvoicesService {
  constructor(
    private prisma: PrismaService,
    private suppliers: SuppliersService,
  ) {}

  list(status?: string) {
    return this.prisma.purchaseInvoice.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { supplier: true },
      take: 100,
    });
  }

  get(id: string) {
    return this.prisma.purchaseInvoice.findUnique({
      where: { id },
      include: { supplier: true, purchases: { include: { ingredient: true } } },
    });
  }

  async createFromXml(xml: string, fileUrl?: string) {
    const { parseNfeXml } = await import('./nfe-parser');
    const parsed = parseNfeXml(xml);

    let supplierId: string | undefined;
    if (parsed.supplierCnpj && parsed.supplierName) {
      const supplier = await this.suppliers.findOrCreateByCnpj(parsed.supplierCnpj, parsed.supplierName);
      supplierId = supplier.id;
    }

    if (parsed.accessKey) {
      const existing = await this.prisma.purchaseInvoice.findUnique({
        where: { accessKey: parsed.accessKey },
      });
      if (existing) return existing;
    }

    return this.prisma.purchaseInvoice.create({
      data: {
        supplierId,
        number: parsed.number,
        series: parsed.series,
        accessKey: parsed.accessKey,
        issueDate: parsed.issueDate ? new Date(parsed.issueDate) : undefined,
        totalAmount: parsed.totalAmount,
        fileUrl,
        fileType: 'xml',
        status: 'pending',
        rawData: parsed as unknown as Prisma.InputJsonValue,
      },
      include: { supplier: true },
    });
  }

  async updateStatus(id: string, status: string, notes?: string) {
    const invoice = await this.prisma.purchaseInvoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Nota nao encontrada');
    return this.prisma.purchaseInvoice.update({
      where: { id },
      data: { status, notes: notes ?? invoice.notes },
    });
  }
}
