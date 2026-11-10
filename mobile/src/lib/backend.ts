/**
 * Single entry point for data: uses Supabase when it's configured (.env),
 * otherwise the on-device demo backend so the app can be tried right away.
 */
import { supabaseConfigured } from "@/integrations/supabase/client";
import * as real from "./curriculum.functions";
import * as realAdvanced from "./advanced.functions";
import * as realProfile from "./rapid-math.functions";
import * as demo from "./demo";

export const DEMO_MODE = !supabaseConfigured;

const pick = <T>(realFn: T, demoFn: unknown): T => (DEMO_MODE ? (demoFn as T) : realFn);

export const getProfile = pick(realProfile.getProfile, demo.getProfile);
export const getCurriculumOverview = pick(real.getCurriculumOverview, demo.getCurriculumOverview);
export const getRecentLessons = pick(real.getRecentLessons, demo.getRecentLessons);
export const getTrackSpeedStats = pick(real.getTrackSpeedStats, demo.getTrackSpeedStats);
export const getLessonAccess = pick(real.getLessonAccess, demo.getLessonAccess);
export const submitLesson = pick(real.submitLesson, demo.submitLesson);
export const submitPlacement = pick(real.submitPlacement, demo.submitPlacement);
export const getAdvancedAccess = pick(realAdvanced.getAdvancedAccess, demo.getAdvancedAccess);
export const submitAdvancedAnswer = pick(realAdvanced.submitAdvancedAnswer, demo.submitAdvancedAnswer);
export const getAdvancedProgress = pick(realAdvanced.getAdvancedProgress, demo.getAdvancedProgress);
