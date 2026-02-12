
// vehicle.js
const app = getApp()

Page({
  data: {
    activeTab: 'external',
    vehicles: [],
    page: 1,
    pageSize: 10,
    hasMore: true
  },

  onLoad() {
    this.loadVehicles()
  },

  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true
    })
    this.loadVehicles()
    wx.stopPullDownRefresh()
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.loadVehicles()
    }
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab !== this.data.activeTab) {
      this.setData({
        activeTab: tab,
        page: 1,
        hasMore: true,
        vehicles: []
      })
      this.loadVehicles()
    }
  },

  // 加载车辆列表
  loadVehicles() {
    if (!this.data.hasMore) return

    wx.showLoading({
      title: '加载中...'
    })

    let url = ''
    switch (this.data.activeTab) {
      case 'external':
        url = app.globalData.apiBase + '/external-vehicles'
        break
      case 'internal':
        url = app.globalData.apiBase + '/internal-vehicles'
        break
      case 'nonroad':
        url = app.globalData.apiBase + '/non-road'
        break
    }

    wx.request({
      url: url,
      method: 'GET',
      data: {
        parkId: 1, // 从用户信息中获取
        page: this.data.page,
        pageSize: this.data.pageSize
      },
      success: (res) => {
        wx.hideLoading()
        if (res.statusCode === 200) {
          const newVehicles = res.data.data || []
          this.setData({
            vehicles: this.data.page === 1 ? newVehicles : [...this.data.vehicles, ...newVehicles],
            hasMore: newVehicles.length >= this.data.pageSize
          })
          if (this.data.hasMore) {
            this.setData({
              page: this.data.page + 1
            })
          }
        }
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      }
    })
  },

  // 查看车辆详情
  viewVehicle(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/vehicle/${this.data.activeTab}/${this.data.activeTab}?id=${id}`
    })
  }
})
