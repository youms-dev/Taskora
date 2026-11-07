import { MigrationInterface, QueryRunner } from "typeorm";

export class EditSession1794060217224 implements MigrationInterface {
    name = 'EditSession1794060217224'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session" ADD "id_device" character varying`);
        await queryRunner.query(`ALTER TABLE "session" ADD CONSTRAINT "UQ_ebaa1ab789d49dd4c1deafd600f" UNIQUE ("id_device")`);
        await queryRunner.query(`ALTER TABLE "session" ADD "type" character varying`);
        await queryRunner.query(`ALTER TABLE "session" ALTER COLUMN "device_name" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "session" ALTER COLUMN "brand" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session" ALTER COLUMN "brand" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "session" ALTER COLUMN "device_name" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "type"`);
        await queryRunner.query(`ALTER TABLE "session" DROP CONSTRAINT "UQ_ebaa1ab789d49dd4c1deafd600f"`);
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "id_device"`);
    }

}
