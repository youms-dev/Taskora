import { MigrationInterface, QueryRunner } from "typeorm";

export class EditTaskAndFolder1793473325626 implements MigrationInterface {
    name = 'EditTaskAndFolder1793473325626'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "FK_e848f634f39be6f058b972b040d"`);
        await queryRunner.query(`ALTER TABLE "task" ALTER COLUMN "pinned" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "task" ADD CONSTRAINT "FK_e848f634f39be6f058b972b040d" FOREIGN KEY ("id_folder") REFERENCES "folder"("id_folder") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "FK_e848f634f39be6f058b972b040d"`);
        await queryRunner.query(`ALTER TABLE "task" ALTER COLUMN "pinned" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "task" ADD CONSTRAINT "FK_e848f634f39be6f058b972b040d" FOREIGN KEY ("id_folder") REFERENCES "folder"("id_folder") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
