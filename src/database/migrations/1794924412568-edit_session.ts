import { MigrationInterface, QueryRunner } from "typeorm";

export class EditSession1794924412568 implements MigrationInterface {
    name = 'EditSession1794924412568'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "refresh_token"`);
        await queryRunner.query(`ALTER TABLE "session" ADD "refresh_token" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "refresh_token"`);
        await queryRunner.query(`ALTER TABLE "session" ADD "refresh_token" character varying`);
    }

}
