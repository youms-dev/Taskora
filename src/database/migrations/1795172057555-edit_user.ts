import { MigrationInterface, QueryRunner } from "typeorm";

export class EditUser1795172057555 implements MigrationInterface {
    name = 'EditUser1795172057555'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "photo"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "photo" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "photo"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "photo" character varying`);
    }

}
