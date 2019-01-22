const {timeNode} = require('../../lib/const');
const {formatTime} = require('../../lib/utils');
const reportTitleMap = {"vicious-syndicate": "VS", "tempo-storm": "TS", "shengerkuangye": "生而"};
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
    db.collection('report-list').where({
      from: this.data.from,
      type: this.data.type,
    }).skip(skip)
      .get()
      .then(({data}) => {
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
              'reportGroup': reportGroup
            });
          }
        }
      }).catch(console.error)
  },
});