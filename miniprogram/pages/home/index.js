Component({
  properties: {
    componentHeight: Number
  },
  data: {
    wildFromList: [
      {
        from: "vicious-syndicate",
        cnName: "VS战报",
        hasNew: false
      },
      {
        from: "tempo-storm",
        cnName: "TS战报",
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
        cnName: "VS战报",
        hasNew: false
      },
      {
        from: "tempo-storm",
        cnName: "TS战报",
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
            }
            if (reportItem.type === "wild") {
              this.data.wildFromList.find(item => {
                return item.from === reportItem.from
              }).hasNew = true;
            }
          })
        }
      }).catch(console.error)
    }
  },
  methods: {}
})