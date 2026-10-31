import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFolderUserRelation1793474894968 implements MigrationInterface {
    name = 'AddFolderUserRelation1793474894968'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "folder" ADD "id_user" uuid`);
        await queryRunner.query(`ALTER TABLE "folder" ADD CONSTRAINT "FK_9a18cf718506a8ae9804aabd721" FOREIGN KEY ("id_user") REFERENCES "user"("id_user") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "folder" DROP CONSTRAINT "FK_9a18cf718506a8ae9804aabd721"`);
        await queryRunner.query(`ALTER TABLE "folder" DROP COLUMN "id_user"`);
    }

}
