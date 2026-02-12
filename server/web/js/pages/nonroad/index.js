// 非道路移动机械基本信息页面
const NonroadManagement = {
  template: `
    <div>
      <div class="page-header">
        <h2>非道路移动机械基本信息</h2>
        <p>查询并展示非道路移动机械基本信息（含照片）</p>
      </div>

      <div class="page-content">
        <div class="search-bar" style="margin-bottom:12px;">
          <el-form :inline="true" :model="searchForm">
            <el-form-item label="名称">
              <el-input v-model="searchForm.name" placeholder="设备名称" clearable />
            </el-form-item>
            <el-form-item label="审核状态">
              <el-select v-model="searchForm.audit_status" placeholder="全部" clearable style="width:120px;">
                <el-option label="全部" value="" />
                <el-option label="已审核" value="approved" />
                <el-option label="未审核" value="unapproved" />
              </el-select>
            </el-form-item>
            <el-form-item label="下发状态">
              <el-select v-model="searchForm.dispatch_status" placeholder="全部" clearable style="width:120px;">
                <el-option label="全部" value="" />
                <el-option label="已下发" value="dispatched" />
                <el-option label="未下发" value="undispatched" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="search">查询</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <el-table :data="list" border stripe style="width:100%">
          <el-table-column label="照片" prop="photos" width="180" fixed="left">
            <template #default="{ row }">
              <div style="display:flex;flex-direction:column;gap:6px;align-items:center;">
                <el-image v-if="row.front_photo" :src="row.front_photo" style="width:140px;height:90px;object-fit:cover;" :preview-src-list="[row.front_photo]" />
                <el-image v-else style="width:140px;height:90px;" src="/web/img/placeholder.png" />
                <el-image v-if="row.license_photo" :src="row.license_photo" style="width:140px;height:90px;object-fit:cover;" :preview-src-list="[row.license_photo]" />
                <el-image v-else style="width:140px;height:90px;" src="/web/img/placeholder.png" />
                <el-image v-if="row.manifest_photo" :src="row.manifest_photo" style="width:140px;height:90px;object-fit:cover;" :preview-src-list="[row.manifest_photo]" />
                <el-image v-else style="width:140px;height:90px;" src="/web/img/placeholder.png" />
              </div>
            </template>
          </el-table-column>

          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="name" label="名称" width="160" />
          <el-table-column prop="machine_type" label="设备类型" width="140" />
          <el-table-column prop="vin" label="识别代码(VIN)" min-width="160" show-overflow-tooltip />
          <el-table-column prop="register_date" label="注册登记日期" width="140" />
          <el-table-column prop="brand_model" label="品牌/型号" width="160" />
          <el-table-column prop="fuel_type" label="燃料类型" width="120" />
          <el-table-column prop="emission_standard" label="排放标准" width="120" />
          <el-table-column prop="network_status" label="联网状态" width="100" />
          <el-table-column prop="usage_nature" label="使用性质" width="120" />
          <el-table-column prop="created_at" label="登记时间" width="160" />
          <el-table-column prop="updated_at" label="修改时间" width="160" />
          <el-table-column prop="dispatch_time" label="下发时间" width="160" />
          <el-table-column prop="audit_status" label="审核状态" width="100" />
          <el-table-column prop="dispatch_status" label="下发状态" width="100" />
          <el-table-column prop="engine_number" label="发动机号码" width="160" />
          <el-table-column prop="engine_model" label="发动机型号" width="140" />
          <el-table-column prop="engine_manufacturer" label="发动机制造商" width="160" />
          <el-table-column prop="approved_load" label="核定载质量(kg)" width="140" />
          <el-table-column prop="max_towing" label="准牵引质量/kg" width="140" />
          <el-table-column prop="phone" label="手机号码" width="140" />
          <el-table-column prop="installed" label="是否安装" width="100" />
          <el-table-column prop="fleet_name" label="车队名称" width="140" />
          <el-table-column prop="in_cargo_name" label="进厂运输货物名称" width="160" />
          <el-table-column prop="in_cargo_amount" label="进厂运输量/吨" width="120" />
          <el-table-column prop="out_cargo_name" label="出厂运输货物名称" width="160" />
          <el-table-column prop="out_cargo_amount" label="出厂运输量/吨" width="120" />
          <el-table-column prop="address" label="住址" min-width="200" />
          <el-table-column prop="issue_date" label="发证日期" width="140" />
        </el-table>

        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10,20,50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="onPageSizeChange"
          @current-change="onPageChange"
          style="margin-top:20px; text-align:right;"
        />
      </div>
    </div>
  `,

  data() {
    return {
      searchForm: { name: '', audit_status: '', dispatch_status: '' },
      list: [],
      pagination: { page: 1, pageSize: 10, total: 0 }
    };
  },

  mounted() { this.loadList(); },

  methods: {
    async loadList() {
      try {
        const params = new URLSearchParams({ page: this.pagination.page, pageSize: this.pagination.pageSize, name: this.searchForm.name, audit_status: this.searchForm.audit_status, dispatch_status: this.searchForm.dispatch_status });
        const data = await request(`/nonroad-machines?${params}`);
        if (data && data.code === 0) { this.list = data.data?.list || []; this.pagination.total = data.data?.total || 0; }
      } catch (e) { console.error('Load nonroad machines failed', e); }
    },

    search() { this.pagination.page = 1; this.loadList(); },
    resetSearch() { this.searchForm = { name: '', audit_status: '', dispatch_status: '' }; this.search(); },

    onPageChange(page) { this.pagination.page = page; this.loadList(); },
    onPageSizeChange(size) { this.pagination.pageSize = size; this.pagination.page = 1; this.loadList(); }
  }
};

// Register component globally for dynamic loading (app.js uses component name mapping)
if (window && window.__component_registry__) { window.__component_registry__['nonroad-management'] = NonroadManagement; }
