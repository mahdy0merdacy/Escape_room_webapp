-- ScheduleConfig table was missing from all previous migrations.
-- Uses IF NOT EXISTS so it is safe to apply to any DB state.
CREATE TABLE IF NOT EXISTS "ScheduleConfig" (
    "id"           TEXT     NOT NULL PRIMARY KEY,
    "openHour"     INTEGER  NOT NULL DEFAULT 11,
    "openMinute"   INTEGER  NOT NULL DEFAULT 0,
    "closeHour"    INTEGER  NOT NULL DEFAULT 1,
    "closeMinute"  INTEGER  NOT NULL DEFAULT 0,
    "breakMinutes" INTEGER  NOT NULL DEFAULT 0,
    "updatedAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
