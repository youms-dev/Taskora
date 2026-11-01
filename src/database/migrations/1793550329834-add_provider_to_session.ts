import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProviderToSession1793550329834 implements MigrationInterface {
    name = 'AddProviderToSession1793550329834'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session" ADD "provider" character varying`);
        await queryRunner.query(`ALTER TABLE "folder" DROP CONSTRAINT "FK_9a18cf718506a8ae9804aabd721"`);
        await queryRunner.query(`ALTER TABLE "folder" ALTER COLUMN "id_user" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "folder" ADD CONSTRAINT "FK_9a18cf718506a8ae9804aabd721" FOREIGN KEY ("id_user") REFERENCES "user"("id_user") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "folder" DROP CONSTRAINT "FK_9a18cf718506a8ae9804aabd721"`);
        await queryRunner.query(`ALTER TABLE "folder" ALTER COLUMN "id_user" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "folder" ADD CONSTRAINT "FK_9a18cf718506a8ae9804aabd721" FOREIGN KEY ("id_user") REFERENCES "user"("id_user") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "provider"`);
    }

}
