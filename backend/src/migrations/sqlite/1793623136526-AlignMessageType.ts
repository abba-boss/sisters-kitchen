import { MigrationInterface, QueryRunner } from "typeorm";

export class AlignMessageType1793623136526 implements MigrationInterface {
    name = 'AlignMessageType1793623136526'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_messages" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar(30) NOT NULL DEFAULT ('vendor_to_admin'), "content" text NOT NULL, "isRead" boolean NOT NULL DEFAULT (0), "senderId" varchar NOT NULL, "receiverId" varchar NOT NULL, "vendorId" varchar, "attachments" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_7f29d8cc84b6d753eb63c50dc3b" FOREIGN KEY ("vendorId") REFERENCES "vendors" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_acf951a58e3b9611dd96ce89042" FOREIGN KEY ("receiverId") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce" FOREIGN KEY ("senderId") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_messages"("id", "type", "content", "isRead", "senderId", "receiverId", "vendorId", "attachments", "createdAt", "updatedAt") SELECT "id", "type", "content", "isRead", "senderId", "receiverId", "vendorId", "attachments", "createdAt", "updatedAt" FROM "messages"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`ALTER TABLE "temporary_messages" RENAME TO "messages"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" RENAME TO "temporary_messages"`);
        await queryRunner.query(`CREATE TABLE "messages" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar CHECK( "type" IN ('vendor_to_admin','admin_to_vendor') ) NOT NULL, "content" text NOT NULL, "isRead" boolean NOT NULL DEFAULT (0), "senderId" varchar NOT NULL, "receiverId" varchar NOT NULL, "vendorId" varchar, "attachments" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_7f29d8cc84b6d753eb63c50dc3b" FOREIGN KEY ("vendorId") REFERENCES "vendors" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_acf951a58e3b9611dd96ce89042" FOREIGN KEY ("receiverId") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce" FOREIGN KEY ("senderId") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "messages"("id", "type", "content", "isRead", "senderId", "receiverId", "vendorId", "attachments", "createdAt", "updatedAt") SELECT "id", "type", "content", "isRead", "senderId", "receiverId", "vendorId", "attachments", "createdAt", "updatedAt" FROM "temporary_messages"`);
        await queryRunner.query(`DROP TABLE "temporary_messages"`);
    }

}
