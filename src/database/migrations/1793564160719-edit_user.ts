import { MigrationInterface, QueryRunner } from "typeorm";

export class EditUser1793564160719 implements MigrationInterface {
    name = 'EditUser1793564160719'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_a6e3bf94a056b43228c14f5a221"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "id_setting" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_a6e3bf94a056b43228c14f5a221" FOREIGN KEY ("id_setting") REFERENCES "setting"("id_setting") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_a6e3bf94a056b43228c14f5a221"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "id_setting" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_a6e3bf94a056b43228c14f5a221" FOREIGN KEY ("id_setting") REFERENCES "setting"("id_setting") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
