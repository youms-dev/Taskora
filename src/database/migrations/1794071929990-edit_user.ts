import { MigrationInterface, QueryRunner } from "typeorm";

export class EditUser1794071929990 implements MigrationInterface {
    name = 'EditUser1794071929990'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "photo" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "photo"`);
    }

}
