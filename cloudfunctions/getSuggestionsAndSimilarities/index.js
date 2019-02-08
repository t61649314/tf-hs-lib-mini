const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const MAX_LIMIT = 100
const {timeNode} = require('./const');

function getQuantity(card) {
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
  if (deckList && deckList.length) {
    let similarDeckList = deckList.map(otherItem => {
      let union = 0;
      deck.cards.forEach(currentCardItem => {
        suggestionsRemoveCardsObj[currentCardItem.dbfId] = {
          count: getQuantity(currentCardItem) * 5,
          info: currentCardItem
        };
        let otherCard = otherItem.cards.find(otherCardItem => otherCardItem.dbfId === currentCardItem.dbfId);
        if (otherCard) {
          if (getQuantity(otherCard) === getQuantity(currentCardItem) && getQuantity(otherCard) === 2) {
            union += 2;
          } else {
            union += 1;
          }
        }
      });
      return {
        union: union,
        deck: otherItem
      }
    }).filter(item => item.union < 30 && item.union > 10).sort((a, b) => {
      return b.union - a.union
    }).slice(0, 5);

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
        let similarCardQuantity = getQuantity(cardItem);
        if (findCurrentCard) {//当前有这张卡，为remove做一次反向统计
          let currentCardQuantity = getQuantity(findCurrentCard);
          suggestionsRemoveCardsObj[cardItem.dbfId].count -= similarCardQuantity;

          if (weakenCardIdList.includes(cardItem.dbfId)) {
            return false;
          }
          if (similarCardQuantity > currentCardQuantity) {
            if (suggestionsAddCardsObj[cardItem.dbfId]) {
              suggestionsAddCardsObj[cardItem.dbfId].count += (similarCardQuantity - currentCardQuantity);
            } else {
              suggestionsAddCardsObj[cardItem.dbfId] = {
                count: (similarCardQuantity - currentCardQuantity),
                info: cardItem
              }
            }
          }
        } else {//当前没这张卡
          if (weakenCardIdList.includes(cardItem.dbfId)) {
            return false;
          }
          if (suggestionsAddCardsObj[cardItem.dbfId]) {
            suggestionsAddCardsObj[cardItem.dbfId].count += similarCardQuantity;
          } else {
            suggestionsAddCardsObj[cardItem.dbfId] = {
              count: similarCardQuantity,
              info: cardItem
            }
          }
        }
      });
    });
    const suggestionsRemoveCardsList = Object.keys(suggestionsRemoveCardsObj).sort((a, b) => {
      return suggestionsRemoveCardsObj[b].count - suggestionsRemoveCardsObj[a].count
    }).slice(0, 5).map(item => suggestionsRemoveCardsObj[item]);
    const suggestionsAddCardList = Object.keys(suggestionsAddCardsObj).sort((a, b) => {
      return suggestionsAddCardsObj[b].count - suggestionsAddCardsObj[a].count
    }).slice(0, 5).map(item => suggestionsAddCardsObj[item]);
    return {
      suggestionsRemoveCardsList: suggestionsRemoveCardsList,
      suggestionsAddCardList: suggestionsAddCardList,
      similarDeckList: similarDeckList
    }
  }
}