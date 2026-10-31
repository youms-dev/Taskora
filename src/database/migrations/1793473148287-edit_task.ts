import { MigrationInterface, QueryRunner } from "typeorm";

export class EditTask1793473148287 implements MigrationInterface {
    name = 'EditTask1793473148287'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task" ALTER COLUMN "pinned" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task" ALTER COLUMN "pinned" SET NOT NULL`);
    }

}
