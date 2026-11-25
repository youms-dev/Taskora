import { MigrationInterface, QueryRunner } from "typeorm";

export class EditSession1795613226825 implements MigrationInterface {
    name = 'EditSession1795613226825'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session" ADD "device_model" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "device_model"`);
    }

}
