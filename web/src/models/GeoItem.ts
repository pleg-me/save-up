export interface IPoint {
    x: number;
    y: number;
}

export interface IPath {
    nodes: IPoint[];
}

export interface IGeoItem {
    key: string;
    name: string;
    centerX: number;
    centerY: number;
    postions: IPoint[];
    advertising: Record<string, string[]>;
}