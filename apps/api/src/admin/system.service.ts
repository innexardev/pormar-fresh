import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../storage/storage.service';
import { AsaasService } from '../payments/asaas.service';
import { WhatsappService } from '../notifications/whatsapp.service';

import { PushService } from '../notifications/push.service';

@Injectable()
export class SystemService {
  constructor(
    private config: ConfigService,
    private storage: StorageService,
    private asaas: AsaasService,
    private whatsapp: WhatsappService,
    private push: PushService,
  ) {}

  getStatus() {
    return {
      minio: this.storage.isEnabled(),
      asaas: this.asaas.isEnabled(),
      asaas_sandbox: this.config.get('ASAAS_SANDBOX', 'true') !== 'false',
      whatsapp: this.whatsapp.isEnabled(),
      push: this.push.isEnabled(),
      delivery_zip_env: Boolean(this.config.get('DELIVERY_ZIP_PREFIXES')?.trim()),
    };
  }
}
