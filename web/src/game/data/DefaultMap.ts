//import { IGeoItem } from "../../models/GeoItem";
import { Settings } from "./Settings";

export const DefaultMap = {
    geoItems: [
        // {
        //     key: "Airport",
        //     name: Settings.locale.Building_Airport,
        //     centerX: 0,
        //     centerY: 0,
        // },
        // {
        //     key: "Apartment",
        //     name: Settings.locale.Building_Apartment,
        //     centerX: 0,
        //     centerY: 0,
        // },
        // {
        //     key: "Bank",
        //     name: Settings.locale.Building_Bank,
        //     centerX: 208,
        //     centerY: 208,
        //     postions: [
        //         { x: 208, y: 360 },
        //         { x: 360, y: 208 },
        //     ],
        //     advertising: [],
        // },
        {
            key: "Bank",//Exchange
            name: Settings.locale.Building_Bank,
            centerX: 208,
            centerY: 208,
            postions: [
                { x: 208, y: 360 },
                { x: 360, y: 208 },
            ],
            advertising: {
                en: [
                    "Investment risks, be cautious!",
                    "You'll make money, just be careful!",
                    "High return! Low risk!",
                ],
                zhs: [
                    "投资有风险，入市需谨慎！",
                    "包赚不赔！",
                    "高收益！低风险！"
                ]
            },
        },
        {
            key: "BeautySalon",
            name: Settings.locale.Building_BeautySalon,
            centerX: 512,
            centerY: 208,
            postions: [
                { x: 360, y: 208 },
                { x: 512, y: 360 },
                { x: 664, y: 208 },
            ],
            advertising: {
                en: [
                    "Prepare for the date!",
                    "Love yourself~",
                    "Must be pretty~",
                    "Take care of yourself before the interview, you'll be more confident!",
                ],
                zhs: [
                    "约会前的准备！",
                    "要爱自己~",
                    "要美美哒~",
                    "面试前打理一下，会让你更有自信！",
                ]
            },
        },
        {
            key: "Cinema",
            name: Settings.locale.Building_Cinema,
            centerX: 816,
            centerY: 208,
            postions: [
                { x: 664, y: 208 },
                { x: 816, y: 360 },
            ],
            advertising: {
                en: [
                    "Check out the latest movies!",
                    "Come and watch!",
                    "Watch the handsome and the beauties!"
                ],
                zhs: [
                    "最新大片在映！",
                    "来看看吧！",
                    "来看帅哥美女！"
                ]
            },
        },
        {
            key: "ConcertHall",
            name: Settings.locale.Building_ConcertHall,
            centerX: 208,
            centerY: 512,
            postions: [
                { x: 208, y: 360 },
                { x: 360, y: 512 },
                { x: 208, y: 664 },
            ],
            advertising: {
                en: [
                    "Master's performance, can't miss it!",
                    "World-class audio experience!",
                    "Famous opera, it's a must-see!"
                ],
                zhs: [
                    "大师巡演，不可错过！",
                    "世界级的听觉盛宴！",
                    "知名歌剧，不容错过！"
                ]
            },
        },
        {
            key: "DessertShop",
            name: Settings.locale.Building_DessertShop,
            centerX: 512,
            centerY: 512,
            postions: [
                { x: 512, y: 360 },
                { x: 664, y: 512 },
                { x: 512, y: 664 },
                { x: 360, y: 512 },
            ],
            advertising: {
                en: [
                    "Delicious desserts, every bite is a surprise!",
                    "Mood not good, eat a dessert!",
                    "Come and have a dessert, it's relaxing!"
                ],
                zhs: [
                    "美味的甜点，每一口都有惊喜！",
                    "心情不太好，吃点甜点吧！",
                    "来个甜点，放松一下吧！"
                ]
            },
        },
        {
            key: "FoodCity",
            name: Settings.locale.Building_FoodCity,
            centerX: 816,
            centerY: 512,
            postions: [
                { x: 816, y: 360 },
                { x: 664, y: 512 },
                { x: 816, y: 664 },
            ],
            advertising: {
                en: [
                    "Air-fried ingredients, fresh and delicious!",
                    "Top chef, serving you with care!",
                    "Well-known chain restaurant has just opened, come and try!"
                ],
                zhs: [
                    "空运食材，新鲜美味！",
                    "顶级大厨，为你服务！",
                    "知名连锁餐厅已入驻，欢迎品鉴！"
                ]
            },
        },
        {
            key: "Restaurant",
            name: Settings.locale.Building_Restaurant,
            centerX: 208,
            centerY: 816,
            postions: [
                { x: 208, y: 664 },
                { x: 360, y: 816 },
            ],
            advertising: {
                en: [
                    "Seasonal new products, can't miss it!",
                    "Charge 1000, get 200 free!",
                    "Second anniversary store celebration, continuous events!"
                ],
                zhs: [
                    "应季新品，不容错过！",
                    "充1000送200！",
                    "两周年店庆，活动连连！"
                ]
            },
        },
        {
            key: "ShoppingMall",
            name: Settings.locale.Building_ShoppingMall,
            centerX: 512,
            centerY: 816,
            postions: [
                { x: 360, y: 816 },
                { x: 512, y: 664 },
                { x: 664, y: 816 },
            ],
            advertising: {
                en: [
                    "Here's everything you need!",
                    "Come and shop, enjoy the shopping fun!",
                    "Why bother? Just buy it!"
                ],
                zhs: [
                    "这里有你需要的一切！",
                    "来购物，享受购物的乐趣！",
                    "何以解忧？唯有买买买！"
                ]
            },
        },

        {
            key: "MountainLake",
            name: Settings.locale.Building_MountainLake,
            centerX: 816,
            centerY: 816,
            postions: [
                { x: 664, y: 816 },
                { x: 816, y: 664 },
            ],
            advertising: {
                en: [
                    "The world is big, let's go out and see!",
                    "Nature is calling me!",
                    "A journey by the sea, is a way of life!"
                ],
                zhs: [
                    "世界很大，应该出去看看！",
                    "大自然在呼唤我！",
                    "说走就走的旅行，是一种生活方式！"
                ]
            },
        },
    ],
    heroPostions: [
        // line 1
        // { x: 208, y: 56, left: null, right: null, up: null, down: null },
        // { x: 512, y: 56, left: null, right: null, up: null, down: null },
        // { x: 816, y: 56, left: null, right: null, up: null, down: null },
        // line 2
        { x: 360, y: 208, left: null, right: null, up: null, down: null },
        { x: 664, y: 208, left: null, right: null, up: null, down: null },
        // line 3
        { x: 208, y: 360, left: null, right: null, up: null, down: null },
        { x: 512, y: 360, left: null, right: null, up: null, down: null },
        { x: 816, y: 360, left: null, right: null, up: null, down: null },
        // line 4
        { x: 360, y: 512, left: null, right: null, up: null, down: null },
        { x: 664, y: 512, left: null, right: null, up: null, down: null },
        // line 5
        { x: 208, y: 664, left: null, right: null, up: null, down: null },
        { x: 512, y: 664, left: null, right: null, up: null, down: null },
        { x: 816, y: 664, left: null, right: null, up: null, down: null },
        // line 6
        { x: 360, y: 816, left: null, right: null, up: null, down: null },
        { x: 664, y: 816, left: null, right: null, up: null, down: null },
        // line 7
        // { x: 208, y: 968, left: null, right: null, up: null, down: null },
        // { x: 512, y: 968, left: null, right: null, up: null, down: null },
        // { x: 816, y: 968, left: null, right: null, up: null, down: null },
    ],
    // 角色可行走的命名路径（按建筑 key 组成的节点序列）
    paths: [
        {
            name: "Row1",
            type: "loop",
            nodes: [ { x: 80, y: 360 }, { x: 208, y: 360 }, { x: 360, y: 360 }, { x: 512, y: 360}, { x: 664, y: 360 }, { x: 816, y: 360 }, { x: 944, y: 360} ]
        },
        {
            name: "Row2",
            type: "loop",
            nodes: [ { x: 80, y: 664 }, { x: 208, y: 664 }, { x: 360, y: 664 }, { x: 512, y: 664}, { x: 664, y: 664 }, { x: 816, y: 664 }, { x: 944, y: 664} ]
        },
        {
            name: "Column1",
            type: "loop",
            nodes: [ { x: 360, y: 80 }, { x: 360, y: 208 }, { x: 360, y: 360 }, { x: 360, y: 512}, { x: 360, y: 664 }, { x: 360, y: 816 }, { x: 360, y: 944} ]
        },
        {
            name: "Column2",
            type: "loop",
            nodes: [ { x: 664, y: 80 }, { x: 664, y: 208 }, { x: 664, y: 360 }, { x: 664, y: 512}, { x: 664, y: 664 }, { x: 664, y: 816 }, { x: 664, y: 944} ]
        }
    ]
}