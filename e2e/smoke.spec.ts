import { test, expect } from "@playwright/test";

test("homepage loads with room cards", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/EscapeZone/);
  // Three room cards should be visible
  const roomCards = page.locator("a[href^='/rooms/']");
  await expect(roomCards.first()).toBeVisible();
  const count = await roomCards.count();
  expect(count).toBeGreaterThanOrEqual(3);
});

test("Annabelle room page loads with themed heading", async ({ page }) => {
  await page.goto("/rooms/annabelle");
  await expect(page.locator("h1")).toContainText("Annabelle");
  // Booking widget should be present
  await expect(page.locator("text=Book This Room")).toBeVisible();
});

test("Stranger Things room page loads", async ({ page }) => {
  await page.goto("/rooms/stranger-things");
  await expect(page.locator("h1")).toContainText("Stranger Things");
  await expect(page.locator("text=The Upside Down")).toBeVisible();
});

test("Breaking Bad room page loads", async ({ page }) => {
  await page.goto("/rooms/breaking-bad");
  await expect(page.locator("h1")).toContainText("Breaking Bad");
  await expect(page.locator("text=danger")).toBeVisible();
});

test("rooms listing page shows all active rooms", async ({ page }) => {
  await page.goto("/rooms");
  await expect(page.locator("h1")).toContainText("Escape Rooms");
  await expect(page.getByRole("heading", { name: "Annabelle" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Stranger Things" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Breaking Bad" })).toBeVisible();
});

test("admin login page renders", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.locator("input[type=email]")).toBeVisible();
  await expect(page.locator("input[type=password]")).toBeVisible();
});

test("admin login with correct credentials redirects to dashboard", async ({ page }) => {
  await page.goto("/admin/login");
  await page.fill("input[type=email]", "admin@escapezone.local");
  await page.fill("input[type=password]", "admin123");
  await page.click("button[type=submit]");
  await page.waitForURL(/\/admin$/, { timeout: 10000 });
  await expect(page.locator("h1")).toContainText("Dashboard");
});

test("admin can see bookings page", async ({ page }) => {
  // Login first
  await page.goto("/admin/login");
  await page.fill("input[type=email]", "admin@escapezone.local");
  await page.fill("input[type=password]", "admin123");
  await page.click("button[type=submit]");
  await page.waitForURL(/\/admin$/);

  // Navigate to bookings
  await page.click("a[href='/admin/bookings']");
  await page.waitForURL(/\/admin\/bookings/);
  await expect(page.locator("h1")).toContainText("Bookings");
});

test("booking flow: select date, slot, fill form, confirm", async ({ page }) => {
  await page.goto("/rooms/annabelle");

  // Pick a date far in the future so there are always slots
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 14);
  // Find next Monday (day 1) to ensure slots exist
  while (futureDate.getDay() !== 1) {
    futureDate.setDate(futureDate.getDate() + 1);
  }
  const dateStr = futureDate.toISOString().split("T")[0];

  const dateInput = page.locator("input[type=date]");
  await dateInput.click();
  await dateInput.fill(dateStr);
  await page.keyboard.press("Tab");
  await page.waitForTimeout(800);

  // Click the button to check availability
  const availBtn = page.getByRole("button", { name: /See Available Times/i });
  await availBtn.waitFor({ state: "visible", timeout: 5000 });
  await availBtn.click({ force: true });

  // Wait for slots to appear (PM time buttons)
  await page.waitForSelector("button:has-text(' PM')", { timeout: 10000 });

  // Click the first slot
  const firstSlot = page.locator("button").filter({ hasText: " PM" }).first();
  await firstSlot.click();

  // Fill in details
  await page.fill("input[aria-label='Full name']", "Test User");
  await page.fill("input[aria-label='Email address']", "testuser@example.com");
  await page.fill("input[aria-label='Phone number']", "+1 555 000 1234");
  await page.fill("input[aria-label='Party size']", "2");

  await page.click("text=Confirm Booking");

  // Should land on confirmation page
  await page.waitForURL(/\/booking\/confirmed/, { timeout: 10000 });
  await expect(page.getByRole("heading", { name: /Booked/i })).toBeVisible();
});
