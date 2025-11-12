import { LocaleUtils } from "../../tools/LocaleUtils";
import { Settings } from "./Settings";

export const Actions = [
    {
        id: "action_income_1",
        type: "action",
        en: {},
        zhs: {
            title: "生日红包",
            description: "生日快乐！",
        },
        imageKey: "action_income_1",
        cost: -100,
        happyPoints: 100
    },
    {
        id: "action_income_2",
        type: "action",
        en: {},
        zhs: {
        },
        title: "加班费",
        description: "燃烧生命，获得额外的收入。",
        imageKey: "action_income_2",
        cost: -200,
        happyPoints: 20
    },
    {
        id: "action_income_3",
        type: "action",
        en: {},
        zhs: {
        },
        title: "兼职费",
        description: "你可以在兼职市场上找到工作，获得额外的收入。",
        imageKey: "action_income_3",
        cost: -200,
        happyPoints: 100
    },

    {
        id: "action_necessary_expense_1",
        type: "action",
        en: {},
        zhs: {
        },
        title: "手机话费",
        description: "万恶的运营商！",
        imageKey: "action_necessary_expense_1",
        cost: 30,
        happyPoints: 0
    },
    {
        id: "action_necessary_expense_2",
        type: "action",
        en: {},
        zhs: {
        },
        title: "学习资料",
        description: "学无止境！",
        imageKey: "action_necessary_expense_2",
        cost: 40,
        happyPoints: 0
    },

    {
        id: "action_lifestyle_choice_1",
        type: "action",
        en: {},
        zhs: {
        },
        title: "新款球鞋",
        description: "虽然我可能不踢球/打球，但是我会用它来展示我的才华。",
        imageKey: "action_lifestyle_choice_1",
        cost: 120,
        happyPoints: 120
    },
    {
        id: "action_lifestyle_choice_2",
        type: "action",
        en: {},
        zhs: {
        },
        title: "朋友聚餐",
        description: "与朋友聚在一起，分享彼此的喜悦和经验。",
        imageKey: "action_lifestyle_choice_2",
        cost: 60,
        happyPoints: 50
    },
    
    {
        id: "action_opportunity_1",
        type: "action",
        en: {},
        zhs: {
        },
        title: "奖学金！",
        description: "恭喜你获得了奖学金！",
        imageKey: "action_opportunity_1",
        cost: -1000,
        happyPoints: 1000
    },
    {
        id: "action_opportunity_2",
        type: "action",
        en: {},
        zhs: {
        },
        title: "彩票中奖！",
        description: "恭喜你获得了彩票！",
        imageKey: "action_opportunity_2",
        cost: -20,
        happyPoints: 20
    },

    {
        id: "action_unexpected_event_1",
        type: "action",
        en: {},
        zhs: {
        },
        title: "手机屏幕碎了！",
        description: "手机壳不管用阿~",
        imageKey: "action_unexpected_event_1",
        cost: 100,
        happyPoints: 0
    },
    {
        id: "action_unexpected_event_1",
        type: "action",
        en: {},
        zhs: {
        },
        title: "生病了...",
        description: "/(ㄒoㄒ)/~~",
        imageKey: "action_unexpected_event_1",
        cost: 100,
        happyPoints: 0
    }
];

interface LocaleCA {
    text: string,
    random: string[],
}

export interface ConsumptionAction {
    type: 'action_consumption',
    en: LocaleCA,
    zhs: LocaleCA,
    key: string,
    buildingKey: string,
    cost: number,
    happyPoints: number
}

export const consumptionActions: ConsumptionAction[] = [
    {
        type: 'action_consumption',
        en: {
            text: 'Drink 🥤',
            random: [
                'Enjoyed a cup of coffee, sparkling!',
                'Tasted fresh juice, full of vitamins!',
                'Drank a milk tea, feeling joyful!',
                'Had a cup of tea, warm and refreshing!'
            ],
        },
        zhs: {
            text: '来杯饮料🥤',
            random: [
                '享受了一杯香浓的咖啡，精神焕发！',
                '品尝了新鲜果汁，维生素满满！',
                '喝了一杯奶茶，心情愉悦！',
                '来了一杯热茶，温暖身心！'
            ],
        },
        key: "drink",
        buildingKey: "Restaurant",
        cost: 5,
        happyPoints: 5
    },
    {
        type: 'action_consumption',
        en: {
            text: 'Dessert 🍦',
            random: [
                'Tasted a fine cake, perfect sweetness!',
                'Enjoyed a refreshing ice cream, so refreshing!',
                'Had a chocolate mousse, romantic touch!',
                'Tasted chocolate, happiness overflowing!'
            ],
        },
        zhs: {
            text: '来个甜点🍦',
            random: [
                '品尝了精致的蛋糕，甜蜜满分！',
                '享用了美味的冰淇淋，清爽怡人！',
                '吃了香甜的马卡龙，法式浪漫！',
                '品尝了巧克力，幸福感爆棚！'
            ],
        },
        key: "dessert",
        buildingKey: "DessertShop",
        cost: 5,
        happyPoints: 5
    },
    {
        type: 'action_consumption',
        en: {
            text: 'Movie 🎥',
            random: [
                'Watched a thrilling action movie, adrenaline pumping!',
                'Enjoyed a romantic love story, full of love!',
                'Saw a hilarious comedy, laughter never stops!',
                'Watched a sci-fi movie, imagination bursts!'
            ],
        },
        zhs: {
            text: '看场电影🎥',
            random: [
                '观看了精彩的动作片，肾上腺素飙升！',
                '欣赏了温馨的爱情片，感动满满！',
                '看了搞笑喜剧，笑声不断！',
                '观赏了科幻大片，想象力爆发！'
            ],
        },
        key: "movie",
        buildingKey: "Cinema",
        cost: 6,
        happyPoints: 5
    },
    {
        type: 'action_consumption',
        en: {
            text: 'Trip 🚗',
            random: [
                'Went on a short trip, full of fun!',
                'Explored local culture, broaden horizons!',
                'Enjoyed natural beauty, feeling free!',
                'Visited historical sites, gained knowledge!'
            ],
        },
        zhs: {
            text: '来场旅行🚗',
            random: [
                '来了一场说走就走的短途旅行，收获满满！',
                '体验了当地特色文化，开阔眼界！',
                '享受了美丽的自然风光，心旷神怡！',
                '探索了历史古迹，增长见识！'
            ],
        },
        key: "travel",
        buildingKey: "MountainLake",
        cost: 300,
        happyPoints: 66
    },
    {
        type: 'action_consumption',
        en: {
            text: 'Beauty salon💅',
            random: [
                'For a date!',
                'To love oneself~',
                'To look good~',
                'Before an interview, it will make you more confident!'
            ],
        },
        zhs: {
            text: '做个美容💅',
            random: [
                '为约会做准备！',
                '要爱自己~',
                '要美美哒~',
                '面试前打理一下，会让你更有自信！'
            ],
        },
        key: "salon",
        buildingKey: "BeautySalon",
        cost: 50,
        happyPoints: 10
    }
];

export function getConsumptionActionText(action: ConsumptionAction) {
    switch(Settings.lang) {
        case "en":
            return action.en.text;
        case "zhs":
            return action.zhs.text;
        default:
            return action.zhs.text;
    }
}

export function getConsumptionActionRandom(action: ConsumptionAction) {
    switch(Settings.lang) {
        case "en":
            return action.en.random;
        case "zhs":
            return action.zhs.random;
        default:
            return action.zhs.random;
    }
}