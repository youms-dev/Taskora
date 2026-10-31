import { MigrationInterface, QueryRunner } from "typeorm";

export class EditTask1793473030155 implements MigrationInterface {
    name = 'EditTask1793473030155'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "start_at"`);
        await queryRunner.query(`ALTER TABLE "task" ADD "start_at" bigint NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "start_at"`);
        await queryRunner.query(`ALTER TABLE "task" ADD "start_at" integer NOT NULL`);
    }

}
