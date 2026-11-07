import { MigrationInterface, QueryRunner } from "typeorm";

export class EditSession1794060846760 implements MigrationInterface {
    name = 'EditSession1794060846760'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "provider"`);
        await queryRunner.query(`CREATE TYPE "public"."session_provider_enum" AS ENUM('Google', 'Facebook', 'LINKEDIN')`);
        await queryRunner.query(`ALTER TABLE "session" ADD "provider" "public"."session_provider_enum"`);
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "type"`);
        await queryRunner.query(`CREATE TYPE "public"."session_type_enum" AS ENUM('IOS', 'ANDROID')`);
        await queryRunner.query(`ALTER TABLE "session" ADD "type" "public"."session_type_enum" NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."session_type_enum"`);
        await queryRunner.query(`ALTER TABLE "session" ADD "type" character varying`);
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "provider"`);
        await queryRunner.query(`DROP TYPE "public"."session_provider_enum"`);
        await queryRunner.query(`ALTER TABLE "session" ADD "provider" character varying`);
    }

}
