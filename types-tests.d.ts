
declare global {
    var describe: (component: string, fn: () => void) => void;
    var test: (requirement: string, fn: () => void) => void;
    var assert: (condition: boolean) => void;
    var setupData: { <T>(mdtObject: MdtObject<T>, data: Partial<MdtRecordDto<T>>[], baseData?: Partial<MdtRecordDto<T>>): void };
}
export {};
