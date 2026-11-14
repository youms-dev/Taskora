import { MigrationInterface, QueryRunner } from "typeorm";

export class EditSession1794686585197 implements MigrationInterface {
    name = 'EditSession1794686585197'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session" ADD "device_brand" character varying`);
        await queryRunner.query(`CREATE TYPE "public"."session_device_type_enum" AS ENUM('IOS', 'ANDROID')`);
        await queryRunner.query(`ALTER TABLE "session" ADD "device_type" "public"."session_device_type_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "device_type"`);
        await queryRunner.query(`DROP TYPE "public"."session_device_type_enum"`);
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "device_brand"`);
    }

}
