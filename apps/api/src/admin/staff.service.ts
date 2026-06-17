import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../notifications/whatsapp.service';

const ROLES = ['admin', 'staff'] as const;
export type StaffRole = (typeof ROLES)[number];

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  staff: 'Operação',
};

@Injectable()
export class StaffService {
  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsappService,
    private config: ConfigService,
  ) {}

  private adminPanelUrl() {
    const explicit = this.config.get<string>('ADMIN_PANEL_URL');
    if (explicit) return explicit.replace(/\/$/, '');
    const domain = this.config.get<string>('DOMAIN', 'onnshoppe.com');
    return `https://admin.${domain}`;
  }

  private formatUser(u: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    role: string;
    active: boolean;
    createdAt: Date;
  }) {
    return {
      user_id: u.id,
      email: u.email,
      full_name: u.fullName,
      phone: u.phone,
      role: u.role,
      role_label: ROLE_LABEL[u.role] ?? u.role,
      active: u.active,
      created_at: u.createdAt.toISOString(),
    };
  }

  async list() {
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return users.map((u) => this.formatUser(u));
  }

  async create(data: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role?: string;
    send_whatsapp?: boolean;
  }) {
    const email = data.email.trim().toLowerCase();
    if (!email.includes('@')) throw new BadRequestException('E-mail invalido');
    if (data.password.length < 6) throw new BadRequestException('Senha minimo 6 caracteres');

    const role = data.role ?? 'staff';
    if (!ROLES.includes(role as StaffRole)) {
      throw new BadRequestException('Papel invalido');
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('E-mail ja cadastrado');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: data.full_name.trim(),
        phone: data.phone?.replace(/\D/g, '') || null,
        role,
      },
    });

    let whatsapp_sent = false;
    if (data.send_whatsapp && user.phone) {
      whatsapp_sent = await this.sendCredentials(user.fullName, user.email, user.phone, data.password);
    }

    return { ...this.formatUser(user), whatsapp_sent };
  }

  async update(
    id: string,
    data: { full_name?: string; phone?: string; role?: string; active?: boolean },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Funcionario nao encontrado');

    if (data.role && !ROLES.includes(data.role as StaffRole)) {
      throw new BadRequestException('Papel invalido');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        fullName: data.full_name?.trim(),
        phone: data.phone != null ? data.phone.replace(/\D/g, '') || null : undefined,
        role: data.role,
        active: data.active,
      },
    });

    return this.formatUser(updated);
  }

  async resetPassword(id: string, password: string, sendWhatsapp = false) {
    if (password.length < 6) throw new BadRequestException('Senha minimo 6 caracteres');
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Funcionario nao encontrado');

    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });

    let whatsapp_sent = false;
    if (sendWhatsapp && user.phone) {
      whatsapp_sent = await this.sendCredentials(user.fullName, user.email, user.phone, password);
    }

    return { ok: true, whatsapp_sent };
  }

  async sendCredentialsById(id: string, password?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Funcionario nao encontrado');
    if (!user.phone) throw new BadRequestException('Funcionario sem celular cadastrado');

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    }

    const sent = await this.sendCredentials(
      user.fullName,
      user.email,
      user.phone,
      password ?? '(use a senha que voce definiu)',
      !password,
    );

    return { ok: sent, whatsapp_sent: sent };
  }

  private async sendCredentials(
    name: string,
    email: string,
    phone: string,
    password: string,
    passwordAlreadySet = false,
  ): Promise<boolean> {
    const panelUrl = this.adminPanelUrl();
    const lines = [
      `Olá, ${name}! 👋`,
      '',
      'Seu acesso ao *Painel Pomar Fresh* foi criado:',
      '',
      `🔗 Link: ${panelUrl}`,
      `📧 E-mail: ${email}`,
      passwordAlreadySet
        ? '🔑 Use a senha que você recebeu ou peça uma nova ao administrador.'
        : `🔑 Senha: ${password}`,
      '',
      'Guarde estas informações em local seguro.',
      '',
      '_Pomar Fresh — equipe_',
    ];

    await this.whatsapp.sendText(phone, lines.join('\n'), 'staff_credentials');
    return this.whatsapp.isEnabled();
  }
}
