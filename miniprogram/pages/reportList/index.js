const {formatTime} = require('../../lib/utils');
Page({
  data: {
    reportList: [],
    reportGroup: [],
    timeNode: [],
    from: "",
    type: "",
    scrollHeight: 0,
    noMore: false,
    pageNum: 1,
    scrollLoading: false,
  },
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: options.cnName
    });
    this.setData({
      'from': options.from,
      'type': options.type
    });
    const db = wx.cloud.database();
    db.collection('config-list')
      .doc('const')
      .get()
      .then(({data}) => {
        if (data) {
          this.setData({
            timeNode: data.timeNode,
          });
          wx.getSystemInfo({
            success: (res) => {
              this.setData({
                'scrollHeight': res.windowHeight
              });
              this.getReportList();
            }
          });
        }
      }).catch(console.error);
  },
  lower(e) {
    if (!this.data.noMore) {
      this.setData({
        'pageNum': this.data.pageNum + 1
      });
      this.getReportList();
    }
  },
  getReportList: function () {
    this.setData({
      'scrollLoading': true
    });
    const db = wx.cloud.database();
    db.collection('report-list').where({
      from: this.data.from,
      type: this.data.type,
    }).skip((this.data.pageNum - 1) * 20)
      .limit(20)
      .orderBy('time', 'desc').get().then(({data}) => {
      if (data && data.length) {
        let lastPage = false;
        if (data.length < 20) {
          this.setData({
            'noMore': true
          });
          lastPage = true;
        }
        let now = new Date();
        data.forEach(item => {
          item.fromUrlEncode = encodeURIComponent(item.fromUrl);
          item.timeStr = formatTime(new Date(item.time));
          item.isNew = now.getTime() - item.time < 3 * 24 * 60 * 60 * 1000;
        });
        data = data.filter(item => {
          return !item.jumpUrl;
        });
        this.data.reportList = this.data.reportList.concat(data);
        let reportList = this.data.reportList.sort((a, b) => {
          return b.time - a.time
        });
        let lastTime = reportList[reportList.length - 1].time;
        let reportGroup = reportList.concat(this.data.timeNode).sort((a, b) => {
          return new Date(b.time).getTime() - new Date(a.time).getTime()
        });
        reportGroup = reportGroup.filter((item, index) => {
          if (item.name) {
            return true;
          } else {
            return new Date(reportGroup[index].time).getTime() > lastTime || (lastPage & new Date(reportGroup[index - 1].time).getTime() === lastTime)
          }
        });
        this.setData({
          'reportList': this.data.reportList,
          'reportGroup': reportGroup,
        });
      }
      this.setData({
        'scrollLoading': false
      });
    }).catch(console.error)
  },
});
