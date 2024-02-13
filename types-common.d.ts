interface ValueFilter<T> {
    op: "ne"|"eq"|"gt";
    val: T;
}


interface App<T> {
    log: LogFn & { warn: LogFn, err: LogFn, debug: LogFn };
    objects: AppObjects<T>;
}

interface AppObjects<T> {
    get<O extends keyof T>(code: O): MdtObject<T[O]>;
}

interface DiServices { 
    http: { fetch: any }
}

type Filter<T> = {
    [fieldCode in keyof T]?: T[fieldCode] | ValueFilter<T[fieldCode]>;
}

interface MdtActionConfirmationResult {
    isConfirmed: boolean;
    resolvedCode: string;
}

type MdtRecordDto<T> = {
    [fieldCode in keyof T]?: T[fieldCode] extends MdtRecord<any> ? (string | T[fieldCode]) : T[fieldCode]
        | null;
}

interface MdtObject<T> {
    onSave(handler: (args: { object: MdtObject<T>, result: MdtActionResult, record: MdtRecord<T> }) => void): void;
    fetch(params: { filter: Filter<T> }): MdtRecord<T>[];
    actions: MdtActionList<T>;
    add(dto: MdtRecordDto<T>): MdtRecord<T>;
//    rules: MdtRuleList<T>;
}

interface MdtActionResult {
    isConfirmed: boolean;
    confirm(title: string, args: { 
        choices: MdtActionResultChoice[],
        records?: MdtRecord<any>[]
    }): MdtActionConfirmationResult;
}

interface MdtActionResultChoice {
    code?: string;
    title: string;
    type?: "info"|"warning"|"primary";
    icon?: string;
}

interface MdtActionParams<P> {
    get(code: string): any;
}

interface MdtObjectBuilder<P> extends MdtObject<P> {
    fk(code: string, fkObject: MdtObject<any>): MdtObjectBuilder<P>;
    string(code: string): MdtObjectBuilder<P>;
}


interface MdtAction<T, P extends FieldDefinition[]> { 
    paramsObject: { fields: P };
    execute(r: ObjectWithFields<P>): void;
}

// icon?: string; 
// title: string;
// paramsObject: { fields: P };
//      // | { (args: { builder: MdtObjectBuilder<P> }): MdtObject<P> };
// canExecute: (args: { record: MdtRecord<T> }) => boolean;
// execute: (args: { result: MdtActionResult, record: MdtRecord<T>, 
//     // params?: MdtRecord<ObjectWithFields<P>>,
//     x: ObjectWithFields<P>
// }, di: DiServices) => void;


type FieldDefinition = { code: string; type: 'string' | 'number' };

type ObjectWithFields<Fields extends FieldDefinition[]> = {
    [P in Fields[number] as P['code']]: P['type'] extends 'string' ? string : number;
};



interface MdtActionList<T> {
    add<P extends MdtObject<P>>(code: string, action: MdtAction<T>): void;
    // !!!!!!!!!!!!!
    addStatic(code: string, action: any): void;
    addBatch(code: string, action: any): void;
}

interface MdtRecord<T> {
    id: any;
    get<F extends keyof T>(fieldCode: F): T[F];
    set<F extends keyof T>(fieldCode: F, value: T[F] | null): void; // если undefined, то значит в null скинули походу, а не значение неизвестно
}

type LogFn = (message: string, ...args: any[]) => void;

