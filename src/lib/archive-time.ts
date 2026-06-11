import { getCubeDeactivationTargetMs } from "@/lib/countdown-target";

/** Mission archive freezes all clocks at cube deactivation. */
export const archiveNowMs = getCubeDeactivationTargetMs();

export const archiveNowDate = new Date(archiveNowMs);
