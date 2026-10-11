export type TeamRole = "leader" | "assistant";

export const ROLE_NAME: Record<TeamRole, string> = { leader: "Team Leader", assistant: "Assistant Accreditor" };
export const ROLE_SHORT: Record<TeamRole, string> = { leader: "Team Leader", assistant: "Assistant" };

/** An area belongs to the Team Leader when it is in the leader's list, otherwise to the Assistant. */
export const ownerRole = (leaderAreaIds: string[], areaId: string): TeamRole => (leaderAreaIds.includes(areaId) ? "leader" : "assistant");
