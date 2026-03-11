-- CreateTable
CREATE TABLE "vehicle_media" (
    "id" SERIAL NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "mime_type" TEXT,
    "kind" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicle_media_vehicle_id_idx" ON "vehicle_media"("vehicle_id");

-- AddForeignKey
ALTER TABLE "vehicle_media" ADD CONSTRAINT "vehicle_media_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
