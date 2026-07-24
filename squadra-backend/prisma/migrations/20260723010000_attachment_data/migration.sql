-- AlterTable: guardar el binario del adjunto en la base
ALTER TABLE "attachments" ADD COLUMN "data" BYTEA;
