import { LocaleUtils } from "../../tools/LocaleUtils";
import { Locales } from "./Locales";
import { Sponsors } from "./Sponsors";

export const Settings = {
    locale: Locales[0], //.find((locale) => locale.code === Settings.lang) || Locales[0],

    SponsorName: "",
    SponsorTitle: "",
}

Settings.SponsorName = LocaleUtils.getItemByLangCode(Sponsors.Name, Settings.locale.code);
Settings.SponsorTitle = LocaleUtils.getItemByLangCode(Sponsors.Title, Settings.locale.code);
