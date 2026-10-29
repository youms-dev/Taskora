import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1793308094337 implements MigrationInterface {
    name = 'Init1793308094337'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "folder" ("id_folder" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_91da80d44dfb30b9d27457a7714" PRIMARY KEY ("id_folder"))`);
        await queryRunner.query(`CREATE TYPE "public"."task_type_enum" AS ENUM('TASK', 'EVENT')`);
        await queryRunner.query(`CREATE TABLE "task" ("id_task" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "content" character varying NOT NULL, "icon" json NOT NULL, "done" boolean NOT NULL DEFAULT false, "archived" boolean, "start_at" integer NOT NULL, "end_at" TIMESTAMP, "type" "public"."task_type_enum" NOT NULL DEFAULT 'TASK', "remind_before" integer, "pinned" boolean NOT NULL, "notification_id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id_folder" uuid, "id_user" uuid, CONSTRAINT "PK_03217f55c891ad98816877c7a6b" PRIMARY KEY ("id_task"))`);
        await queryRunner.query(`CREATE TABLE "session" ("id_session" uuid NOT NULL DEFAULT uuid_generate_v4(), "device" character varying NOT NULL, "refresh_token" character varying NOT NULL, "last_connection" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id_user" uuid, CONSTRAINT "PK_d20b4292bc2869a7ed2ea2e7af3" PRIMARY KEY ("id_session"))`);
        await queryRunner.query(`CREATE TABLE "setting" ("id_setting" uuid NOT NULL DEFAULT uuid_generate_v4(), "language" character varying, "confirm_before_delete" boolean NOT NULL DEFAULT true, "_2FA" boolean NOT NULL DEFAULT true, "auto_sync" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a68cd577d9526870753c9414975" PRIMARY KEY ("id_setting"))`);
        await queryRunner.query(`ALTER TABLE "user" ADD "password" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ADD "id_setting" uuid`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_a6e3bf94a056b43228c14f5a221" UNIQUE ("id_setting")`);
        await queryRunner.query(`ALTER TABLE "task" ADD CONSTRAINT "FK_e848f634f39be6f058b972b040d" FOREIGN KEY ("id_folder") REFERENCES "folder"("id_folder") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task" ADD CONSTRAINT "FK_05597b495e2aeb497af5f6b75d9" FOREIGN KEY ("id_user") REFERENCES "user"("id_user") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "session" ADD CONSTRAINT "FK_19623a491996af9cc6c7719e167" FOREIGN KEY ("id_user") REFERENCES "user"("id_user") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_a6e3bf94a056b43228c14f5a221" FOREIGN KEY ("id_setting") REFERENCES "setting"("id_setting") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_a6e3bf94a056b43228c14f5a221"`);
        await queryRunner.query(`ALTER TABLE "session" DROP CONSTRAINT "FK_19623a491996af9cc6c7719e167"`);
        await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "FK_05597b495e2aeb497af5f6b75d9"`);
        await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "FK_e848f634f39be6f058b972b040d"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_a6e3bf94a056b43228c14f5a221"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "id_setting"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "password"`);
        await queryRunner.query(`DROP TABLE "setting"`);
        await queryRunner.query(`DROP TABLE "session"`);
        await queryRunner.query(`DROP TABLE "task"`);
        await queryRunner.query(`DROP TYPE "public"."task_type_enum"`);
        await queryRunner.query(`DROP TABLE "folder"`);
    }

}
