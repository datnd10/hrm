import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeBranch1727360043771 implements MigrationInterface {
    name = 'ChangeBranch1727360043771'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_9da5f39f293fe9d07dcc8fd9a0\` ON \`branch\` (\`branchName\`, \`email\`, \`phoneNumber\`, \`taxCode\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_9da5f39f293fe9d07dcc8fd9a0\` ON \`branch\``);
    }

}
