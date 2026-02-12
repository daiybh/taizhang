// 续费记录组件
const RenewalRecords = {
    template: `
        <div>
            <div class="page-header">
                <h2>续费记录</h2>
                <p>查看所有车场的续费记录</p>
            </div>
            <div class="page-content">
                <div class="search-bar">
                    <el-form :inline="true" :model="searchForm">
                        <el-form-item label="车场名称">
                            <el-input v-model="searchForm.parkName" placeholder="请输入车场名称" clearable />
                        </el-form-item>
                        <el-form-item label="车场编号">
                            <el-input v-model="searchForm.parkCode" placeholder="请输入车场编号" clearable />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="search">查询</el-button>
                            <el-button @click="resetSearch">重置</el-button>
                        </el-form-item>
                    </el-form>
                </div>
                
                <el-table :data="list" border stripe style="width: 100%">
                    <el-table-column type="index" label="序号" width="60" align="center" />
                    <el-table-column prop="parkName" label="车场名称" min-width="120" />
                    <el-table-column prop="parkCode" label="车场编号" min-width="120" />
                    <el-table-column prop="oldEndTime" label="续费前结束时间" min-width="150" />
                    <el-table-column prop="newEndTime" label="续费后结束时间" min-width="150" />
                    <el-table-column prop="province" label="省" width="80" />
                    <el-table-column prop="duration" label="续费时长(月)" width="120" align="center" />
                    <el-table-column prop="renewalTime" label="续费时间" min-width="150" />
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
        </div>
    `,
    
    data() {
        return {
            searchForm: {
                parkName: '',
                parkCode: ''
            },
            list: [],
            pagination: {
                page: 1,
                pageSize: 10,
                total: 0
            }
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
                
                const data = await request(`/renewals?${params}`);
                
                if (data.code === 0) {
                    this.list = (data.data?.list || []).map(item => ({
                        ...item,
                        oldEndTime: formatDate(item.oldEndTime),
                        newEndTime: formatDate(item.newEndTime),
                        renewalTime: formatDate(item.renewalTime)
                    }));
                    this.pagination.total = data.data?.total || 0;
                } else {
                    ElMessage.error(data.message || '加载失败');
                }
            } catch (error) {
                console.error('Load renewals failed:', error);
            }
        },
        
        search() {
            this.pagination.page = 1;
            this.loadData();
        },
        
        resetSearch() {
            this.searchForm = {
                parkName: '',
                parkCode: ''
            };
            this.search();
        }
    }
};
