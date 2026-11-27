import { MigrationInterface, QueryRunner } from "typeorm";

export class EditSession1795779362184 implements MigrationInterface {
    name = 'EditSession1795779362184'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session" ADD "sync_cursor" BIGSERIAL NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "sync_cursor"`);
    }

}
