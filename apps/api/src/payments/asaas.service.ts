import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type AsaasCustomer = { id: string };
type AsaasPayment = {
  id: string;
  status: string;
  invoiceUrl?: string;
  pixTransaction?: { payload?: string; encodedImage?: string };
};

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);

  constructor(private config: ConfigService) {}

  isEnabled(): boolean {
    return Boolean(this.config.get<string>('ASAAS_API_KEY'));
  }

  private baseUrl(): string {
    const sandbox = this.config.get<string>('ASAAS_SANDBOX', 'true') !== 'false';
    return sandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/api/v3';
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      access_token: this.config.get<string>('ASAAS_API_KEY') ?? '',
    };
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl()}${path}`, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = (await res.json()) as T & { errors?: Array<{ description: string }> };
    if (!res.ok) {
      const msg = (data as { errors?: Array<{ description: string }> }).errors?.[0]?.description ?? res.statusText;
      throw new Error(`Asaas: ${msg}`);
    }
    return data;
  }

  async findOrCreateCustomer(input: {
    name: string;
    phone: string;
    email?: string;
    externalReference: string;
  }): Promise<string> {
    const existing = await this.request<{ data: AsaasCustomer[] }>(
      'GET',
      `/customers?externalReference=${encodeURIComponent(input.externalReference)}&limit=1`,
    );
    if (existing.data?.[0]?.id) return existing.data[0].id;

    const created = await this.request<AsaasCustomer>('POST', '/customers', {
      name: input.name,
      mobilePhone: input.phone.replace(/\D/g, '').slice(-11),
      email: input.email,
      externalReference: input.externalReference,
      notificationDisabled: true,
    });
    return created.id;
  }

  async createPixPayment(input: {
    customerId: string;
    value: number;
    externalReference: string;
    description: string;
  }): Promise<AsaasPayment> {
    const dueDate = new Date().toISOString().slice(0, 10);
    return this.request<AsaasPayment>('POST', '/payments', {
      customer: input.customerId,
      billingType: 'PIX',
      value: input.value,
      dueDate,
      externalReference: input.externalReference,
      description: input.description,
    });
  }

  async getPayment(paymentId: string): Promise<AsaasPayment> {
    return this.request<AsaasPayment>('GET', `/payments/${paymentId}`);
  }

  verifyWebhookToken(token: string | undefined): boolean {
    const expected = this.config.get<string>('ASAAS_WEBHOOK_TOKEN');
    if (!expected) return true;
    return token === expected;
  }

  isPaidEvent(event: string): boolean {
    return ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'].includes(event);
  }
}
