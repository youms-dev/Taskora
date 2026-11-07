import { MigrationInterface, QueryRunner } from "typeorm";

export class EditSession1794063089263 implements MigrationInterface {
    name = 'EditSession1794063089263'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."session_provider_enum" RENAME TO "session_provider_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."session_provider_enum" AS ENUM('GOOGLE', 'FACEBOOK', 'LINKEDIN')`);
        await queryRunner.query(`ALTER TABLE "session" ALTER COLUMN "provider" TYPE "public"."session_provider_enum" USING "provider"::"text"::"public"."session_provider_enum"`);
        await queryRunner.query(`DROP TYPE "public"."session_provider_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."session_provider_enum_old" AS ENUM('Google', 'Facebook', 'LINKEDIN')`);
        await queryRunner.query(`ALTER TABLE "session" ALTER COLUMN "provider" TYPE "public"."session_provider_enum_old" USING "provider"::"text"::"public"."session_provider_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."session_provider_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."session_provider_enum_old" RENAME TO "session_provider_enum"`);
    }

}
