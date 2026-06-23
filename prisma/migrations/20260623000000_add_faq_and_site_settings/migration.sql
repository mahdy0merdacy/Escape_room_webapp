-- CreateTable
CREATE TABLE "FaqItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "q_en" TEXT NOT NULL DEFAULT '',
    "q_fr" TEXT NOT NULL DEFAULT '',
    "q_ar" TEXT NOT NULL DEFAULT '',
    "a_en" TEXT NOT NULL DEFAULT '',
    "a_fr" TEXT NOT NULL DEFAULT '',
    "a_ar" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL
);
