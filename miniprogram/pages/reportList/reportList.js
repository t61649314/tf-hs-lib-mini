const {timeNode} = require('../../lib/const');
const {formatTime} = require('../../lib/utils');
const reportTitleMap = {"vicious-syndicate": "VS", "tempo-storm": "TS"};
const typeTitleMap = {"wild": "狂野", "standard": "标准"};
Page({
  data: {
    reportList: [],
    reportGroup: [],
    from: "",
    type: "",
  },
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: `${reportTitleMap[options.from]}${typeTitleMap[options.type]}战报`
    });
    this.setData({
      'from': options.from,
      'type': options.type
    });
    this.getReportList(0);
  },
  getReportList: function (skip) {
    const db = wx.cloud.database();
    let collection = db.collection('report-list').where({
      from: this.data.from,
      type: this.data.type,
    });
    let promise;
    if (skip > 0) {
      promise = collection.skip(skip).get();
    } else {
      promise = collection.get();
    }
    promise.then(({data}) => {
      if (data && data.length) {
        data.forEach(item => {
          item.time = formatTime(new Date(item.time));
        });
        data = data.filter(item => {
          return !item.jumpUrl;
        });
        this.data.reportList = this.data.reportList.concat(data);
        if (data.length === 20) {
          this.getReportList(skip + 20);
        } else {
          let reportGroup = this.data.reportList.concat(timeNode).sort((a, b) => {
            return new Date(b.time).getTime() - new Date(a.time).getTime()
          });
          reportGroup = reportGroup.filter((item, index) => {
            if (item.name) {
              return true;
            } else {
              let preItem = reportGroup[index - 1];
              let nextItem = reportGroup[index + 1];
              return !!((preItem && preItem.name) || (nextItem && nextItem.name));
            }
          });
          this.setData({
            'reportList': this.data.reportList,
            'reportGroup': reportGroup
          });
        }
      }
    }).catch(console.error)
  },
});