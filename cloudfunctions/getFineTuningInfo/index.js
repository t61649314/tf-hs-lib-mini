const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const MAX_LIMIT = 100
let {timeNode, versionInfo, honorRoomTimeNode} = require('./const');

function formatNum(num) {
  return Math.round(num * 100) / 100
}

function sortCardWeightInfoToList(obj, len, legendaryIsUp) {
  return Object.keys(obj).sort((a, b) => {
    let weightDiff = obj[b].weight - obj[a].weight;
    if (weightDiff === 0) {
      let bIsLegendary = obj[b].info.rarity === 'Legendary' ? 1 : 0;
      let aIsLegendary = obj[a].info.rarity === 'Legendary' ? 1 : 0;
      if (legendaryIsUp) {
        return bIsLegendary - aIsLegendary;
      } else {
        return aIsLegendary - bIsLegendary;
      }
    } else {
      return weightDiff;
    }
  }).slice(0, len).map(item => obj[item])
}

exports.main = async (event, context) => {
  let mVersionInfo = Object.assign({}, versionInfo);
  const {data: deck} = await db.collection('deck-list').doc(event.deckId).get();
  let suggestionsAddCardsObj = {};
  let suggestionsRemoveCardsObj = {};
// 先取出集合记录总数
  const where = {
    occupation: deck.occupation,
  };
  const newVersionTimeLong = new Date(timeNode[0].time).getTime();
  let versionInfoKeys = Object.keys(mVersionInfo);
  const currentStandardVersion = mVersionInfo[versionInfoKeys[versionInfoKeys.length - 1]];
  let currentStandardVersionKeys = versionInfoKeys.filter(key => {
    return mVersionInfo[key].year === currentStandardVersion.year
  });
  const standardMinTimeLong = new Date(mVersionInfo[currentStandardVersionKeys[0]].time).getTime();
  let sameQuantityLimit;
  let fineTuningType;
  let currentDeckMinTimeLong;
  if (deck.type === "standard") {
    if (deck.time > newVersionTimeLong) {//最新补丁之后的标准卡组
      const _ = db.command;
      where.time = _.gt(newVersionTimeLong);
      where.type = "standard";
      sameQuantityLimit = 25;
      fineTuningType = 1;
    } else if (deck.time > standardMinTimeLong) {//当前标准年份时期构筑的卡组，可能更贴近标准一些
      const _ = db.command;
      where.time = _.gt(standardMinTimeLong);
      where.type = "standard";
      sameQuantityLimit = 15;
      fineTuningType = 2;
    } else {//更早的标准卡组，贴近狂野
      //拿当前卡组的构筑起始时间
      let currentDeckVersion = mVersionInfo[versionInfoKeys.find((key, index) => {
        return new Date(mVersionInfo[key].time).getTime() < deck.time && new Date(mVersionInfo[versionInfoKeys[index + 1]].time).getTime() > deck.time
      })];
      let currentDeckVersionKeys = versionInfoKeys.filter(key => {
        return mVersionInfo[key].year === currentDeckVersion.year || mVersionInfo[key].year === currentDeckVersion.year - 1
      });
      currentDeckMinTimeLong = new Date(mVersionInfo[currentDeckVersionKeys[0]].time).getTime();
      where.type = "wild";
      sameQuantityLimit = 15;
      fineTuningType = 3;
    }
  } else {//狂野卡组
    where.type = "wild";
    sameQuantityLimit = 20;
    fineTuningType = 4;
  }
  const countResult = await db.collection('deck-list').where(where).count()
  const total = countResult.total
  // 计算需分几次取
  const batchTimes = Math.ceil(total / 100)
  // 承载所有读操作的 promise 的数组
  const tasks = []
  for (let i = 0; i < batchTimes; i++) {
    const promise = db.collection('deck-list').where(where).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
    tasks.push(promise)
  }
  // 等待所有
  let {data: deckList} = (await Promise.all(tasks)).reduce((acc, cur) => ({data: acc.data.concat(cur.data)}))
  let suggestionsRemoveCardsList = [];
  let suggestionsAddCardList = [];
  let similarDeckList = [];
  let deckWeakenCardList = [];
  let weakenCardList = [];
  let latestTimeSimilarDeckIndex = -1;
  timeNode.forEach(item => {
    if (new Date(item.time).getTime() > deck.time && item.weakenCardArr) {
      weakenCardList = weakenCardList.concat(item.weakenCardArr)
    }
  });

  //查询同职业同类型的所有卡组
  if (deckList && deckList.length) {
    //获取到相似的卡组，最多5个
    similarDeckList = deckList.map(otherItem => {
      let sameQuantity = 0;
      deck.cards.forEach(currentCardItem => {
        let otherCard = otherItem.cards.find(otherCardItem => otherCardItem.dbfId === currentCardItem.dbfId);
        if (otherCard) {
          if (otherCard.quantity === currentCardItem.quantity && otherCard.quantity === 2) {
            sameQuantity += 2;
          } else {
            sameQuantity += 1;
          }
        }
      });
      return {
        sameQuantity: sameQuantity,
        deck: otherItem
      }
    }).filter(item => item.sameQuantity < 30 && item.sameQuantity >= sameQuantityLimit).sort((a, b) => {
      if (b.sameQuantity === a.sameQuantity) {
        return b.deck.time - a.deck.time
      } else {
        return b.sameQuantity - a.sameQuantity
      }
    }).slice(0, 5);
    //遍历相似卡组得到权重合
    let similarPercentTotal = 0;
    let latestTime = 0;
    similarDeckList.forEach((item, index) => {
      similarPercentTotal += formatNum(item.sameQuantity / 30);
      if (item.deck.time > latestTime) {
        latestTime = item.deck.time;
        latestTimeSimilarDeckIndex = index;
      }
    });
    //遍历当前卡组的所有卡，初始化根据相似卡组数量得到remove权重，同时得到当前卡组中削弱的卡
    deck.cards.forEach(item => {
      suggestionsRemoveCardsObj[item.dbfId] = {
        weight: formatNum(item.quantity * similarPercentTotal),
        info: item
      };
      if (weakenCardList.includes(item.dbfId)) {
        deckWeakenCardList.push(item);
      }
    });

    if (similarDeckList && similarDeckList.length) {
      similarDeckList.forEach(({deck: similarDeckItem, sameQuantity}) => {
        let time = similarDeckItem.time;
        let similarPercent = formatNum(sameQuantity / 30);
        let weakenArr = timeNode.filter(item => {
          return new Date(item.time).getTime() > time && item.weakenCardArr;
        });
        let weakenCardIdList = [];
        weakenArr.forEach(item => {
          weakenCardIdList = weakenCardIdList.concat(item.weakenCardArr)
        });
        similarDeckItem.cards.forEach(cardItem => {
          let findCurrentCard = deck.cards.find(item => item.dbfId === cardItem.dbfId);
          if (findCurrentCard) {//当前有这张卡，为remove做一次反向统计
            suggestionsRemoveCardsObj[cardItem.dbfId].weight = formatNum(suggestionsRemoveCardsObj[cardItem.dbfId].weight - cardItem.quantity * similarPercent);

            if (weakenCardIdList.includes(cardItem.dbfId)) {
              return false;
            }
            if (cardItem.quantity > findCurrentCard.quantity) {
              if (suggestionsAddCardsObj[cardItem.dbfId]) {
                suggestionsAddCardsObj[cardItem.dbfId].weight = formatNum(suggestionsAddCardsObj[cardItem.dbfId].weight + (cardItem.quantity - findCurrentCard.quantity) * similarPercent);
              } else {
                suggestionsAddCardsObj[cardItem.dbfId] = {
                  weight: formatNum((cardItem.quantity - findCurrentCard.quantity) * similarPercent),
                  info: cardItem
                }
              }
            }
          } else {//当前没这张卡
            if (weakenCardIdList.includes(cardItem.dbfId)) {
              return false;
            }
            if (suggestionsAddCardsObj[cardItem.dbfId]) {
              suggestionsAddCardsObj[cardItem.dbfId].weight = formatNum(suggestionsAddCardsObj[cardItem.dbfId].weight + cardItem.quantity * similarPercent);
            } else {
              suggestionsAddCardsObj[cardItem.dbfId] = {
                weight: formatNum(cardItem.quantity * similarPercent),
                info: cardItem
              }
            }
          }
        });
      });
      suggestionsRemoveCardsList = sortCardWeightInfoToList(suggestionsRemoveCardsObj, 5, false).filter(item => item.weight > 0);
      suggestionsAddCardList = sortCardWeightInfoToList(suggestionsAddCardsObj, 5, true).filter(item => item.weight > 0);
    }
    let currentDeckWithOutHonorRoomCards = [];
    Object.keys(mVersionInfo).forEach(key => {
      let item = mVersionInfo[key];
      let itemTime = new Date(item.time).getTime();
      mVersionInfo[key].hotCardWeightInfo = {};
      if (fineTuningType === 3 && key === "4") {//type为3的时候要考虑荣誉室
        honorRoomTimeNode.forEach(honorRoomItem => {
          let honorRoomItemTime = new Date(honorRoomItem.time).getTime();
          if (honorRoomItemTime < deck.time) {
            currentDeckWithOutHonorRoomCards = currentDeckWithOutHonorRoomCards.concat(honorRoomItem.cardArr);
          }
        });
        if (!currentDeckWithOutHonorRoomCards.length) {
          delete mVersionInfo[key]
        }
      } else {
        if (!item.time) {
          delete mVersionInfo[key]
        } else if (fineTuningType === 3 && currentDeckMinTimeLong) {
          if (itemTime < deck.time && itemTime >= currentDeckMinTimeLong) {
            delete mVersionInfo[key]
          }
        } else if (itemTime < deck.time) {
          delete mVersionInfo[key]
        }
      }
    });
    deckList.forEach(item => {
      let weakenCardList = [];
      timeNode.forEach(timeNodeItem => {
        if (new Date(timeNodeItem.time).getTime() > item.time && timeNodeItem.weakenCardArr) {
          weakenCardList = weakenCardList.concat(timeNodeItem.weakenCardArr)
        }
      });
      item.cards.forEach(item => {
        let versionInfoItem = mVersionInfo[item.cardSet];
        if (versionInfoItem) {
          if (!weakenCardList.includes(item.dbfId)) {
            if (item.cardSet === "4" && !currentDeckWithOutHonorRoomCards.includes(item.dbfId)) {
              return false;
            }
            if (versionInfoItem.hotCardWeightInfo[item.dbfId]) {
              versionInfoItem.hotCardWeightInfo[item.dbfId].weight += item.quantity;
            } else {
              versionInfoItem.hotCardWeightInfo[item.dbfId] = {
                weight: item.quantity,
                info: item
              };
            }
          }
        }
      })
    });
    Object.keys(mVersionInfo).forEach(key => {
      let item = mVersionInfo[key];
      let hotCardWeightInfo = item.hotCardWeightInfo;
      item.hotCardWeightList = sortCardWeightInfoToList(hotCardWeightInfo, 10, true);
      delete item.hotCardWeightInfo;
    });
  }
  return {
    deck: deck,
    latestTimeSimilarDeckIndex: latestTimeSimilarDeckIndex,
    fineTuningType: fineTuningType,
    deckWeakenCardList: deckWeakenCardList,
    newVersionCardList: Object.keys(mVersionInfo).reverse().map(item => {
      return {...mVersionInfo[item], id: item}
    }),
    suggestionsRemoveCardsList: suggestionsRemoveCardsList,
    suggestionsAddCardList: suggestionsAddCardList,
    similarDeckList: similarDeckList
  }
};