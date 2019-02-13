const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const MAX_LIMIT = 100
let {timeNode, versionInfo} = require('./const');

function getWeight(card) {
  if (card.rarity === 'Legendary') {
    return 2;
  } else {
    return card.quantity
  }
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
  const {data: deck} = await db.collection('deck-list').doc(event.deckId).get();
  let suggestionsAddCardsObj = {};
  let suggestionsRemoveCardsObj = {};
// 先取出集合记录总数
  const where = {
    occupation: deck.occupation,
    type: deck.type
  };
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
  timeNode.forEach(item => {
    if (new Date(item.time).getTime() > deck.time && item.weakenCardArr) {
      weakenCardList = weakenCardList.concat(item.weakenCardArr)
    }
  });

  deck.cards.forEach(item => {
    let weight = getWeight(item);
    suggestionsRemoveCardsObj[item.dbfId] = {
      weight: weight * similarDeckList.length,
      info: item
    };
    if (weakenCardList.includes(item.dbfId)) {
      deckWeakenCardList.push(item);
    }
  });
  if (deckList && deckList.length) {
    similarDeckList = deckList.map(otherItem => {
      let sameWeight = 0;
      let sameQuantity = 0;
      deck.cards.forEach(currentCardItem => {
        let currentCardWeight = getWeight(currentCardItem);
        let otherCard = otherItem.cards.find(otherCardItem => otherCardItem.dbfId === currentCardItem.dbfId);
        if (otherCard) {
          let otherCardWeight = getWeight(otherCard);
          if (otherCardWeight === currentCardWeight && otherCardWeight === 2) {
            sameWeight += 2;
          } else {
            sameWeight += 1;
          }
          if (otherCard.quantity === currentCardItem.quantity && otherCard.quantity === 2) {
            sameQuantity += 2;
          } else {
            sameQuantity += 1;
          }
        }
      });
      return {
        sameWeight: sameWeight,
        sameQuantity: sameQuantity,
        deck: otherItem
      }
    }).filter(item => item.sameQuantity < 30 && item.sameWeight >= 20).sort((a, b) => {
      return b.sameWeight - a.sameWeight
    }).slice(0, 5);

    if (similarDeckList && similarDeckList.length) {
      similarDeckList.forEach(({deck: similarDeckItem}) => {
        let time = similarDeckItem.time;
        let weakenArr = timeNode.filter(item => {
          return new Date(item.time).getTime() > time && item.weakenCardArr;
        });
        let weakenCardIdList = [];
        weakenArr.forEach(item => {
          weakenCardIdList = weakenCardIdList.concat(item.weakenCardArr)
        });
        similarDeckItem.cards.forEach(cardItem => {
          let findCurrentCard = deck.cards.find(item => item.dbfId === cardItem.dbfId);
          let similarCardWeight = getWeight(cardItem);
          if (findCurrentCard) {//当前有这张卡，为remove做一次反向统计
            let currentCardWeight = getWeight(findCurrentCard);
            suggestionsRemoveCardsObj[cardItem.dbfId].weight -= similarCardWeight;

            if (weakenCardIdList.includes(cardItem.dbfId)) {
              return false;
            }
            if (similarCardWeight > currentCardWeight) {
              if (suggestionsAddCardsObj[cardItem.dbfId]) {
                suggestionsAddCardsObj[cardItem.dbfId].weight += (similarCardWeight - currentCardWeight);
              } else {
                suggestionsAddCardsObj[cardItem.dbfId] = {
                  weight: (similarCardWeight - currentCardWeight),
                  info: cardItem
                }
              }
            }
          } else {//当前没这张卡
            if (weakenCardIdList.includes(cardItem.dbfId)) {
              return false;
            }
            if (suggestionsAddCardsObj[cardItem.dbfId]) {
              suggestionsAddCardsObj[cardItem.dbfId].weight += similarCardWeight;
            } else {
              suggestionsAddCardsObj[cardItem.dbfId] = {
                weight: similarCardWeight,
                info: cardItem
              }
            }
          }
        });
      });
      suggestionsRemoveCardsList = sortCardWeightInfoToList(suggestionsRemoveCardsObj, 5, false);
      suggestionsAddCardList = sortCardWeightInfoToList(suggestionsAddCardsObj, 5, true);
    }
    Object.keys(versionInfo).forEach(key => {
      let item = versionInfo[key];
      versionInfo[key].hotCardWeightInfo = {};
      if (!item.time || new Date(item.time).getTime() < deck.time) {
        delete versionInfo[key]
      }
    });
    deckList.forEach(item => {
      item.cards.forEach(item => {
        let versionInfoItem = versionInfo[item.cardSet];
        if (versionInfoItem) {
          let findSugAddCard = suggestionsAddCardList.find(sugItem => {
            return sugItem.info.dbfId === item.dbfId
          });
          if (!findSugAddCard && !weakenCardList.includes(item.dbfId)) {
            if (versionInfoItem.hotCardWeightInfo[item.dbfId]) {
              versionInfoItem.hotCardWeightInfo[item.dbfId].weight += getWeight(item);
            } else {
              versionInfoItem.hotCardWeightInfo[item.dbfId] = {
                weight: getWeight(item),
                info: item
              };
            }
          }
        }
      })
    });
    Object.keys(versionInfo).forEach(key => {
      let item = versionInfo[key];
      let hotCardWeightInfo = item.hotCardWeightInfo;
      item.hotCardWeightList = sortCardWeightInfoToList(hotCardWeightInfo, 10, true);
      delete item.hotCardWeightInfo;
    });
  }
  return {
    deckWeakenCardList: deckWeakenCardList,
    newVersionCardList: Object.keys(versionInfo).reverse().map(item => {
      return {...versionInfo[item], id: item}
    }),
    suggestionsRemoveCardsList: suggestionsRemoveCardsList,
    suggestionsAddCardList: suggestionsAddCardList,
    similarDeckList: similarDeckList
  }
};