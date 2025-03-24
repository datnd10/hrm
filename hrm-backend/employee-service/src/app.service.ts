import { Injectable } from '@nestjs/common';
import { COMPANY_TOPIC } from '@shared/constants/constants'
@Injectable()
export class AppService {
  getHello(): string {
    const string = COMPANY_TOPIC + 'company/add';
    return string;
  }
}
