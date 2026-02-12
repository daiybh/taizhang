// 公司管理组件（已移动到 js/components）
const CompanyManagement = {
    components: { CompanyFormDialog },

    template: `
        <div>
            <div class="page-header">
                <h2>公司管理</h2>
                <p>管理所有公司信息，支持增删改查</p>
            </div>
            <div class="page-content">
                <div class="search-bar">
                    <el-form :inline="true" :model="searchForm">
                        <el-form-item label="公司名称">
                            <el-input v-model="searchForm.name" placeholder="请输入公司名称" clearable />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="search">查询</el-button>
                            <el-button @click="resetSearch">重置</el-button>
                        </el-form-item>
                    </el-form>
                </div>

                <div class="toolbar">
                    <el-button type="primary" @click="showDialog('add')">新增公司</el-button>
                </div>

                <el-table :data="list" border stripe style="width: 100%">
                    <el-table-column type="index" label="序号" width="60" align="center" />
                    <el-table-column prop="id" label="ID" width="80" />
                    <el-table-column prop="name" label="公司名称" min-width="200" />
                    <el-table-column prop="contact_name" label="联系人" width="120" />
                    <el-table-column prop="contact_phone" label="联系电话" width="150" />
                    <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
                    <el-table-column label="操作" width="180" fixed="right" align="center">
                        <template #default="scope">
                            <el-button type="primary" size="small" @click="showDialog('edit', scope.row)">编辑</el-button>
                            <el-button type="danger" size="small" @click="deleteItem(scope.row)">删除</el-button>
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

            <CompanyFormDialog
                v-model:visible="dialogVisible"
                :mode="dialogMode"
                :data="current"
                @success="handleSuccess"
            />
        </div>
    `,

    data() {
        return {
            searchForm: { name: '' },
            list: [],
            pagination: { page: 1, pageSize: 10, total: 0 },
            dialogVisible: false,
            dialogMode: 'add',
            current: null
        };
    },

    mounted() { this.loadList(); },

    methods: {
        async loadList() {
            try {
                const params = new URLSearchParams({ page: this.pagination.page, pageSize: this.pagination.pageSize, ...this.searchForm });
                const data = await request(`/companies?${params}`);
                if (data.code === 0) {
                    this.list = data.data?.list || [];
                    this.pagination.total = data.data?.total || 0;
                }
            } catch (error) { console.error('Load companies failed:', error); }
        },

        search() { this.pagination.page = 1; this.loadList(); },
        resetSearch() { this.searchForm = { name: '' }; this.search(); },

        showDialog(mode, row = null) {
            this.dialogMode = mode;
            this.current = mode === 'edit' && row ? { ...row } : null;
            this.dialogVisible = true;
        },

        async deleteItem(row) {
            ElMessageBox.confirm(`确定要删除公司"${row.name}"吗？`, '警告', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
                .then(async () => {
                    try {
                        const result = await request(`/companies/${row.id}`, { method: 'DELETE' });
                        if (result.code === 0) { ElMessage.success('删除成功'); this.loadList(); }
                    } catch (error) { console.error('Delete company failed:', error); }
                }).catch(() => {});
        },

        handleSuccess() { this.loadList(); }
    }
};

// Register component for dynamic registry
if (window && window.__component_registry__) { window.__component_registry__['company-management'] = CompanyManagement; }
