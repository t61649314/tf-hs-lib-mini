Component({
  properties: {
    componentHeight: Number
  },
  data: {
    wildFromList: [
      {
        from: "vicious-syndicate",
        cnName: "VS狂野月报",
        hasNew: false
      },
      {
        from: "tempo-storm",
        cnName: "TS狂野月报",
        hasNew: false
      },
      {
        from: "shengerkuangye",
        cnName: "生而狂野战报",
        hasNew: false
      },
      {
        from: "fengtian",
        cnName: "奉天狂野战报",
        hasNew: false
      }
    ],
    standardFromList: [
      {
        from: "vicious-syndicate",
        cnName: "VS标准周报",
        hasNew: false
      },
      {
        from: "tempo-storm",
        cnName: "TS标准周报",
        hasNew: false
      }
    ],
  },
  lifetimes: {
    attached() {
      const db = wx.cloud.database();
      const _ = db.command;
      let timeLimit = new Date().getTime() - 3 * 24 * 60 * 60 * 1000;
      db.collection('report-list')
        .where({
          time: _.gt(timeLimit)
        })
        .get().then(({data}) => {
        if (data && data.length) {
          data.forEach(reportItem => {
            if (reportItem.type === "standard") {
              this.data.standardFromList.find(item => {
                return item.from === reportItem.from
              }).hasNew = true;
              this.setData({
                'standardFromList': this.data.standardFromList
              });
            }
            if (reportItem.type === "wild") {
              this.data.wildFromList.find(item => {
                return item.from === reportItem.from
              }).hasNew = true;
              this.setData({
                'wildFromList': this.data.wildFromList
              });
            }
          })
        }
      }).catch(console.error)
    }
  },
  methods: {}
})