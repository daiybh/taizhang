// 厂外运输车辆管理组件（移动到 js/pages/external-vehicle）
const ExternalVehicleManagement = {
    template: `
        <div>
            <div class="page-header">
                <h2>厂外运输车辆基本信息</h2>
                <p>管理厂外运输车辆，支持查询、审核和下发</p>
            </div>
            <div class="page-content">
                <div class="search-bar">
                    <el-form :inline="true" :model="searchForm">
                        <el-form-item label="车牌号">
                            <el-input v-model="searchForm.plateNumber" placeholder="请输入车牌号" clearable />
                        </el-form-item>
                        <el-form-item label="审核状态">
                            <el-select v-model="searchForm.auditStatus" placeholder="请选择" clearable>
                                <el-option label="已审核" value="approved" />
                                <el-option label="未审核" value="pending" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="下发状态">
                            <el-select v-model="searchForm.dispatchStatus" placeholder="请选择" clearable>
                                <el-option label="已下发" value="dispatched" />
                                <el-option label="未下发" value="pending" />
                            </el-select>
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="search">查询</el-button>
                            <el-button @click="resetSearch">重置</el-button>
                        </el-form-item>
                    </el-form>
                </div>
                
                <div class="toolbar">
                    <el-button type="success" @click="batchDispatch" :disabled="!selection.length">批量下发</el-button>
                    <el-button type="warning" @click="batchAudit" :disabled="!selection.length">批量审核</el-button>
                </div>
                
                <el-table :data="list" border stripe style="width: 100%" @selection-change="handleSelectionChange">
                    <el-table-column type="selection" width="55" />
                    <el-table-column type="index" label="序号" width="60" align="center" />
                    <el-table-column prop="plateNumber" label="车牌号码" width="120" />
                    <el-table-column prop="plateColor" label="号牌颜色" width="100" />
                    <el-table-column prop="vehicleType" label="车辆类型" width="120" />
                    <el-table-column prop="vin" label="车辆识别代码" min-width="180" show-overflow-tooltip />
                    <el-table-column prop="emissionStandard" label="排放标准" width="100" />
                    <el-table-column prop="auditStatus" label="审核状态" width="100" align="center">
                        <template #default="scope">
                            <el-tag :type="scope.row.auditStatus === 'approved' ? 'success' : 'warning'">
                                {{ scope.row.auditStatus === 'approved' ? '已审核' : '未审核' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="dispatchStatus" label="下发状态" width="100" align="center">
                        <template #default="scope">
                            <el-tag :type="scope.row.dispatchStatus === 'dispatched' ? 'success' : 'info'">
                                {{ scope.row.dispatchStatus === 'dispatched' ? '已下发' : '未下发' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="200" fixed="right" align="center">
                        <template #default="scope">
                            <el-button type="warning" size="small" @click="audit(scope.row)" v-if="scope.row.auditStatus !== 'approved'">审核</el-button>
                            <el-button type="success" size="small" @click="dispatch(scope.row)" v-if="scope.row.auditStatus === 'approved'">下发</el-button>
                            <el-button type="primary" size="small" @click="viewDetail(scope.row)">详情</el-button>
                        </template>
                    </el-table-column>
                </el-table>
                
                <el-pagination
                    v-model:current-page="pagination.page"
                    v-model:page-size="pagination.pageSize"
                    :total="pagination.total"
                    :page-sizes="[10, 20, 50, 100]"
                    layout="total, sizes, prev, pager, next, jumper"
                    @size-change="loadList"
                    @current-change="loadList"
                    style="margin-top: 20px; justify-content: flex-end;"
                />
            </div>
        </div>
    `,
    
    data() { return { searchForm: { plateNumber: '', auditStatus: '', dispatchStatus: '' }, list: [], selection: [], pagination: { page: 1, pageSize: 10, total: 0 } }; },
    
    mounted() { this.loadList(); },
    
    methods: {
        async loadList() {
            try {
                const params = new URLSearchParams({ page: this.pagination.page, pageSize: this.pagination.pageSize, ...this.searchForm });
                const data = await request(`/external-vehicles?${params}`);
                if (data.code === 0) { this.list = data.data?.list || []; this.pagination.total = data.data?.total || 0; }
            } catch (error) { console.error('Load external vehicles failed:', error); }
        },
        search() { this.pagination.page = 1; this.loadList(); },
        resetSearch() { this.searchForm = { plateNumber: '', auditStatus: '', dispatchStatus: '' }; this.search(); },
        handleSelectionChange(val) { this.selection = val; },
        async audit(row) { try { const result = await request('/external-vehicles/audit', { method: 'POST', body: JSON.stringify({ ids: [row.id], status: 'approved' }) }); if (result.code === 0) { ElMessage.success('审核成功'); this.loadList(); } } catch (error) { console.error('Audit failed:', error); } },
        async batchAudit() { try { const ids = this.selection.map(item => item.id); const result = await request('/external-vehicles/audit', { method: 'POST', body: JSON.stringify({ ids, status: 'approved' }) }); if (result.code === 0) { ElMessage.success('批量审核成功'); this.loadList(); } } catch (error) { console.error('Batch audit failed:', error); } },
        async dispatch(row) { try { const result = await request('/external-vehicles/dispatch', { method: 'POST', body: JSON.stringify({ ids: [row.id] }) }); if (result.code === 0) { ElMessage.success('下发成功'); this.loadList(); } } catch (error) { console.error('Dispatch failed:', error); } },
        async batchDispatch() { const unapproved = this.selection.filter(item => item.auditStatus !== 'approved'); if (unapproved.length > 0) { ElMessage.warning('只能下发已审核的车辆'); return; } try { const ids = this.selection.map(item => item.id); const result = await request('/external-vehicles/dispatch', { method: 'POST', body: JSON.stringify({ ids }) }); if (result.code === 0) { ElMessage.success('批量下发成功'); this.loadList(); } } catch (error) { console.error('Batch dispatch failed:', error); } },
        viewDetail(row) { ElMessage.info('详情功能开发中...'); }
    }
};
