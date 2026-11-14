import { MigrationInterface, QueryRunner } from "typeorm";

export class EditSession1794687475271 implements MigrationInterface {
    name = 'EditSession1794687475271'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "brand"`);
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."session_type_enum"`);
        await queryRunner.query(`ALTER TABLE "session" ALTER COLUMN "device_brand" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "session" ALTER COLUMN "device_type" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session" ALTER COLUMN "device_type" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "session" ALTER COLUMN "device_brand" DROP NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."session_type_enum" AS ENUM('IOS', 'ANDROID')`);
        await queryRunner.query(`ALTER TABLE "session" ADD "type" "public"."session_type_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "session" ADD "brand" character varying NOT NULL`);
    }

}
