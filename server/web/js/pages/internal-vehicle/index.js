// 厂内运输车辆管理组件
const InternalVehicleManagement = {
    template: `
        <div>
            <div class="page-header">
                <h2>厂内运输车辆基本信息</h2>
                <p>管理厂内运输车辆，支持查询、增删改查与下发</p>
            </div>
            <div class="page-content">
                <div class="search-bar">
                    <el-form :inline="true" :model="searchForm">
                        <el-form-item label="车牌号">
                            <el-input v-model="searchForm.license_plate" placeholder="请输入车牌号" clearable />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="search">查询</el-button>
                            <el-button @click="resetSearch">重置</el-button>
                        </el-form-item>
                    </el-form>
                </div>

                <div class="toolbar">
                    <el-button type="success" @click="openCreateDialog">新建</el-button>
                    <el-button @click="exportCSV" style="margin-left:8px;">导出 CSV</el-button>
                    <el-button @click="triggerImport" style="margin-left:8px;">导入 CSV</el-button>
                </div>

                <el-table :data="list" border stripe style="width: 100%">
                    <el-table-column type="index" label="序号" width="60" align="center" />
                    <el-table-column prop="license_plate" label="车牌号码" width="140" />
                    <el-table-column prop="vehicle_type" label="车辆类型" width="120" />
                    <el-table-column prop="vin" label="车辆识别代码" min-width="180" show-overflow-tooltip />
                    <el-table-column prop="owner" label="所有者" width="140" />
                    <el-table-column label="操作" width="220" fixed="right" align="center">
                        <template #default="scope">
                            <el-button type="primary" size="small" @click="edit(scope.row)">编辑</el-button>
                            <el-button type="danger" size="small" @click="remove(scope.row)">删除</el-button>
                            <el-button type="success" size="small" @click="dispatch(scope.row)">下发</el-button>
                            <el-button type="info" size="small" @click="viewDispatchRecords(scope.row)" style="margin-left:6px;">下发记录</el-button>
                        </template>
                    </el-table-column>
                </el-table>

                <el-pagination
                    v-model:current-page="pagination.page"
                    v-model:page-size="pagination.pageSize"
                    :total="pagination.total"
                    :page-sizes="[10,20,50]"
                    layout="total, sizes, prev, pager, next, jumper"
                    @size-change="loadList"
                    @current-change="loadList"
                    style="margin-top: 20px; justify-content: flex-end;"
                />

                <el-dialog title="车辆" :visible.sync="dialogVisible" width="720px">
                    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
                        <el-form-item label="车牌号" prop="license_plate">
                            <el-input v-model="form.license_plate" maxlength="20" />
                        </el-form-item>
                        <el-form-item label="VIN" prop="vin">
                            <el-input v-model="form.vin" maxlength="17" />
                        </el-form-item>
                        <el-form-item label="环保编号" prop="environmental_code">
                            <el-input v-model="form.environmental_code" />
                        </el-form-item>
                        <el-form-item label="车辆类型" prop="vehicle_type">
                            <el-input v-model="form.vehicle_type" />
                        </el-form-item>
                        <el-form-item label="车辆品牌/型号" prop="brand_model">
                            <el-input v-model="form.brand_model" />
                        </el-form-item>
                        <el-form-item label="排放标准" prop="emission_standard">
                            <el-input v-model="form.emission_standard" />
                        </el-form-item>
                        <el-form-item label="燃料类型" prop="fuel_type">
                            <el-input v-model="form.fuel_type" />
                        </el-form-item>
                        <el-form-item label="所有者" prop="owner">
                            <el-input v-model="form.owner" />
                        </el-form-item>
                        <el-form-item label="批准载质量" prop="approved_load_mass">
                            <el-input-number v-model="form.approved_load_mass" :min="0" />
                        </el-form-item>
                        <el-form-item label="最大牵引质量" prop="max_towing_mass">
                            <el-input-number v-model="form.max_towing_mass" :min="0" />
                        </el-form-item>
                        <el-form-item label="联系人地址" prop="address">
                            <el-input v-model="form.address" />
                        </el-form-item>
                    </el-form>
                    <template #footer>
                        <el-button @click="dialogVisible = false">取消</el-button>
                        <el-button type="primary" @click="onSave">保存</el-button>
                    </template>
                </el-dialog>

                <!-- 隐藏的文件输入用于导入 CSV -->
                <input type="file" ref="csvInput" accept="text/csv" style="display:none" @change="handleFileChange" />

                <!-- 下发记录对话框 -->
                <el-dialog title="下发记录" :visible.sync="dispatchRecordsVisible" width="600px">
                    <el-table :data="dispatchRecords" style="width:100%">
                        <el-table-column prop="id" label="ID" width="80" />
                        <el-table-column prop="operator" label="操作人" />
                        <el-table-column prop="time" label="时间" />
                        <el-table-column prop="remark" label="备注" />
                    </el-table>
                    <template #footer>
                        <el-button @click="dispatchRecordsVisible = false">关闭</el-button>
                    </template>
                </el-dialog>
            </div>
        </div>
    `,

    data() { return {
        searchForm: { license_plate: '' },
        list: [],
        pagination: { page: 1, pageSize: 10, total: 0 },
        dialogVisible: false,
        form: {
            id: null,
            license_plate: '',
            vin: '',
            environmental_code: '',
            production_date: '',
            register_date: '',
            brand_model: '',
            fuel_type: '',
            emission_standard: '',
            usage_nature: '',
            owner: '',
            vehicle_type: '',
            plate_color: '',
            engine_number: '',
            local_environmental_code: '',
            approved_load_mass: null,
            max_towing_mass: null,
            address: '',
            issue_date: '',
            vehicle_list_photo: '',
            driving_license_photo: '',
            vehicle_photo: ''
        },
        rules: {
            license_plate: [
                { required: true, message: '请输入车牌号', trigger: 'blur' },
                { pattern: /^[\u4e00-\u9fa5A-Z0-9-]{2,20}$/, message: '车牌格式不正确', trigger: 'blur' }
            ],
            vin: [
                { required: true, message: '请输入VIN', trigger: 'blur' },
                { min: 17, max: 17, message: 'VIN 必须为17位', trigger: 'blur' }
            ]
        },
        // 导入/导出与下发记录
        dispatchRecordsVisible: false,
        dispatchRecords: []
    }; },

    mounted() { this.loadList(); },

    methods: {
        async loadList() {
            try {
                const params = new URLSearchParams({ page: this.pagination.page, pageSize: this.pagination.pageSize, license_plate: this.searchForm.license_plate });
                const data = await request(`/internal-vehicles?${params}`);
                if (data.code === 0) { this.list = data.data?.list || []; this.pagination.total = data.data?.total || 0; }
            } catch (e) { console.error('Load internal vehicles failed', e); }
        },
        search() { this.pagination.page = 1; this.loadList(); },
        resetSearch() { this.searchForm = { license_plate: '' }; this.search(); },
        openCreateDialog() { this.form = Object.assign({}, this.form, { id: null, license_plate: '', vin: '', environmental_code: '', production_date: '', register_date: '', brand_model: '', fuel_type: '', emission_standard: '', usage_nature: '', owner: '', vehicle_type: '', plate_color: '', engine_number: '', local_environmental_code: '', approved_load_mass: null, max_towing_mass: null, address: '', issue_date: '', vehicle_list_photo: '', driving_license_photo: '', vehicle_photo: '' }); this.dialogVisible = true; },
        edit(row) { this.form = { ...row }; this.dialogVisible = true; },
        async onSave() {
            try {
                this.$refs.formRef.validate(async valid => {
                    if (!valid) return;
                    if (this.form.id) {
                        const res = await request(`/internal-vehicles/${this.form.id}`, { method: 'PUT', body: JSON.stringify(this.form) });
                        if (res.code === 0) { ElMessage.success('保存成功'); this.dialogVisible = false; this.loadList(); }
                    } else {
                        const res = await request('/internal-vehicles', { method: 'POST', body: JSON.stringify(this.form) });
                        if (res.code === 0) { ElMessage.success('创建成功'); this.dialogVisible = false; this.loadList(); }
                    }
                });
            } catch (e) { console.error('Save failed', e); }
        },
        async remove(row) {
            try {
                const res = await request(`/internal-vehicles/${row.id}`, { method: 'DELETE' });
                if (res.code === 0) { ElMessage.success('删除成功'); this.loadList(); }
            } catch (e) { console.error('Delete failed', e); }
        },
        async dispatch(row) {
            try {
                const res = await request('/internal-vehicles/dispatch', { method: 'POST', body: JSON.stringify({ ids: [row.id] }) });
                if (res.code === 0) { ElMessage.success('下发成功'); this.loadList(); }
            } catch (e) { console.error('Dispatch failed', e); }
        },
        // 导出 CSV
        exportCSV() {
            try {
                const headers = ['id','license_plate','vin','owner','vehicle_type','brand_model','approved_load_mass','max_towing_mass'];
                const rows = this.list.map(r => headers.map(h => (r[h] === null || r[h] === undefined) ? '' : String(r[h]).replace(/"/g, '""')));
                const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `internal_vehicles_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
            } catch (e) { console.error('Export failed', e); }
        },
        triggerImport() { this.$refs.csvInput.click(); },
        async handleFileChange(e) {
            const file = e.target.files[0];
            if (!file) return;
            const text = await file.text();
            const lines = text.split(/\r?\n/).filter(Boolean);
            if (lines.length < 2) { ElMessage.error('CSV 内容为空'); return; }
            const headers = lines[0].split(/,\s*/).map(h => h.replace(/^"|"$/g, ''));
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(/,\s*/).map(c => c.replace(/^"|"$/g, ''));
                const obj = {};
                headers.forEach((h, idx) => { obj[h] = cols[idx] || ''; });
                try {
                    await request('/internal-vehicles', { method: 'POST', body: JSON.stringify(obj) });
                } catch (err) { console.error('Import row failed', err); }
            }
            ElMessage.success('导入完成（逐行提交）');
            this.$refs.csvInput.value = '';
            this.loadList();
        },
        // 查看下发记录
        async viewDispatchRecords(row) {
            try {
                const res = await request(`/internal-vehicles/${row.id}/dispatch-records`);
                if (res.code === 0) { this.dispatchRecords = res.data || []; } else { this.dispatchRecords = []; }
            } catch (e) { console.warn('无法获取下发记录，接口可能不存在', e); this.dispatchRecords = []; }
            this.dispatchRecordsVisible = true;
        }
    }
};
