import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateOrganizationDto } from '@shared/dto/organization/create-organization.dto';
import { UpdateOrganizationDto } from '@shared/dto/organization/update-organization.dto';
import { Organization } from '@shared/entities/organization.entity';
import { User } from '@shared/entities/user.entity';
import { Not, Repository } from 'typeorm';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization) private readonly organizationRepo: Repository<Organization>,
  ) { }
  async create(createOrganizationDto: CreateOrganizationDto) {

    // const { organizationName } = createOrganizationDto;

    // // Check if the organization name already exists
    // const existingOrganization = await this.organizationRepo.findOne({ where: { organizationName } });

    // if (existingOrganization) {
    //   throw new ConflictException({
    //     message: {
    //       organizationName: 'Tên tổ chức đã tồn tại trong hệ thống.',
    //     }
    //   });
    // }

    // Create an organization entity from the DTO
    const organization = this.organizationRepo.create(createOrganizationDto);

    // Save the organization entity
    return await this.organizationRepo.save(organization);
  }

  async findAll() {
    return await this.organizationRepo.find();
  }
  async findOne(id: number) {
    const organization = await this.organizationRepo.findOne({ where: { id } });

    if (!organization) {
      throw new NotFoundException('Tên tổ chức không tồn tại trong hệ thống.');
    }

    return organization;
  }


  async update(id: number, updateOrganizationDto: UpdateOrganizationDto) {
    const { organizationName } = updateOrganizationDto;

    // Find the organization by ID
    const organization = await this.findOne(id);

    // Check if the new organization name already exists, but ignore the current organization
    const existingOrganization = await this.organizationRepo.findOne({
      where: { organizationName, id: Not(id) }  // Ensures it doesn't check the same record
    });

    if (existingOrganization) {
      throw new ConflictException({
        message: {
          organizationName: 'Tên tổ chức đã tồn tại trong hệ thống.',
        }
      });
    }

    // Update organization data
    organization.organizationName = organizationName;

    // Save the updated organization
    return await this.organizationRepo.save(organization);
  }


  async remove(id: number) {
    // Find the organization by ID
    const organization = await this.findOne(id);

    // Delete the organization
    await this.organizationRepo.remove(organization);

    return { message: 'Xóa thành công.' };
  }

}
