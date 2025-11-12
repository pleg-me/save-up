import { LocaleUtils } from "../../tools/LocaleUtils";
import { Locales } from "./Locales";
import { Sponsors } from "./Sponsors";
import { reactive } from "vue";
import { EventBus } from "../EventBus";

export const Settings = reactive({
    lang: "zhs",
    locale: Locales[0], //.find((locale) => locale.code === Settings.lang) || Locales[0],

    SponsorName: "",
    SponsorTitle: "",
});

function updateSponsor(){
    Settings.SponsorName = LocaleUtils.getItemByLangCode(Sponsors.Name, Settings.locale.code);
    Settings.SponsorTitle = LocaleUtils.getItemByLangCode(Sponsors.Title, Settings.locale.code);
}

export function switchLang() {
    const newLang = Settings.lang === "en" ? "zhs" : "en";
    Settings.lang = newLang;
    Settings.locale = Locales.find((locale) => locale.code === newLang) || Locales[0];
    
    updateSponsor();
    EventBus.emit('lang-changed');
}

updateSponsor();
