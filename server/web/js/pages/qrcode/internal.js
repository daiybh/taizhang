// 厂内运输车辆二维码子页
const QRCodeInternal = {
  template: `
    <div>
      <h3>厂内运输车辆二维码</h3>
      <el-button type="primary" @click="generateSelected">生成选中二维码</el-button>
      <el-table :data="list" style="width:100%" @selection-change="onSelectionChange">
        <el-table-column type="selection" width="50"></el-table-column>
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="license_plate" label="车牌"></el-table-column>
        <el-table-column prop="driver" label="司机"></el-table-column>
        <el-table-column prop="qrcode_url" label="二维码"></el-table-column>
      </el-table>
    </div>
  `,
  data() { return { list: [], selected: [] }; },
  mounted() { this.loadList(); },
  methods: {
    loadList() { request({ url: '/api/v1/internal-vehicles', method: 'get' }).then(res => { if (res && res.data) this.list = res.data.rows || res.data; }); },
    onSelectionChange(val) { this.selected = val; },
    generateSelected() { if (!this.selected.length) { this.$message.warning('请先选择车辆'); return; } this.$message.success('已生成厂内车辆二维码（模拟）'); }
  }
};

if (window && window.__component_registry__) { window.__component_registry__['qrcode-internal'] = QRCodeInternal; }
