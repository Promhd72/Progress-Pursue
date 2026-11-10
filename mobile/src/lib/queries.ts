import { useQuery } from "@tanstack/react-query";
import { getCurriculumOverview, getLevelStats } from "@/lib/backend";
import { getProfile } from "@/lib/backend";

export function useProfile() {
  return useQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
}

export function useOverview() {
  return useQuery({ queryKey: ["curriculum"], queryFn: () => getCurriculumOverview() });
}

/** Best stars per level, keyed `${track}-${level}`. */
export function useLevelStats() {
  return useQuery({ queryKey: ["level-stats"], queryFn: () => getLevelStats() });
}
