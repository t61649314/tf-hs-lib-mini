const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const MAX_LIMIT = 100
const {timeNode} = require('./const');

function getWeight(card) {
  if (card.rarity === 'Legendary') {
    return 2;
  } else {
    return card.quantity
  }
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
      deck.cards.forEach(item => {
        let weight = getWeight(item);
        suggestionsRemoveCardsObj[item.dbfId] = {
          weight: weight * similarDeckList.length,
          info: item
        };
      });
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
      suggestionsRemoveCardsList = Object.keys(suggestionsRemoveCardsObj).sort((a, b) => {
        let weightDiff = suggestionsRemoveCardsObj[b].weight - suggestionsRemoveCardsObj[a].weight;
        if (weightDiff === 0) {
          let bIsLegendary = suggestionsRemoveCardsObj[b].info.rarity === 'Legendary' ? 1 : 0;
          let aIsLegendary = suggestionsRemoveCardsObj[a].info.rarity === 'Legendary' ? 1 : 0;
          return aIsLegendary - bIsLegendary;
        } else {
          return weightDiff;
        }
      }).slice(0, 5).map(item => suggestionsRemoveCardsObj[item]);
      suggestionsAddCardList = Object.keys(suggestionsAddCardsObj).sort((a, b) => {
        let weightDiff = suggestionsAddCardsObj[b].weight - suggestionsAddCardsObj[a].weight;
        if (weightDiff === 0) {
          let bIsLegendary = suggestionsAddCardsObj[b].info.rarity === 'Legendary' ? 1 : 0;
          let aIsLegendary = suggestionsAddCardsObj[a].info.rarity === 'Legendary' ? 1 : 0;
          return bIsLegendary - aIsLegendary;
        } else {
          return weightDiff;
        }
      }).slice(0, 5).map(item => suggestionsAddCardsObj[item]);
    }
  }
  return {
    suggestionsRemoveCardsList: suggestionsRemoveCardsList,
    suggestionsAddCardList: suggestionsAddCardList,
    similarDeckList: similarDeckList
  }
}