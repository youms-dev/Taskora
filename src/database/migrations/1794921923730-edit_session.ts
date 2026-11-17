import { MigrationInterface, QueryRunner } from "typeorm";

export class EditSession1794921923730 implements MigrationInterface {
    name = 'EditSession1794921923730'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session" DROP CONSTRAINT "UQ_ebaa1ab789d49dd4c1deafd600f"`);
        await queryRunner.query(`ALTER TABLE "session" ALTER COLUMN "refresh_token" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session" ALTER COLUMN "refresh_token" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "session" ADD CONSTRAINT "UQ_ebaa1ab789d49dd4c1deafd600f" UNIQUE ("id_device")`);
    }

}
