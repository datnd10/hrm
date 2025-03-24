import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreateByForBranch1727359355594 implements MigrationInterface {
    name = 'AddCreateByForBranch1727359355594'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`branch\` ADD \`createdById\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`branch\` ADD CONSTRAINT \`FK_c8b6e72ddfdd41e7ff256b21658\` FOREIGN KEY (\`createdById\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`branch\` DROP FOREIGN KEY \`FK_c8b6e72ddfdd41e7ff256b21658\``);
        await queryRunner.query(`ALTER TABLE \`branch\` DROP COLUMN \`createdById\``);
    }

}
