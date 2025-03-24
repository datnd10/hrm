import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTime1727258045551 implements MigrationInterface {
    name = 'AddTime1727258045551'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`position\` DROP COLUMN \`status\``);
        await queryRunner.query(`ALTER TABLE \`department\` DROP COLUMN \`status\``);
        await queryRunner.query(`ALTER TABLE \`branch\` DROP COLUMN \`status\``);
        await queryRunner.query(`ALTER TABLE \`attendance\` ADD \`createAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`position\` ADD \`isActive\` tinyint NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`position\` ADD \`deleteAt\` timestamp(6) NULL`);
        await queryRunner.query(`ALTER TABLE \`department\` ADD \`isActive\` tinyint NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`department\` ADD \`deleteAt\` timestamp(6) NULL`);
        await queryRunner.query(`ALTER TABLE \`branch\` ADD \`isActive\` tinyint NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`branch\` ADD \`deleteAt\` timestamp(6) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`branch\` DROP COLUMN \`deleteAt\``);
        await queryRunner.query(`ALTER TABLE \`branch\` DROP COLUMN \`isActive\``);
        await queryRunner.query(`ALTER TABLE \`department\` DROP COLUMN \`deleteAt\``);
        await queryRunner.query(`ALTER TABLE \`department\` DROP COLUMN \`isActive\``);
        await queryRunner.query(`ALTER TABLE \`position\` DROP COLUMN \`deleteAt\``);
        await queryRunner.query(`ALTER TABLE \`position\` DROP COLUMN \`isActive\``);
        await queryRunner.query(`ALTER TABLE \`attendance\` DROP COLUMN \`createAt\``);
        await queryRunner.query(`ALTER TABLE \`branch\` ADD \`status\` tinyint NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`department\` ADD \`status\` tinyint NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`position\` ADD \`status\` tinyint NOT NULL DEFAULT 1`);
    }

}
