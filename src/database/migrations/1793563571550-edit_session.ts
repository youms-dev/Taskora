import { MigrationInterface, QueryRunner } from "typeorm";

export class EditSession1793563571550 implements MigrationInterface {
    name = 'EditSession1793563571550'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "last_connection"`);
        await queryRunner.query(`ALTER TABLE "session" ADD "last_connection" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "last_connection"`);
        await queryRunner.query(`ALTER TABLE "session" ADD "last_connection" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "session" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
    }

}
