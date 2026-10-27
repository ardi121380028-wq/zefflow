import type { Edge, Node } from "@xyflow/react";
import type { LaneData, StepData } from "@/lib/validation/flow";

export type LaneNodeType = Node<LaneData, "lane">;
export type StepNodeType = Node<StepData, "step" | "decision" | "terminal">;
export type AppNode = LaneNodeType | StepNodeType;
export type AppEdge = Edge;

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error" | "conflict";

export const isLane = (n: AppNode | undefined): n is LaneNodeType => n?.type === "lane";
export const isStep = (n: AppNode | undefined): n is StepNodeType => !!n && n.type !== "lane";
