import { MigrationInterface, QueryRunner } from "typeorm";

export class EditFolderUserRelation1793475076667 implements MigrationInterface {
    name = 'EditFolderUserRelation1793475076667'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "folder" DROP CONSTRAINT "FK_9a18cf718506a8ae9804aabd721"`);
        await queryRunner.query(`ALTER TABLE "folder" ALTER COLUMN "id_user" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "folder" ADD CONSTRAINT "FK_9a18cf718506a8ae9804aabd721" FOREIGN KEY ("id_user") REFERENCES "user"("id_user") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "folder" DROP CONSTRAINT "FK_9a18cf718506a8ae9804aabd721"`);
        await queryRunner.query(`ALTER TABLE "folder" ALTER COLUMN "id_user" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "folder" ADD CONSTRAINT "FK_9a18cf718506a8ae9804aabd721" FOREIGN KEY ("id_user") REFERENCES "user"("id_user") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
