
// index.js
const app = getApp()

Page({
  data: {

  },

  onLoad() {

  },

  // 扫码登记
  scanQRCode() {
    wx.scanCode({
      success: (res) => {
        // 跳转到扫码页面
        wx.navigateTo({
          url: '/pages/scan/scan?qrcode=' + encodeURIComponent(res.result)
        })
      },
      fail: (err) => {
        wx.showToast({
          title: '扫码失败',
          icon: 'none'
        })
      }
    })
  },

  // 查看我的车辆
  viewVehicles() {
    wx.navigateTo({
      url: '/pages/vehicle/vehicle'
    })
  }
})
