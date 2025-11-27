export interface Fixture {
    id: string;
    sourceFile: string;
    designation: string;
    description: string;
    manufacturer: string;
    series: string;
    lampType: string;
    voltage: string;
    voltageOptions?: string[];
    wattage: string;
    wattageOptions?: string[];
    wattPerFoot: string; // Represents "Watt/Ft. (Linear)"
    wattPerFootOptions?: string[];
    deliveredLumens: string;
    deliveredLumensOptions?: string[];
    cct: string;
    cctOptions?: string[];
    cri: string;
    criOptions?: string[];
    mounting: string;
    mountingOptions?: string[];
    finish: string;
    finishOptions?: string[];
    driverInfo: string;
    notes: string;
    // Allow for custom, dynamic string properties
    [key: string]: any;
}

export type FileStatus = 'pending' | 'processing' | 'success' | 'error';

export interface ProcessedFile {
    name: string;
    status: FileStatus;
    error?: string;
}

export interface ColumnConfig {
    key: keyof Fixture | string;
    label: string;
    description: string; // The prompt for the AI
    visible: boolean;
    isDefault: boolean; // To identify original columns for the 'reset' feature
}

export interface SelectedCell {
    fixtureId: string;
    field: keyof Fixture | string;
}
