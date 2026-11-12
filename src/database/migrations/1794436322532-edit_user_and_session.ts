import { MigrationInterface, QueryRunner } from "typeorm";

export class EditUserAndSession1794436322532 implements MigrationInterface {
    name = 'EditUserAndSession1794436322532'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "provider"`);
        await queryRunner.query(`DROP TYPE "public"."session_provider_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."user_provider_enum" AS ENUM('GOOGLE')`);
        await queryRunner.query(`ALTER TABLE "user" ADD "provider" "public"."user_provider_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "provider"`);
        await queryRunner.query(`DROP TYPE "public"."user_provider_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."session_provider_enum" AS ENUM('GOOGLE', 'FACEBOOK', 'LINKEDIN')`);
        await queryRunner.query(`ALTER TABLE "session" ADD "provider" "public"."session_provider_enum"`);
    }

}
