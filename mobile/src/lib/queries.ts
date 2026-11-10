import { useQuery } from "@tanstack/react-query";
import { getCurriculumOverview } from "./curriculum.functions";
import { getProfile } from "./rapid-math.functions";

export function useProfile() {
  return useQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
}

export function useOverview() {
  return useQuery({ queryKey: ["curriculum"], queryFn: () => getCurriculumOverview() });
}
