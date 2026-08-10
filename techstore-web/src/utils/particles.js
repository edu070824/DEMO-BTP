import { loadSlim } from "@tsparticles/slim";

export async function initializeParticles(engine) {
  await loadSlim(engine);
}
