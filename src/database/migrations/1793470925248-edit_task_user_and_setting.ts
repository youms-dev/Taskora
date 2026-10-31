import { MigrationInterface, QueryRunner } from "typeorm";

export class EditTaskUserAndSetting1793470925248 implements MigrationInterface {
    name = 'EditTaskUserAndSetting1793470925248'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "notification_id"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "name" character varying`);
        await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "task" ADD "title" text`);
        await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "content"`);
        await queryRunner.query(`ALTER TABLE "task" ADD "content" text`);
        await queryRunner.query(`ALTER TABLE "task" ALTER COLUMN "icon" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "task" ALTER COLUMN "done" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "task" ALTER COLUMN "done" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task" ALTER COLUMN "done" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "task" ALTER COLUMN "done" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "task" ALTER COLUMN "icon" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "content"`);
        await queryRunner.query(`ALTER TABLE "task" ADD "content" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "task" ADD "title" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "task" ADD "notification_id" character varying NOT NULL`);
    }

}
