Component({
  properties: {
    componentHeight: Number
  },
  data: {
    current: "wild",
    wildHasNew: false,
    standardHasNew: false,
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
        from: "team-rankstar",
        cnName: "TeamRankstar狂野月报",
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
      },
      {
        from: "zaowuzhe",
        cnName: "造物者狂野战报",
        hasNew: false
      },
      {
        from: "suzhijicha",
        cnName: "素质极差狂野战报",
        hasNew: false
      },
      {
        from: "nga-carry",
        cnName: "NGA搬运狂野卡组",
        hasNew: false
      },
      {
        from: "other",
        cnName: "其他",
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
              let findItem = this.data.standardFromList.find(item => {
                return item.from === reportItem.from
              });
              if (findItem) {
                findItem.hasNew = true;
                this.setData({
                  'standardHasNew': true,
                  'standardFromList': this.data.standardFromList
                });
              }
            }
            if (reportItem.type === "wild") {
              let findItem = this.data.wildFromList.find(item => {
                return item.from === reportItem.from
              });
              if (findItem) {
                findItem.hasNew = true;
                this.setData({
                  'wildHasNew': true,
                  'wildFromList': this.data.wildFromList
                });
              }
            }
          })
        }
      }).catch(console.error)
    }
  },
  methods: {
    handleChange({detail}) {
      this.setData({
        current: detail.key
      });
    },
  }
})