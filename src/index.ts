export * from "./transport";
export * from "./surface";
export * from "./appShell";
export * from "./heartbeat";

export { mapTeamSessionToUser, type TeamSessionPayload, type TeamProfilePayload } from "./auth";
export type { EmbeddedTeamUser } from "./auth";

export { TeamAuthProvider, useTeamAuth, TeamAuthContext } from "./TeamAuthContext";
export { RequireAuth, useRequireAuth } from "./RequireAuth";
