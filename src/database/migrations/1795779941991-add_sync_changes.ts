import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSyncChanges1795779941991 implements MigrationInterface {
    name = 'AddSyncChanges1795779941991'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."sync_changes_entity_table_enum" AS ENUM('TASK', 'FOLDER')`);
        await queryRunner.query(`CREATE TYPE "public"."sync_changes_action_enum" AS ENUM('INSERT', 'DELETE')`);
        await queryRunner.query(`CREATE TABLE "sync_changes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "id_entity" character varying NOT NULL, "cursor" SERIAL NOT NULL, "entity_table" "public"."sync_changes_entity_table_enum" NOT NULL, "action" "public"."sync_changes_action_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0a14710c731b5f3aa7715a1c478" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "sync_changes"`);
        await queryRunner.query(`DROP TYPE "public"."sync_changes_action_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sync_changes_entity_table_enum"`);
    }

}
