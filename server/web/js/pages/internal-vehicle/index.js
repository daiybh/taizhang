// 厂内运输车辆管理组件（重实现）
const InternalVehicleManagement = {
        template: `
        <div>
            <div class="page-header">
                <h2>厂内运输车辆</h2>
                <p>厂内运输车辆信息管理 — 查询 / 新建 / 编辑 / 删除 / 下发 / 导入导出</p>
            </div>

            <div class="page-content">
                <!-- 查询条件：车牌、审核状态、下发状态、排放阶段 -->
                <div class="search-bar" style="margin-bottom:12px;">
                    <el-form :inline="true" :model="searchForm">
                        <el-form-item label="车牌">
                            <el-input v-model="searchForm.license_plate" placeholder="车牌号" clearable />
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
                        <el-form-item label="排放阶段">
                            <el-select v-model="searchForm.emission_stage" placeholder="全部" clearable style="width:120px;">
                                <el-option label="全部" value="" />
                                <el-option label="国I" value="国I" />
                                <el-option label="国II" value="国II" />
                                <el-option label="国III" value="国III" />
                                <el-option label="国IV" value="国IV" />
                                <el-option label="国V" value="国V" />
                                <el-option label="国VI" value="国VI" />
                            </el-select>
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="search">查询</el-button>
                            <el-button @click="resetSearch">重置</el-button>
                        </el-form-item>
                    </el-form>
                </div>

                <!-- 批量下发按钮（只对已审核车辆生效） -->
                <div style="margin-bottom:8px;">
                    <el-button type="success" :disabled="!selection.length" @click="batchDispatch">批量下发</el-button>
                </div>

                <!-- 仅显示 Grid：左侧三张照片，右侧列出文档要求的所有字段 -->
                <el-table :data="list" border stripe style="width:100%" @selection-change="handleSelectionChange">
                    <el-table-column type="selection" width="55" />
                    <!-- 左侧图片列 -->
                    <el-table-column label="照片" prop="photos" width="180" fixed="left">
                        <template #default="{ row }">
                            <div style="display:flex;flex-direction:column;gap:6px;align-items:center;">
                                <el-image v-if="row.vehicle_photo" :src="row.vehicle_photo" style="width:140px;height:90px;object-fit:cover;" :preview-src-list="[row.vehicle_photo]" />
                                <el-image v-else style="width:140px;height:90px;" src="/web/img/placeholder.png" />
                                <el-image v-if="row.driving_license_photo" :src="row.driving_license_photo" style="width:140px;height:90px;object-fit:cover;" :preview-src-list="[row.driving_license_photo]" />
                                <el-image v-else style="width:140px;height:90px;" src="/web/img/placeholder.png" />
                                <el-image v-if="row.manifest_photo" :src="row.manifest_photo" style="width:140px;height:90px;object-fit:cover;" :preview-src-list="[row.manifest_photo]" />
                                <el-image v-else style="width:140px;height:90px;" src="/web/img/placeholder.png" />
                            </div>
                        </template>
                    </el-table-column>

                    <el-table-column type="index" label="序号" width="60" />
                    <el-table-column prop="license_plate" label="车牌号码" width="140" />
                    <el-table-column prop="plate_color" label="号牌颜色" width="100" />
                    <el-table-column prop="vehicle_type" label="车辆类型" width="120" />
                    <el-table-column prop="vin" label="车辆识别代码(VIN)" min-width="180" show-overflow-tooltip />
                    <el-table-column prop="register_date" label="注册登记日期" width="140" />
                    <el-table-column prop="brand_model" label="车辆品牌型号" width="160" />
                    <el-table-column prop="fuel_type" label="燃料类型" width="120" />
                    <el-table-column prop="emission_standard" label="排放标准" width="120" />
                    <el-table-column prop="network_status" label="联网状态" width="100" />
                    <el-table-column prop="usage_nature" label="使用性质" width="120" />
                    <el-table-column prop="created_at" label="登记时间" width="160" />
                    <el-table-column prop="updated_at" label="修改时间" width="160" />
                    <el-table-column prop="dispatch_time" label="下发时间" width="160" />
                    <el-table-column prop="audit_status" label="审核状态" width="100" align="center">
                        <template #default="{ row }">
                            <el-tag :type="row.audit_status === 'approved' ? 'success' : 'warning'">{{ row.audit_status === 'approved' ? '已审核' : '未审核' }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="dispatch_status" label="下发状态" width="100" align="center">
                        <template #default="{ row }">
                            <el-tag :type="row.dispatch_status === 'dispatched' ? 'success' : 'info'">{{ row.dispatch_status === 'dispatched' ? '已下发' : '未下发' }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="times" label="次数" width="80" />
                    <el-table-column prop="engine_number" label="发动机号码" width="160" />
                    <el-table-column prop="engine_model" label="发动机型号" width="140" />
                    <el-table-column prop="engine_manufacturer" label="发动机制造商" width="160" />
                    <el-table-column prop="approved_load_mass" label="核定载质量(kg)" width="140" />
                    <el-table-column prop="max_towing_mass" label="准牵引质量/kg" width="140" />
                    <el-table-column prop="phone" label="手机号码" width="140" />
                    <el-table-column prop="installed" label="是否安装" width="100" />
                    <el-table-column prop="fleet_name" label="车队名称" width="140" />
                    <el-table-column prop="in_cargo_name" label="进厂运输货物名称" width="160" />
                    <el-table-column prop="in_cargo_amount" label="进厂运输量/吨" width="120" />
                    <el-table-column prop="out_cargo_name" label="出厂运输货物名称" width="160" />
                    <el-table-column prop="out_cargo_amount" label="出厂运输量/吨" width="120" />
                    <el-table-column prop="address" label="住址" min-width="200" />
                    <el-table-column prop="issue_date" label="发证日期" width="140" />
                    <el-table-column label="操作" width="100" fixed="right" align="center">
                        <template #default="{ row }">
                            <el-button size="mini" type="success" @click="dispatch(row)" :disabled="row.audit_status !== 'approved'">下发</el-button>
                        </template>
                    </el-table-column>
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

                <!-- 新建 / 编辑 对话框 -->
                <el-dialog title="车辆" :visible.sync="dialogVisible" width="760px">
                    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
                        <el-row :gutter="16">
                            <el-col :span="12">
                                <el-form-item label="车牌号" prop="license_plate"><el-input v-model="form.license_plate" /></el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item label="号牌颜色" prop="plate_color"><el-input v-model="form.plate_color" /></el-form-item>
                            </el-col>
                        </el-row>
                        <el-row :gutter="16">
                            <el-col :span="12"><el-form-item label="车辆类型" prop="vehicle_type"><el-input v-model="form.vehicle_type" /></el-form-item></el-col>
                            <el-col :span="12"><el-form-item label="VIN" prop="vin"><el-input v-model="form.vin" maxlength="17" /></el-form-item></el-col>
                        </el-row>
                        <el-row :gutter="16">
                            <el-col :span="12"><el-form-item label="环保编号" prop="environmental_code"><el-input v-model="form.environmental_code" /></el-form-item></el-col>
                            <el-col :span="12"><el-form-item label="注册日期" prop="register_date"><el-input v-model="form.register_date" placeholder="YYYY-MM-DD" /></el-form-item></el-col>
                        </el-row>
                        <el-row :gutter="16">
                            <el-col :span="12"><el-form-item label="品牌/型号" prop="brand_model"><el-input v-model="form.brand_model" /></el-form-item></el-col>
                            <el-col :span="12"><el-form-item label="燃料类型" prop="fuel_type"><el-input v-model="form.fuel_type" /></el-form-item></el-col>
                        </el-row>
                        <el-row :gutter="16">
                            <el-col :span="12"><el-form-item label="批准载质量" prop="approved_load_mass"><el-input-number v-model="form.approved_load_mass" :min="0" /></el-form-item></el-col>
                            <el-col :span="12"><el-form-item label="最大牵引质量" prop="max_towing_mass"><el-input-number v-model="form.max_towing_mass" :min="0" /></el-form-item></el-col>
                        </el-row>
                        <el-form-item label="所有者" prop="owner"><el-input v-model="form.owner" /></el-form-item>
                        <el-form-item label="地址" prop="address"><el-input v-model="form.address" /></el-form-item>
                    </el-form>
                    <template #footer>
                        <el-button @click="dialogVisible=false">取消</el-button>
                        <el-button type="primary" @click="onSave">保存</el-button>
                    </template>
                </el-dialog>

                <!-- 隐藏 CSV 导入控件 -->
                <input type="file" ref="csvInput" accept="text/csv" style="display:none" @change="handleFileChange" />

                <!-- 下发记录对话框 -->
                <el-dialog title="下发记录" :visible.sync="dispatchRecordsVisible" width="600px">
                    <el-table :data="dispatchRecords" style="width:100%">
                        <el-table-column prop="id" label="ID" width="80" />
                        <el-table-column prop="operator" label="操作人" />
                        <el-table-column prop="time" label="时间" />
                        <el-table-column prop="remark" label="备注" />
                    </el-table>
                    <template #footer><el-button @click="dispatchRecordsVisible=false">关闭</el-button></template>
                </el-dialog>
            </div>
        </div>
        `,

        data() {
            return {
                searchForm: { license_plate: '', vin: '', audit_status: '', dispatch_status: '', emission_stage: '' },
                list: [],
                selection: [],
                pagination: { page: 1, pageSize: 10, total: 0 }
            };
        },

        mounted() { this.loadList(); },

        methods: {
            async loadList() {
                try {
                    const params = new URLSearchParams({ page: this.pagination.page, pageSize: this.pagination.pageSize, license_plate: this.searchForm.license_plate, vin: this.searchForm.vin });
                    const data = await request(`/internal-vehicles?${params}`);
                    if (data.code === 0) {
                        this.list = data.data?.list || [];
                        this.pagination.total = data.data?.total || 0;
                    }
                } catch (e) { console.error('Load internal vehicles failed', e); }
            },

            search() { this.pagination.page = 1; this.loadList(); },
            resetSearch() { this.searchForm = { license_plate: '', vin: '' }; this.search(); },

            handleSelectionChange(val) { this.selection = val; },

            onPageChange(page) { this.pagination.page = page; this.loadList(); },
            onPageSizeChange(size) { this.pagination.pageSize = size; this.pagination.page = 1; this.loadList(); },

            async dispatch(row) {
                if (!row || row.audit_status !== 'approved') { ElMessage.warning('仅已审核车辆可下发'); return; }
                try {
                    await ElMessageBox.confirm(`确认将车辆 ${row.license_plate || row.id} 下发吗？`, '确认下发', { type: 'warning' });
                    const res = await request('/internal-vehicles/dispatch', { method: 'POST', body: JSON.stringify({ ids: [row.id] }) });
                    if (res && res.code === 0) { ElMessage.success('下发成功'); this.loadList(); } else { ElMessage.error(res?.msg || '下发失败'); }
                } catch (e) {
                    if (e === 'cancel' || e === 'close') return; // 用户取消
                    console.error('Dispatch failed', e); ElMessage.error('下发失败');
                }
            },

            async batchDispatch() {
                if (!this.selection.length) { ElMessage.warning('未选择记录'); return; }
                const approved = this.selection.filter(s => s.audit_status === 'approved');
                const approvedIds = approved.map(s => s.id);
                if (!approvedIds.length) { ElMessage.warning('所选记录中无已审核车辆可下发'); return; }
                try {
                    await ElMessageBox.confirm(`确认下发 ${approvedIds.length} 辆已审核车辆吗？`, '确认批量下发', { type: 'warning' });
                    const res = await request('/internal-vehicles/dispatch', { method: 'POST', body: JSON.stringify({ ids: approvedIds }) });
                    if (res && res.code === 0) { ElMessage.success('批量下发成功'); this.loadList(); } else { ElMessage.error(res?.msg || '批量下发失败'); }
                } catch (e) {
                    if (e === 'cancel' || e === 'close') return;
                    console.error('Batch dispatch failed', e); ElMessage.error('批量下发失败');
                }
            }
        }
};
// Register component for dynamic registry
if (window && window.__component_registry__) { window.__component_registry__['internal-vehicle-management'] = InternalVehicleManagement; }
