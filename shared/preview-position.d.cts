export type PreviewPosition={left:number;top:number};
export function readPreviewPosition(file?:string):Promise<PreviewPosition|null>;
export function savePreviewPosition(value:PreviewPosition,file?:string):Promise<boolean>;
