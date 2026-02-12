// 车场管理组件
const ParkManagement = {
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
                    <el-button type="primary" @click="showDialog('add')">新增车场</el-button>
                </div>
                
                <el-table :data="list" border stripe style="width: 100%">
                    <el-table-column type="index" label="序号" width="60" align="center" />
                    <el-table-column prop="name" label="车场名称" min-width="120" />
                    <el-table-column prop="code" label="车场编号" min-width="120" />
                    <el-table-column prop="secretKey" label="密钥" min-width="150" show-overflow-tooltip />
                    <el-table-column prop="createdAt" label="创建时间" min-width="150" />
                    <el-table-column prop="startTime" label="开始时间" min-width="120" />
                    <el-table-column prop="endTime" label="结束时间" min-width="120" />
                    <el-table-column prop="province" label="省" width="80" />
                    <el-table-column prop="city" label="市" width="80" />
                    <el-table-column prop="district" label="区" width="80" />
                    <el-table-column prop="industry" label="行业" min-width="100" />
                    <el-table-column prop="contact" label="联系人" width="100" />
                    <el-table-column prop="contactPhone" label="联系电话" min-width="120" />
                    <el-table-column label="操作" width="280" fixed="right" align="center">
                        <template #default="scope">
                            <el-button type="primary" size="small" @click="showDialog('edit', scope.row)">编辑</el-button>
                            <el-button type="success" size="small" @click="showRenewDialog(scope.row)">续费</el-button>
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
            
            <!-- 新增/编辑对话框 -->
            <el-dialog
                v-model="dialogVisible"
                :title="dialogTitle"
                width="700px"
                @close="resetForm"
            >
                <el-form :model="form" :rules="rules" ref="formRef" label-width="140px">
                    <el-form-item label="车场名称" prop="name">
                        <el-input v-model="form.name" placeholder="请输入车场名称" />
                    </el-form-item>
                    <el-form-item label="车场编号" prop="code">
                        <el-input v-model="form.code" placeholder="请输入车场编号" :disabled="dialogMode === 'edit'" />
                    </el-form-item>
                    <el-form-item label="省" prop="province">
                        <el-input v-model="form.province" placeholder="请输入省份" />
                    </el-form-item>
                    <el-form-item label="市" prop="city">
                        <el-input v-model="form.city" placeholder="请输入城市" />
                    </el-form-item>
                    <el-form-item label="区" prop="district">
                        <el-input v-model="form.district" placeholder="请输入区县" />
                    </el-form-item>
                    <el-form-item label="行业" prop="industry">
                        <el-input v-model="form.industry" placeholder="请输入行业" />
                    </el-form-item>
                    <el-form-item label="联系人" prop="contact">
                        <el-input v-model="form.contact" placeholder="请输入联系人" />
                    </el-form-item>
                    <el-form-item label="联系电话" prop="contactPhone">
                        <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
                    </el-form-item>
                    <el-form-item label="开始时间" prop="startTime" v-if="dialogMode === 'add'">
                        <el-date-picker v-model="form.startTime" type="date" placeholder="选择开始时间" style="width: 100%;" />
                    </el-form-item>
                    <el-form-item label="结束时间" prop="endTime" v-if="dialogMode === 'add'">
                        <el-date-picker v-model="form.endTime" type="date" placeholder="选择结束时间" style="width: 100%;" />
                    </el-form-item>
                    <el-form-item label="备注" prop="remark">
                        <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="save">确定</el-button>
                </template>
            </el-dialog>
            
            <!-- 续费对话框 -->
            <el-dialog
                v-model="renewDialogVisible"
                title="车场续费"
                width="500px"
                @close="resetRenewForm"
            >
                <el-form :model="renewForm" ref="renewFormRef" label-width="140px">
                    <el-form-item label="车场名称">
                        <el-input v-model="renewForm.parkName" disabled />
                    </el-form-item>
                    <el-form-item label="续费前结束时间">
                        <el-input v-model="renewForm.oldEndTime" disabled />
                    </el-form-item>
                    <el-form-item label="续费时长(月)" prop="duration">
                        <el-input-number v-model="renewForm.duration" :min="1" :max="120" />
                    </el-form-item>
                    <el-form-item label="续费后结束时间">
                        <el-input v-model="computedNewEndTime" disabled />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="renewDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="saveRenew">确定</el-button>
                </template>
            </el-dialog>
        </div>
    `,
    
    data() {
        return {
            searchForm: { name: '', code: '' },
            list: [],
            pagination: { page: 1, pageSize: 10, total: 0 },
            dialogVisible: false,
            dialogMode: 'add',
            dialogTitle: '新增车场',
            form: {},
            rules: {
                name: [{ required: true, message: '请输入车场名称', trigger: 'blur' }],
                code: [{ required: true, message: '请输入车场编号', trigger: 'blur' }],
                contact: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
                contactPhone: [
                    { required: true, message: '请输入联系电话', trigger: 'blur' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
                ]
            },
            renewDialogVisible: false,
            renewForm: { parkId: null, parkName: '', oldEndTime: '', duration: 12 }
        };
    },
    
    computed: {
        computedNewEndTime() {
            if (!this.renewForm.oldEndTime || !this.renewForm.duration) return '';
            const d = new Date(this.renewForm.oldEndTime);
            d.setMonth(d.getMonth() + this.renewForm.duration);
            return formatDate(d);
        }
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
                        createdAt: formatDate(item.createdAt),
                        startTime: formatDate(item.startTime),
                        endTime: formatDate(item.endTime)
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
        
        showDialog(mode, row = null) {
            this.dialogMode = mode;
            this.dialogTitle = mode === 'add' ? '新增车场' : '编辑车场';
            if (mode === 'edit' && row) {
                this.form = { ...row };
            } else {
                this.resetForm();
                const now = new Date();
                const oneYearLater = new Date();
                oneYearLater.setFullYear(now.getFullYear() + 1);
                this.form.startTime = now;
                this.form.endTime = oneYearLater;
            }
            this.dialogVisible = true;
        },
        
        async save() {
            try {
                await this.$refs.formRef.validate();
                const data = {
                    ...this.form,
                    startTime: formatDate(this.form.startTime),
                    endTime: formatDate(this.form.endTime)
                };
                const result = this.dialogMode === 'add' 
                    ? await request('/parks', { method: 'POST', body: JSON.stringify(data) })
                    : await request(`/parks/${this.form.id}`, { method: 'PUT', body: JSON.stringify(data) });
                
                if (result.code === 0) {
                    ElMessage.success(this.dialogMode === 'add' ? '新增成功' : '编辑成功');
                    this.dialogVisible = false;
                    this.loadData();
                } else {
                    ElMessage.error(result.message || '保存失败');
                }
            } catch (error) {
                console.error('Save park failed:', error);
            }
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
        
        resetForm() {
            this.form = {
                id: null, name: '', code: '', province: '', city: '', district: '',
                industry: '', contact: '', contactPhone: '', startTime: '', endTime: '', remark: ''
            };
            this.$refs.formRef?.resetFields();
        },
        
        showRenewDialog(row) {
            this.renewForm = {
                parkId: row.id,
                parkName: row.name,
                oldEndTime: row.endTime,
                duration: 12
            };
            this.renewDialogVisible = true;
        },
        
        async saveRenew() {
            try {
                const result = await request(`/parks/${this.renewForm.parkId}/renew`, {
                    method: 'POST',
                    body: JSON.stringify({ duration: this.renewForm.duration })
                });
                if (result.code === 0) {
                    ElMessage.success('续费成功');
                    this.renewDialogVisible = false;
                    this.loadData();
                } else {
                    ElMessage.error(result.message || '续费失败');
                }
            } catch (error) {
                console.error('Renew park failed:', error);
            }
        },
        
        resetRenewForm() {
            this.renewForm = { parkId: null, parkName: '', oldEndTime: '', duration: 12 };
        },
        
        downloadInfo(row) {
            const content = `车场信息
车场名称：${row.name}
车场编号：${row.code}
密钥：${row.secretKey}
创建时间：${row.createdAt}
开始时间：${row.startTime}
结束时间：${row.endTime}
登陆网址：http://localhost:8080
账号：${row.loginAccount || 'admin'}
密码：${row.loginPassword || '请联系管理员'}`;

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
