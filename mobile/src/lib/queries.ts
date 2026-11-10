import { useQuery } from "@tanstack/react-query";
import { getCurriculumOverview } from "@/lib/backend";
import { getProfile } from "@/lib/backend";

export function useProfile() {
  return useQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
}

export function useOverview() {
  return useQuery({ queryKey: ["curriculum"], queryFn: () => getCurriculumOverview() });
}
