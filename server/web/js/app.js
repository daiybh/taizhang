const { createApp } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;

// API 基础路径
const API_BASE = '/api/v1';

// 创建 Vue 应用实例（稍后挂载）
let app;

// 工具函数 - 格式化日期
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 工具函数 - 日期加月份
function addMonths(date, months) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
}

// 工具函数 - HTTP 请求
async function request(url, options = {}) {
    try {
        const response = await fetch(API_BASE + url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Request failed:', error);
        ElMessage.error(error.message || '请求失败');
        throw error;
    }
}

app = createApp({
    data() {
        return {
            // 用户信息
            currentUser: 'admin',
            userRole: 'admin', // admin: 管理层, park: 车场层
            
            // 当前激活的菜单
            activeMenu: 'welcome',
            
            // 车场管理
            parkSearchForm: {
                name: '',
                code: ''
            },
            parkList: [],
            parkPagination: {
                page: 1,
                pageSize: 10,
                total: 0
            },
            parkDialogVisible: false,
            parkDialogMode: 'add', // add 或 edit
            parkDialogTitle: '新增车场',
            parkForm: {
                id: null,
                name: '',
                code: '',
                province: '',
                city: '',
                district: '',
                industry: '',
                contact: '',
                contactPhone: '',
                startTime: '',
                endTime: '',
                remark: ''
            },
            parkRules: {
                name: [{ required: true, message: '请输入车场名称', trigger: 'blur' }],
                code: [{ required: true, message: '请输入车场编号', trigger: 'blur' }],
                contact: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
                contactPhone: [
                    { required: true, message: '请输入联系电话', trigger: 'blur' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
                ]
            },
            
            // 续费对话框
            renewDialogVisible: false,
            renewForm: {
                parkId: null,
                parkName: '',
                oldEndTime: '',
                duration: 12
            },
            
            // 续费记录
            renewalSearchForm: {
                parkName: '',
                parkCode: ''
            },
            renewalList: [],
            renewalPagination: {
                page: 1,
                pageSize: 10,
                total: 0
            }
        };
    },
    
    computed: {
        currentPageTitle() {
            const menuMap = {
                '1-1': '车场管理',
                '1-2': '续费记录',
                '2-1': '车场信息',
                '2-2': '公司管理',
                '2-3': '厂外运输车辆',
                '2-4': '厂内运输车辆',
                '2-5': '非道路移动机械',
                '2-6': '二维码管理',
                '2-7': '用户权限',
                '2-8': '部门管理'
            };
            return menuMap[this.activeMenu] || '';
        },
        
        computedNewEndTime() {
            if (!this.renewForm.oldEndTime || !this.renewForm.duration) {
                return '';
            }
            const newDate = addMonths(new Date(this.renewForm.oldEndTime), this.renewForm.duration);
            return formatDate(newDate);
        }
    },
    
    mounted() {
        // 加载初始数据
        this.loadParks();
    },
    
    methods: {
        // 菜单选择
        handleMenuSelect(index) {
            this.activeMenu = index;
            
            // 根据选中的菜单加载对应数据
            switch(index) {
                case '1-1':
                    this.loadParks();
                    break;
                case '1-2':
                    this.loadRenewals();
                    break;
            }
        },
        
        // 退出登录
        handleLogout() {
            ElMessageBox.confirm('确定要退出登录吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                ElMessage.success('退出成功');
                // 这里可以添加跳转到登录页的逻辑
            }).catch(() => {});
        },
        
        // ==================== 车场管理 ====================
        
        // 加载车场列表
        async loadParks() {
            try {
                const params = new URLSearchParams({
                    page: this.parkPagination.page,
                    pageSize: this.parkPagination.pageSize,
                    ...this.parkSearchForm
                });
                
                const data = await request(`/parks?${params}`);
                
                if (data.code === 0) {
                    this.parkList = (data.data?.list || []).map(item => ({
                        ...item,
                        createdAt: formatDate(item.createdAt),
                        startTime: formatDate(item.startTime),
                        endTime: formatDate(item.endTime)
                    }));
                    this.parkPagination.total = data.data?.total || 0;
                } else {
                    ElMessage.error(data.message || '加载失败');
                }
            } catch (error) {
                console.error('Load parks failed:', error);
            }
        },
        
        // 搜索车场
        searchParks() {
            this.parkPagination.page = 1;
            this.loadParks();
        },
        
        // 重置搜索
        resetParkSearch() {
            this.parkSearchForm = {
                name: '',
                code: ''
            };
            this.searchParks();
        },
        
        // 显示车场对话框
        showParkDialog(mode, row = null) {
            this.parkDialogMode = mode;
            this.parkDialogTitle = mode === 'add' ? '新增车场' : '编辑车场';
            
            if (mode === 'edit' && row) {
                this.parkForm = {
                    id: row.id,
                    name: row.name,
                    code: row.code,
                    province: row.province,
                    city: row.city,
                    district: row.district,
                    industry: row.industry,
                    contact: row.contact,
                    contactPhone: row.contactPhone,
                    remark: row.remark
                };
            } else {
                this.resetParkForm();
                // 新增时设置默认时间
                const now = new Date();
                const oneYearLater = new Date();
                oneYearLater.setFullYear(now.getFullYear() + 1);
                this.parkForm.startTime = now;
                this.parkForm.endTime = oneYearLater;
            }
            
            this.parkDialogVisible = true;
        },
        
        // 保存车场
        async savePark() {
            try {
                await this.$refs.parkFormRef.validate();
                
                const data = {
                    ...this.parkForm,
                    startTime: formatDate(this.parkForm.startTime),
                    endTime: formatDate(this.parkForm.endTime)
                };
                
                let result;
                if (this.parkDialogMode === 'add') {
                    result = await request('/parks', {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });
                } else {
                    result = await request(`/parks/${this.parkForm.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(data)
                    });
                }
                
                if (result.code === 0) {
                    ElMessage.success(this.parkDialogMode === 'add' ? '新增成功' : '编辑成功');
                    this.parkDialogVisible = false;
                    this.loadParks();
                } else {
                    ElMessage.error(result.message || '保存失败');
                }
            } catch (error) {
                console.error('Save park failed:', error);
            }
        },
        
        // 删除车场
        deletePark(row) {
            ElMessageBox.confirm(`确定要删除车场"${row.name}"吗？此操作不可恢复。`, '警告', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                try {
                    const result = await request(`/parks/${row.id}`, {
                        method: 'DELETE'
                    });
                    
                    if (result.code === 0) {
                        ElMessage.success('删除成功');
                        this.loadParks();
                    } else {
                        ElMessage.error(result.message || '删除失败');
                    }
                } catch (error) {
                    console.error('Delete park failed:', error);
                }
            }).catch(() => {});
        },
        
        // 重置车场表单
        resetParkForm() {
            this.parkForm = {
                id: null,
                name: '',
                code: '',
                province: '',
                city: '',
                district: '',
                industry: '',
                contact: '',
                contactPhone: '',
                startTime: '',
                endTime: '',
                remark: ''
            };
            this.$refs.parkFormRef?.resetFields();
        },
        
        // 显示续费对话框
        showRenewDialog(row) {
            this.renewForm = {
                parkId: row.id,
                parkName: row.name,
                oldEndTime: row.endTime,
                duration: 12
            };
            this.renewDialogVisible = true;
        },
        
        // 保存续费
        async saveRenew() {
            try {
                const result = await request(`/parks/${this.renewForm.parkId}/renew`, {
                    method: 'POST',
                    body: JSON.stringify({
                        duration: this.renewForm.duration
                    })
                });
                
                if (result.code === 0) {
                    ElMessage.success('续费成功');
                    this.renewDialogVisible = false;
                    this.loadParks();
                } else {
                    ElMessage.error(result.message || '续费失败');
                }
            } catch (error) {
                console.error('Renew park failed:', error);
            }
        },
        
        // 重置续费表单
        resetRenewForm() {
            this.renewForm = {
                parkId: null,
                parkName: '',
                oldEndTime: '',
                duration: 12
            };
        },
        
        // 下载车场信息
        downloadParkInfo(row) {
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
        },
        
        // ==================== 续费记录 ====================
        
        // 加载续费记录
        async loadRenewals() {
            try {
                const params = new URLSearchParams({
                    page: this.renewalPagination.page,
                    pageSize: this.renewalPagination.pageSize,
                    ...this.renewalSearchForm
                });
                
                const data = await request(`/renewals?${params}`);
                
                if (data.code === 0) {
                    this.renewalList = (data.data?.list || []).map(item => ({
                        ...item,
                        oldEndTime: formatDate(item.oldEndTime),
                        newEndTime: formatDate(item.newEndTime),
                        renewalTime: formatDate(item.renewalTime)
                    }));
                    this.renewalPagination.total = data.data?.total || 0;
                } else {
                    ElMessage.error(data.message || '加载失败');
                }
            } catch (error) {
                console.error('Load renewals failed:', error);
            }
        },
        
        // 搜索续费记录
        searchRenewals() {
            this.renewalPagination.page = 1;
            this.loadRenewals();
        },
        
        // 重置续费记录搜索
        resetRenewalSearch() {
            this.renewalSearchForm = {
                parkName: '',
                parkCode: ''
            };
            this.searchRenewals();
        }
    },
    
    // 注册组件
    components: {
        'company-management': CompanyManagement,
        'external-vehicle-management': ExternalVehicleManagement
    }
}).use(ElementPlus);

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}

app.mount('#app');
