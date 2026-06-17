import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards';
import { AdminOnlyGuard } from '../common/driver.guards';
import { StaffService } from './staff.service';

@Controller('admin/staff')
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
export class StaffController {
  constructor(private staff: StaffService) {}

  @Get()
  list() {
    return this.staff.list();
  }

  @Post()
  create(
    @Body()
    body: {
      email: string;
      password: string;
      full_name: string;
      phone?: string;
      role?: string;
      send_whatsapp?: boolean;
    },
  ) {
    return this.staff.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: { full_name?: string; phone?: string; role?: string; active?: boolean },
  ) {
    return this.staff.update(id, body);
  }

  @Post(':id/reset-password')
  resetPassword(
    @Param('id') id: string,
    @Body() body: { password: string; send_whatsapp?: boolean },
  ) {
    return this.staff.resetPassword(id, body.password, body.send_whatsapp ?? false);
  }

  @Post(':id/send-credentials')
  sendCredentials(@Param('id') id: string, @Body() body: { password?: string }) {
    return this.staff.sendCredentialsById(id, body.password);
  }
}
