-- A cancelled booking (status = 'cancelled') must not block its (roomId, startTime)
-- slot from being booked again — the old plain unique index made a soft-cancelled
-- row occupy the slot forever, so re-booking it hit a unique-constraint violation.
-- Replaced with a partial unique index that only applies to non-cancelled rows.

DROP INDEX "Booking_roomId_startTime_key";

CREATE UNIQUE INDEX "Booking_roomId_startTime_active_key"
  ON "Booking"("roomId", "startTime")
  WHERE "status" != 'cancelled';
