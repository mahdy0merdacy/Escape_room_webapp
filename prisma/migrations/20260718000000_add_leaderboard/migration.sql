-- AlterTable
ALTER TABLE "Room" ADD COLUMN "successRate" REAL NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "LeaderboardEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "partySize" INTEGER NOT NULL,
    "timeSpentSec" INTEGER NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeaderboardEntry_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LeaderboardEntry_roomId_timeSpentSec_idx" ON "LeaderboardEntry"("roomId", "timeSpentSec");
