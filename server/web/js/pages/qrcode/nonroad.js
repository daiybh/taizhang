// 非道路移动机械二维码子页
const QRCodeNonroad = {
  template: `
    <div>
      <h3>非道路移动机械二维码</h3>
      <el-button type="primary" @click="generateSelected">生成选中二维码</el-button>
      <el-table :data="list" style="width:100%" @selection-change="onSelectionChange">
        <el-table-column type="selection" width="50"></el-table-column>
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="license_plate" label="编号/车牌"></el-table-column>
        <el-table-column prop="owner" label="单位/所有者"></el-table-column>
        <el-table-column prop="qrcode_url" label="二维码"></el-table-column>
      </el-table>
    </div>
  `,
  data() { return { list: [], selected: [] }; },
  mounted() { this.loadList(); },
  methods: {
    loadList() { request({ url: '/api/v1/non-road', method: 'get' }).then(res => { if (res && res.data) this.list = res.data.rows || res.data; }); },
    onSelectionChange(val) { this.selected = val; },
    generateSelected() { if (!this.selected.length) { this.$message.warning('请先选择'); return; } this.$message.success('已生成非道路机械二维码（模拟）'); }
  }
};

if (window && window.__component_registry__) { window.__component_registry__['qrcode-nonroad'] = QRCodeNonroad; }
