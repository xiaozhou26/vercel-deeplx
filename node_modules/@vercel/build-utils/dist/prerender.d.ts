import type { File, HasField } from './types';
import { Lambda } from './lambda';
interface PrerenderOptions {
    expiration: number | false;
    lambda?: Lambda;
    fallback: File | null;
    group?: number;
    bypassToken?: string | null;
    allowQuery?: string[];
    initialHeaders?: Record<string, string>;
    initialStatus?: number;
    passQuery?: boolean;
    sourcePath?: string;
    experimentalBypassFor?: HasField;
    experimentalStreamingLambdaPath?: string;
}
export declare class Prerender {
    type: 'Prerender';
    expiration: number | false;
    lambda?: Lambda;
    fallback: File | null;
    group?: number;
    bypassToken: string | null;
    allowQuery?: string[];
    initialHeaders?: Record<string, string>;
    initialStatus?: number;
    passQuery?: boolean;
    sourcePath?: string;
    experimentalBypassFor?: HasField;
    experimentalStreamingLambdaPath?: string;
    constructor({ expiration, lambda, fallback, group, bypassToken, allowQuery, initialHeaders, initialStatus, passQuery, sourcePath, experimentalBypassFor, experimentalStreamingLambdaPath, }: PrerenderOptions);
}
export {};
