const {timeNode} = require('../../lib/const');
const {formatTime} = require('../../lib/utils');
Page({
  data: {
    reportList: [],
    reportGroup: [],
    from: "",
    type: "",
    loading: true
  },
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: options.cnName
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
    }).limit(20);
    let promise;
    if (skip > 0) {
      promise = collection.skip(skip).get();
    } else {
      promise = collection.get();
    }
    promise.then(({data}) => {
      if (data) {
        let now = new Date();
        data.forEach(item => {
          item.timeStr = formatTime(new Date(item.time));
          item.isNew = now.getTime() - item.time < 3 * 24 * 60 * 60 * 1000;
        });
        data = data.filter(item => {
          return !item.jumpUrl;
        });
        this.data.reportList = this.data.reportList.concat(data);
        if (data.length === 20) {
          this.getReportList(skip + 20);
        } else {
          let reportList = this.data.reportList.sort((a, b) => {
            return b.time - a.time
          });
          let lastTime = reportList[reportList.length - 1].time;
          let reportGroup = reportList.concat(timeNode).sort((a, b) => {
            return new Date(b.time).getTime() - new Date(a.time).getTime()
          });
          reportGroup = reportGroup.filter((item, index) => {
            if (item.name) {
              return true;
            } else {
              return new Date(reportGroup[index].time).getTime() > lastTime || new Date(reportGroup[index - 1].time).getTime() === lastTime
            }
          });
          this.setData({
            'reportList': this.data.reportList,
            'reportGroup': reportGroup,
            'loading': false
          });
        }
      }
    }).catch(console.error)
  },
});