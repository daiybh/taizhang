// 二维码管理页面（容纳三个子页：厂外 / 厂内 / 非道路）
const QRCodeManagement = {
  template: `
    <div>
      <div class="page-header">
        <h2>二维码管理</h2>
        <p>管理厂外运输车辆、厂内运输车辆、非道路移动机械的二维码</p>
      </div>
      <div class="page-content">
        <el-tabs v-model:active="activeTab">
          <el-tab-pane label="厂外运输车辆二维码" name="external">
            <component :is="'qrcode-external'" />
          </el-tab-pane>
          <el-tab-pane label="厂内运输车辆二维码" name="internal">
            <component :is="'qrcode-internal'" />
          </el-tab-pane>
          <el-tab-pane label="非道路移动机械二维码" name="nonroad">
            <component :is="'qrcode-nonroad'" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  `,

  data() { return { activeTab: 'external' }; }
};

// Register
if (window && window.__component_registry__) { window.__component_registry__['qrcode-management'] = QRCodeManagement; }
