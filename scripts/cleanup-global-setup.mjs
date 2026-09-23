import { randomUUID } from "node:crypto";

export default async function setup() {
  // Nowy identyfikator dla każdego uruchomienia, także gdy proces jest ponownie użyty.
  process.env.OCTOPUS_CLEANUP_BATCH_ID = randomUUID();
}
