import { describe, it, expect, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

afterAll(async () => {
  // Clean up test data
  await prisma.booking.deleteMany({ where: { email: "dbtest@test.test" } });
  await prisma.room.deleteMany({ where: { slug: "test-double-book-room" } });
  await prisma.$disconnect();
});

describe("Double-booking prevention", () => {
  it("exactly one of two simultaneous booking attempts succeeds", async () => {
    // Create a test room
    const room = await prisma.room.upsert({
      where: { slug: "test-double-book-room" },
      update: {},
      create: {
        slug: "test-double-book-room",
        name: "Test Room",
        tagline: "Test",
        story: "Test",
        heroImageUrl: "",
        galleryImageUrls: "[]",
        themeColors: '{"primary":"#000","secondary":"#111","accent":"#fff"}',
        themeFont: "gothic",
        difficulty: 1,
        durationMinutes: 60,
        minPlayers: 2,
        maxPlayers: 6,
        pricePerPerson: 10,
        openHours: "{}",
        active: true,
        seoTitle: "Test",
        seoDescription: "Test",
      },
    });

    const startTime = new Date("2099-12-25T14:00:00.000Z");
    const endTime = new Date("2099-12-25T15:00:00.000Z");

    // Attempt two simultaneous bookings for the same slot
    const results = await Promise.allSettled([
      prisma.booking.create({
        data: {
          roomId: room.id,
          startTime,
          endTime,
          customerName: "Person A",
          email: "dbtest@test.test",
          phone: "555-0001",
          partySize: 2,
          status: "confirmed",
        },
      }),
      prisma.booking.create({
        data: {
          roomId: room.id,
          startTime,
          endTime,
          customerName: "Person B",
          email: "dbtest@test.test",
          phone: "555-0002",
          partySize: 2,
          status: "confirmed",
        },
      }),
    ]);

    const successes = results.filter((r) => r.status === "fulfilled");
    const failures = results.filter((r) => r.status === "rejected");

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);

    // The failure should be a Prisma unique constraint error
    const fail = failures[0] as PromiseRejectedResult;
    expect((fail.reason as { code?: string }).code).toBe("P2002");

    // Verify only one booking exists in DB
    const bookings = await prisma.booking.findMany({
      where: { roomId: room.id, startTime },
    });
    expect(bookings).toHaveLength(1);
  });
});
