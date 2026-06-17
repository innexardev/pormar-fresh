export type NfeItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
};

export type ParsedNfe = {
  accessKey?: string;
  number?: string;
  series?: string;
  supplierCnpj?: string;
  supplierName?: string;
  issueDate?: string;
  totalAmount?: number;
  items: NfeItem[];
};

function tag(xml: string, name: string): string | undefined {
  const re = new RegExp(`<${name}[^>]*>([^<]*)</${name}>`, 'i');
  const m = xml.match(re);
  return m?.[1]?.trim();
}

function tags(xml: string, name: string): string[] {
  const re = new RegExp(`<${name}[^>]*>([^<]*)</${name}>`, 'gi');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) out.push(m[1].trim());
  return out;
}

export function parseNfeXml(xml: string): ParsedNfe {
  const accessKey =
    tag(xml, 'chNFe') ??
    (xml.match(/Id="NFe(\d{44})"/i)?.[1] ?? undefined);

  const detBlocks = xml.match(/<det[\s\S]*?<\/det>/gi) ?? [];
  const items: NfeItem[] = detBlocks.map((block) => {
    const description = tag(block, 'xProd') ?? 'Item';
    const quantity = parseFloat(tag(block, 'qCom') ?? '0') || 0;
    const unit = tag(block, 'uCom') ?? 'un';
    const unitPrice = parseFloat(tag(block, 'vUnCom') ?? '0') || 0;
    const total = parseFloat(tag(block, 'vProd') ?? '0') || quantity * unitPrice;
    return { description, quantity, unit, unitPrice, total };
  });

  return {
    accessKey,
    number: tag(xml, 'nNF'),
    series: tag(xml, 'serie'),
    supplierCnpj: tag(xml, 'CNPJ') ?? tags(xml, 'CNPJ')[0],
    supplierName: tag(xml, 'xNome'),
    issueDate: tag(xml, 'dhEmi')?.slice(0, 10) ?? tag(xml, 'dEmi'),
    totalAmount: parseFloat(tag(xml, 'vNF') ?? '0') || undefined,
    items,
  };
}
