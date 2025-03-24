import { PartialType } from '@nestjs/mapped-types';
import { CreateOrganizationDto } from './create-organization.dto';

// Đảm bảo rằng bạn import đúng entity

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) { }
