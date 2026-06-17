export const TIERS = [
  { label: "1–2 players", maxPlayers: 2, pricePerPerson: 40 },
  { label: "3 players", maxPlayers: 3, pricePerPerson: 35 },
  { label: "4+ players", maxPlayers: Infinity, pricePerPerson: 30 },
];

export function getPricePerPerson(partySize: number): number {
  return TIERS.find((t) => partySize <= t.maxPlayers)?.pricePerPerson ?? 30;
}

export function getTotalPrice(partySize: number): number {
  return partySize * getPricePerPerson(partySize);
}

export function formatTND(amount: number): string {
  return `${amount} TND`;
}
