import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { isZipInDeliveryArea, parseDeliveryZipPrefixes } from '../common/delivery-area';

export type DeliveryQuote = {
  allowed: boolean;
  delivery_fee: number;
  zone_label?: string;
  message?: string;
};

@Injectable()
export class DeliveryZonesService {
  constructor(private prisma: PrismaService) {}

  async quoteAddress(address: {
    zip_code: string;
    neighborhood?: string;
    city?: string;
  }): Promise<DeliveryQuote> {
    const zip = address.zip_code.replace(/\D/g, '');
    const settings = await this.prisma.storeSettings.findUnique({ where: { id: 'default' } });
    const defaultFee = Number(settings?.deliveryFee ?? 12);

    const zones = await this.prisma.deliveryZone.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (zones.length > 0) {
      const neighborhood = address.neighborhood ?? '';
      for (const zone of zones) {
        const prefixes = (zone.zipPrefixes as string[]) ?? [];
        const neighborhoods = (zone.neighborhoods as string[]) ?? [];
        const zipMatch = prefixes.length === 0 || prefixes.some((p) => zip.startsWith(p.replace(/\D/g, '')));
        const hoodMatch = this.matchesNeighborhood(neighborhood, neighborhoods);
        if (zipMatch && hoodMatch) {
          return {
            allowed: true,
            delivery_fee: Number(zone.deliveryFee),
            zone_label: zone.label,
          };
        }
      }
      return { allowed: false, delivery_fee: defaultFee, message: 'Endereco fora da area de entrega' };
    }

    const envPrefixes = parseDeliveryZipPrefixes(process.env.DELIVERY_ZIP_PREFIXES);
    if (!isZipInDeliveryArea(address.zip_code, envPrefixes)) {
      return { allowed: false, delivery_fee: defaultFee, message: 'CEP fora da area de entrega' };
    }

    return { allowed: true, delivery_fee: defaultFee };
  }

  listAdmin() {
    return this.prisma.deliveryZone.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  create(data: {
    label: string;
    zipPrefixes: string[];
    neighborhoods?: string[];
    deliveryFee: number;
    sortOrder?: number;
  }) {
    return this.prisma.deliveryZone.create({
      data: {
        label: data.label,
        zipPrefixes: data.zipPrefixes,
        neighborhoods: data.neighborhoods ?? [],
        deliveryFee: data.deliveryFee,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  update(
    id: string,
    data: Partial<{
      label: string;
      zipPrefixes: string[];
      neighborhoods: string[];
      deliveryFee: number;
      active: boolean;
      sortOrder: number;
    }>,
  ) {
    return this.prisma.deliveryZone.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.deliveryZone.delete({ where: { id } });
  }

  listPublic() {
    return this.prisma.deliveryZone
      .findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          label: true,
          deliveryFee: true,
          zipPrefixes: true,
          neighborhoods: true,
        },
      })
      .then((zones) =>
        zones.map((z) => ({
          label: z.label,
          delivery_fee: Number(z.deliveryFee),
          zip_prefixes: (z.zipPrefixes as string[]) ?? [],
          neighborhoods: (z.neighborhoods as string[]) ?? [],
        })),
      );
  }

  private matchesNeighborhood(address: string, allowed: string[]): boolean {
    if (allowed.length === 0) return true;
    const norm = address.toLowerCase().trim();
    if (!norm) return false;
    return allowed.some((n) => {
      const key = n.toLowerCase().trim();
      return norm === key || norm.includes(key) || key.includes(norm);
    });
  }

  async lookupCep(cep: string) {
    const zip = cep.replace(/\D/g, '');
    if (zip.length !== 8) throw new BadRequestException('CEP invalido');
    const res = await fetch(`https://viacep.com.br/ws/${zip}/json/`);
    const data = (await res.json()) as {
      erro?: boolean;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
    };
    if (data.erro) throw new BadRequestException('CEP nao encontrado');
    const quote = await this.quoteAddress({
      zip_code: zip,
      neighborhood: data.bairro,
      city: data.localidade,
    });
    return {
      zip_code: zip,
      street: data.logradouro ?? '',
      neighborhood: data.bairro ?? '',
      city: data.localidade ?? '',
      state: data.uf ?? '',
      delivery: quote,
    };
  }

  async importFromCsv(csv: string): Promise<{ imported: number; errors: string[] }> {
    const lines = csv.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) {
      throw new BadRequestException('CSV vazio — use cabecalho + linhas');
    }

    const errors: string[] = [];
    let imported = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = this.parseCsvLine(lines[i]);
      if (cols.length < 4) {
        errors.push(`Linha ${i + 1}: colunas insuficientes`);
        continue;
      }
      const [label, zipRaw, hoodRaw, feeRaw, sortRaw] = cols;
      try {
        await this.create({
          label: label.trim(),
          zipPrefixes: zipRaw.split(';').map((s) => s.trim()).filter(Boolean),
          neighborhoods: hoodRaw ? hoodRaw.split(';').map((s) => s.trim()).filter(Boolean) : [],
          deliveryFee: Number(feeRaw.replace(',', '.')),
          sortOrder: sortRaw ? Number(sortRaw) : i,
        });
        imported++;
      } catch (e) {
        errors.push(`Linha ${i + 1}: ${e instanceof Error ? e.message : 'erro'}`);
      }
    }

    return { imported, errors };
  }

  exportCsv(): Promise<string> {
    return this.listAdmin().then((zones) => {
      const header = 'label,zip_prefixes,neighborhoods,delivery_fee,sort_order,active';
      const rows = zones.map((z) => {
        const prefixes = ((z.zipPrefixes as string[]) ?? []).join(';');
        const hoods = ((z.neighborhoods as string[]) ?? []).join(';');
        return `"${z.label}","${prefixes}","${hoods}",${Number(z.deliveryFee)},${z.sortOrder},${z.active}`;
      });
      return [header, ...rows].join('\n');
    });
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }
}
