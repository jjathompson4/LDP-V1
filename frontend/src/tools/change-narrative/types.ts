export type SheetStatus = "NEW" | "REMOVED" | "REVISED" | "UNCHANGED";
export const SheetStatus = {
    NEW: "NEW" as SheetStatus,
    REMOVED: "REMOVED" as SheetStatus,
    REVISED: "REVISED" as SheetStatus,
    UNCHANGED: "UNCHANGED" as SheetStatus
};

export type SheetKind = "lighting_plan" | "lighting_schedules" | "symbols_legend" | "other";
export const SheetKind = {
    LIGHTING_PLAN: "lighting_plan" as SheetKind,
    LIGHTING_SCHEDULES: "lighting_schedules" as SheetKind,
    SYMBOLS_LEGEND: "symbols_legend" as SheetKind,
    OTHER: "other" as SheetKind
};

export interface ChangeItem {
    text: string;
    type: "ADDED" | "REMOVED";
    location_context?: string;
}

export interface SheetData {
    sheetId: string;
    sheetNumber: string;
    sheetTitle: string;
    status: SheetStatus;
    sheetKind: SheetKind;
    diffScore?: number;
    previousPreviewBase64?: string;
    currentPreviewBase64?: string;
    warningsForSheet: string[];
    detailedNarrative?: string;
    oneLineSummary?: string;
    isIncluded?: boolean;
    changes: ChangeItem[];
}

export interface TagConsistencyReport {
    currentPlanTags: string[];
    currentScheduleTags: string[];
    planOnlyTags: string[];
    scheduleOnlyTags: string[];
    newPlanTagsVsPrevious: string[];
    removedPlanTagsVsPrevious: string[];
    warnings: string[];
}

export interface ComparisonResponse {
    sheets: SheetData[];
    tagConsistency: TagConsistencyReport;
}
