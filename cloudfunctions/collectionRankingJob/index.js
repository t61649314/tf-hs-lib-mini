const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
exports.main = async (event, context) => {
  try {
    return await db.collection('collection-ranking').add({
      // data 字段表示需新增的 JSON 数据
      data: {
        time: new Date().getTime()
      }
    })
  } catch (e) {
    console.error(e)
  }
}