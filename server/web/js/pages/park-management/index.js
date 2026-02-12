// 车场管理组件（移动到 js/pages/park-management）
const ParkManagement = {
    components: {
        ParkFormDialog,
        ParkRenewDialog
    },

    template: `
        <div>
            <div class="page-header">
                <h2>车场管理</h2>
                <p>管理所有车场信息，支持增删改查、续费、下载功能</p>
            </div>
            <div class="page-content">
                <div class="search-bar">
                    <el-form :inline="true" :model="searchForm">
                        <el-form-item label="车场名称">
                            <el-input v-model="searchForm.name" placeholder="请输入车场名称" clearable />
                        </el-form-item>
                        <el-form-item label="车场编号">
                            <el-input v-model="searchForm.code" placeholder="请输入车场编号" clearable />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="search">查询</el-button>
                            <el-button @click="resetSearch">重置</el-button>
                        </el-form-item>
                    </el-form>
                </div>
                
                <div class="toolbar">
                    <el-button type="primary" @click="handleAdd">新增车场</el-button>
                </div>
                
                <el-table :data="list" border stripe style="width: 100%">
                    <el-table-column type="index" label="序号" width="60" align="center" />
                    <el-table-column prop="name" label="车场名称" min-width="120" />
                    <el-table-column prop="code" label="车场编号" min-width="120" />
                    <el-table-column prop="secret_key" label="密钥" min-width="150" show-overflow-tooltip />
                    <el-table-column prop="login_account" label="登录账号" width="100" align="center" />
                    <el-table-column prop="login_password" label="登录密码" width="100" align="center" />
                    <el-table-column prop="created_at" label="创建时间" min-width="150" />
                    <el-table-column prop="start_time" label="开始时间" min-width="120" />
                    <el-table-column prop="end_time" label="结束时间" min-width="120" />
                    <el-table-column prop="province" label="省" width="80" />
                    <el-table-column prop="city" label="市" width="80" />
                    <el-table-column prop="district" label="区" width="80" />
                    <el-table-column prop="industry" label="行业" min-width="100" />
                    <el-table-column prop="contact_name" label="联系人" width="100" />
                    <el-table-column prop="contact_phone" label="联系电话" min-width="120" />
                    <el-table-column label="操作" width="280" fixed="right" align="center">
                        <template #default="scope">
                            <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
                            <el-button type="success" size="small" @click="handleRenew(scope.row)">续费</el-button>
                            <el-button type="info" size="small" @click="downloadInfo(scope.row)">下载</el-button>
                            <el-button type="danger" size="small" @click="deletePark(scope.row)">删除</el-button>
                        </template>
                    </el-table-column>
                </el-table>
                
                <el-pagination
                    v-model:current-page="pagination.page"
                    v-model:page-size="pagination.pageSize"
                    :total="pagination.total"
                    :page-sizes="[10, 20, 50, 100]"
                    layout="total, sizes, prev, pager, next, jumper"
                    @size-change="loadData"
                    @current-change="loadData"
                    style="margin-top: 20px; justify-content: flex-end;"
                />
            </div>
            
            <!-- 车场表单对话框 -->
            <ParkFormDialog
                v-model:visible="formDialogVisible"
                :mode="formDialogMode"
                :data="currentPark"
                @success="handleFormSuccess"
            />
            
            <!-- 车场续费对话框 -->
            <ParkRenewDialog
                v-model:visible="renewDialogVisible"
                :data="currentPark"
                @success="handleRenewSuccess"
            />
        </div>
    `,
    
    data() {
        return {
            searchForm: { name: '', code: '' },
            list: [],
            pagination: { page: 1, pageSize: 10, total: 0 },
            formDialogVisible: false,
            formDialogMode: 'add', // 'add' 或 'edit'
            renewDialogVisible: false,
            currentPark: null // 当前操作的车场数据
        };
    },
    
    mounted() {
        this.loadData();
    },
    
    methods: {
        async loadData() {
            try {
                const params = new URLSearchParams({
                    page: this.pagination.page,
                    pageSize: this.pagination.pageSize,
                    ...this.searchForm
                });
                const data = await request(`/parks?${params}`);
                if (data.code === 0) {
                    this.list = (data.data?.list || []).map(item => ({
                        ...item,
                        created_at: formatDate(item.created_at),
                        start_time: formatDate(item.start_time),
                        end_time: formatDate(item.end_time)
                    }));
                    this.pagination.total = data.data?.total || 0;
                } else {
                    ElMessage.error(data.message || '加载失败');
                }
            } catch (error) {
                console.error('Load parks failed:', error);
            }
        },
        
        search() {
            this.pagination.page = 1;
            this.loadData();
        },
        
        resetSearch() {
            this.searchForm = { name: '', code: '' };
            this.search();
        },
        
        handleAdd() {
            this.formDialogMode = 'add';
            this.currentPark = null;
            this.formDialogVisible = true;
        },
        
        handleEdit(row) {
            this.formDialogMode = 'edit';
            this.currentPark = { ...row };
            this.formDialogVisible = true;
        },
        
        handleFormSuccess() {
            this.loadData();
        },
        
        handleRenew(row) {
            this.currentPark = { ...row };
            this.renewDialogVisible = true;
        },
        
        handleRenewSuccess() {
            this.loadData();
        },
        
        deletePark(row) {
            ElMessageBox.confirm(`确定要删除车场"${row.name}"吗？此操作不可恢复。`, '警告', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                try {
                    const result = await request(`/parks/${row.id}`, { method: 'DELETE' });
                    if (result.code === 0) {
                        ElMessage.success('删除成功');
                        this.loadData();
                    } else {
                        ElMessage.error(result.message || '删除失败');
                    }
                } catch (error) {
                    console.error('Delete park failed:', error);
                }
            }).catch(() => {});
        },
        
        downloadInfo(row) {
            const content = `车场信息
车场名称：${row.name}
车场编号：${row.code}
密钥：${row.secret_key}
创建时间：${row.created_at}
开始时间：${row.start_time}
结束时间：${row.end_time}
登陆网址：http://localhost:8080
账号：${row.login_account || '未设置'}
密码：${row.login_password || '未设置'}`;

            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${row.name}_${row.code}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            ElMessage.success('下载成功');
        }
    }
};
