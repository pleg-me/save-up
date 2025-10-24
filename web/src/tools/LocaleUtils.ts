export class LocaleUtils {
    static getItemsByLangCode(records: Record<string, string[]>, langCode: string): string[] {
        switch(langCode) {
            case "en":
                return records.en;
            case "zhs":
                return records.zhs;
            default:
                return [];
        }
    }
}