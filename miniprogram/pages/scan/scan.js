
// scan.js
const app = getApp()

Page({
  data: {
    qrcode: '',
    parkName: '',
    companyEnabled: false,
    companies: [],
    companyIndex: 0,
    showForm: false,
    vehicle: {
      licensePlate: '',
      plateColor: '',
      vehicleType: '',
      vin: '',
      registerDate: '',
      issueDate: '',
      brandModel: '',
      usageNature: '',
      owner: '',
      address: '',
      engineNumber: '',
      engineModel: '',
      engineManufacturer: '',
      emissionStandard: '',
      fuelType: '',
      approvedLoadMass: '',
      maxTowingMass: '',
      phone: '',
      isOBDEnabled: true
    }
  },

  onLoad(options) {
    if (options.qrcode) {
      this.setData({
        qrcode: decodeURIComponent(options.qrcode)
      })
      this.scanQRCode()
    }
  },

  // 扫码处理
  scanQRCode() {
    wx.request({
      url: app.globalData.apiBase + '/mini-program/scan',
      method: 'POST',
      data: {
        qrcode: this.data.qrcode
      },
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            parkName: res.data.parkName,
            companyEnabled: res.data.companyEnabled,
            companies: res.data.companies
          })
        } else {
          wx.showToast({
            title: res.data.error || '扫码失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      }
    })
  },

  // 选择公司
  bindCompanyChange(e) {
    this.setData({
      companyIndex: parseInt(e.detail.value)
    })
  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths
        this.uploadImage(tempFilePaths[0])
      }
    })
  },

  // 上传图片并识别
  uploadImage(filePath) {
    wx.showLoading({
      title: '识别中...'
    })

    wx.uploadFile({
      url: app.globalData.apiBase + '/mini-program/ocr',
      filePath: filePath,
      name: 'file',
      success: (res) => {
        wx.hideLoading()
        const data = JSON.parse(res.data)
        if (data.code === 0) {
          this.setData({
            showForm: true,
            vehicle: {
              ...this.data.vehicle,
              licensePlate: data.licensePlate,
              plateColor: data.plateColor,
              vehicleType: data.vehicleType,
              vin: data.vin,
              registerDate: data.registerDate,
              issueDate: data.issueDate,
              brandModel: data.brandModel,
              usageNature: data.usageNature,
              owner: data.owner,
              address: data.address,
              engineNumber: data.engineNumber
            }
          })
          // 获取第三方数据
          this.getThirdPartyData()
        } else {
          wx.showToast({
            title: data.message || '识别失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        })
      }
    })
  },

  // 获取第三方随车清单数据
  getThirdPartyData() {
    wx.request({
      url: app.globalData.apiBase + '/mini-program/get-car-data',
      method: 'POST',
      data: {
        plate: this.data.vehicle.licensePlate,
        vin: this.data.vehicle.vin,
        engine_number: this.data.vehicle.engineNumber,
        vehicle_type: this.data.vehicle.vehicleType
      },
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            vehicle: {
              ...this.data.vehicle,
              engineModel: res.data.engine_model || this.data.vehicle.engineModel,
              engineManufacturer: res.data.engine_manufacturer || this.data.vehicle.engineManufacturer,
              emissionStandard: res.data.emission_standard || this.data.vehicle.emissionStandard,
              fuelType: res.data.fuel_type || this.data.vehicle.fuelType
            }
          })
        }
      }
    })
  },

  // 输入事件处理
  onEngineNumberInput(e) {
    this.setData({
      'vehicle.engineNumber': e.detail.value
    })
  },

  onEngineManufacturerInput(e) {
    this.setData({
      'vehicle.engineManufacturer': e.detail.value
    })
  },

  onApprovedLoadMassInput(e) {
    this.setData({
      'vehicle.approvedLoadMass': e.detail.value
    })
  },

  onMaxTowingMassInput(e) {
    this.setData({
      'vehicle.maxTowingMass': e.detail.value
    })
  },

  onPhoneInput(e) {
    this.setData({
      'vehicle.phone': e.detail.value
    })
  },

  onOBDSwitchChange(e) {
    this.setData({
      'vehicle.isOBDEnabled': e.detail.value
    })
  },

  // 提交车辆信息
  submitVehicle() {
    // 验证必填字段
    if (!this.data.vehicle.brandModel) {
      wx.showToast({
        title: '请填写品牌型号',
        icon: 'none'
      })
      return
    }

    if (!this.data.vehicle.usageNature) {
      wx.showToast({
        title: '请填写使用性质',
        icon: 'none'
      })
      return
    }

    if (!this.data.vehicle.owner) {
      wx.showToast({
        title: '请填写所有人',
        icon: 'none'
      })
      return
    }

    if (!this.data.vehicle.address) {
      wx.showToast({
        title: '请填写住址',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '提交中...'
    })

    wx.request({
      url: app.globalData.apiBase + '/mini-program/vehicle',
      method: 'POST',
      data: {
        ...this.data.vehicle,
        parkId: 1, // 从扫码结果中获取
        companyId: this.data.companyEnabled ? this.data.companies[this.data.companyIndex].id : null
      },
      success: (res) => {
        wx.hideLoading()
        if (res.statusCode === 200) {
          wx.showToast({
            title: '提交成功',
            icon: 'success'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          wx.showToast({
            title: res.data.error || '提交失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      }
    })
  }
})
