const occupationInfo = {
  Druid: {
    cnName: "德鲁伊",
    simpleName: "德",
    dbfId: 274
  },
  Hunter: {
    cnName: "猎人",
    simpleName: "猎",
    dbfId: 31
  },
  Mage: {
    cnName: "法师",
    simpleName: "法",
    dbfId: 637
  },
  Paladin: {
    cnName: "骑士",
    simpleName: "骑",
    dbfId: 671
  },
  Priest: {
    cnName: "牧师",
    simpleName: "牧",
    dbfId: 813
  },
  Rogue: {
    cnName: "盗贼",
    simpleName: "贼",
    dbfId: 930
  },
  Shaman: {
    cnName: "萨满",
    simpleName: "萨",
    dbfId: 1066
  },
  Warlock: {
    cnName: "术士",
    simpleName: "术",
    dbfId: 893
  },
  Warrior: {
    cnName: "战士",
    simpleName: "战",
    dbfId: 7
  },
};


const timeNode = [
  {
    time: "2018-12-20",
    title: "吸血药膏、野性成长、滋养、萨隆苦囚、等级提升削弱",
    weakenCardArr: [42665, 1124, 95, 42395, 45877]
  },
  {
    time: "2018-12-05",
    title: "《拉斯塔哈的大乱斗》上线",
  },
  {
    time: "2018-10-19",
    title: "欢乐的发明家、法力浮龙、艾维娜削弱",
    weakenCardArr: [48226, 405, 2796]
  },
  {
    time: "2018-08-08",
    title: "《砰砰计划》上线",
  },
  {
    time: "2018-05-23",
    title: "纳迦海巫、恶毒的召唤师、黑暗契约、着魔男仆、战斗号角、探索地下洞穴削弱",
    weakenCardArr: [2910, 46551, 43128, 45820, 43384, 41222]
  },
  {
    time: "2018-04-13",
    title: "《女巫森林》上线、冰箱、寒光智者、熔核巨人进入荣誉室、《古神的低语》、《卡拉赞之夜》、《龙争虎斗加基森》退环境",
  },
  {
    time: "2018-02-07",
    title: "通道爬行者、海盗帕奇斯、缚链者拉兹、骨魇削弱",
    weakenCardArr: [43515, 40465, 40323, 42790]
  },
  {
    time: "2017-12-08",
    title: "《狗头人与地下世界》上线",
  },
  {
    time: "2017-09-19",
    title: "激活、炽炎战斧、妖术、鱼人领军、传播瘟疫削弱",
    weakenCardArr: [254, 401, 766, 1063, 42656]
  },
  {
    time: "2017-08-11",
    title: "《冰封王座的骑士》上线",
  },
  {
    time: "2017-07-11",
    title: "探索地下洞穴削弱",
    weakenCardArr: [41222]
  },
  {
    time: "2017-04-07",
    title: "《勇闯安戈洛》上线、碧蓝幼龙、希尔瓦娜斯·风行者、炎魔之王拉格纳罗斯、力量的代价、冰枪术、隐藏、老瞎眼、船长的鹦鹉、精英牛头人酋长、格尔宾·梅卡托克进入荣誉室、《黑石山的火焰》、《冠军的试炼》、《探险家协会》退环境",
  },
  {
    time: "2017-03-01",
    title: "蹩脚海盗、幽灵之爪削弱",
    weakenCardArr: [40608, 39694]
  },
  {
    time: "2016-12-02",
    title: "《龙争虎斗加基森》上线",
  },
  {
    time: "2016-10-04",
    title: "兽群呼唤、斩杀、石化武器、海象人图腾师、叫嚣的中士、冲锋、尤格萨隆削弱",
    weakenCardArr: [38727, 785, 239, 2513, 242, 344, 38505]
  },
  {
    time: "2016-08-12",
    title: "《卡拉赞之夜》上线",
  },
  {
    time: "2016-04-27",
    title: "《古神的低语》上线、知识古树、自然之力、丛林守护者、铁喙猫头鹰、王牌猎人、猎人印记、剑刃乱舞、飞刀杂耍者、麻疯侏儒、奥术傀儡、熔核巨人、伪装大师削弱、《纳克萨玛斯的诅咒》、《地精大战侏儒》退环境",
  }
];

module.exports = {
  occupationInfo,
  timeNode
};
