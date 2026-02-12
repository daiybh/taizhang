// 车场信息组件
const ParkInfo = {
    template: `
        <div>
            <div class="page-header">
                <h2>车场信息</h2>
                <p>查看和编辑当前车场的基本信息</p>
            </div>
            <div class="page-content">
                <el-form :model="form" :rules="rules" ref="formRef" label-width="140px" style="max-width: 800px;">
                    <el-form-item label="车场名称" prop="name">
                        <el-input v-model="form.name" :disabled="!isEditing" />
                    </el-form-item>
                    
                    <el-form-item label="车场编号">
                        <el-input v-model="form.code" disabled />
                    </el-form-item>
                    
                    <el-form-item label="密钥">
                        <el-input v-model="form.secretKey" disabled type="textarea" :rows="2" />
                    </el-form-item>
                    
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="创建时间">
                                <el-input v-model="form.createdAt" disabled />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="开始时间">
                                <el-input v-model="form.startTime" disabled />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    
                    <el-form-item label="结束时间">
                        <el-input v-model="form.endTime" disabled />
                    </el-form-item>
                    
                    <el-row :gutter="20">
                        <el-col :span="8">
                            <el-form-item label="省" prop="province">
                                <el-input v-model="form.province" :disabled="!isEditing" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="8">
                            <el-form-item label="市" prop="city">
                                <el-input v-model="form.city" :disabled="!isEditing" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="8">
                            <el-form-item label="区" prop="district">
                                <el-input v-model="form.district" :disabled="!isEditing" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    
                    <el-form-item label="行业" prop="industry">
                        <el-input v-model="form.industry" :disabled="!isEditing" />
                    </el-form-item>
                    
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="联系人" prop="contact">
                                <el-input v-model="form.contact" :disabled="!isEditing" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="联系电话" prop="contactPhone">
                                <el-input v-model="form.contactPhone" :disabled="!isEditing" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    
                    <el-form-item label="备注" prop="remark">
                        <el-input v-model="form.remark" type="textarea" :rows="3" :disabled="!isEditing" />
                    </el-form-item>
                    
                    <el-form-item>
                        <el-button v-if="!isEditing" type="primary" @click="startEdit">编辑信息</el-button>
                        <template v-else>
                            <el-button type="primary" @click="save">保存</el-button>
                            <el-button @click="cancelEdit">取消</el-button>
                        </template>
                    </el-form-item>
                </el-form>
            </div>
        </div>
    `,
    
    data() {
        return {
            isEditing: false,
            form: {
                id: null,
                name: '',
                code: '',
                secretKey: '',
                createdAt: '',
                startTime: '',
                endTime: '',
                province: '',
                city: '',
                district: '',
                industry: '',
                contact: '',
                contactPhone: '',
                remark: ''
            },
            originalForm: null,
            rules: {
                name: [{ required: true, message: '请输入车场名称', trigger: 'blur' }],
                contact: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
                contactPhone: [
                    { required: true, message: '请输入联系电话', trigger: 'blur' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
                ]
            }
        };
    },
    
    mounted() {
        this.loadData();
    },
    
    methods: {
        async loadData() {
            try {
                // 这里假设从第一个车场获取信息
                // 实际应该根据登录用户的车场 ID 获取
                const params = new URLSearchParams({
                    page: 1,
                    pageSize: 1
                });
                
                const data = await request(`/parks?${params}`);
                
                if (data.code === 0 && data.data?.list?.length > 0) {
                    const park = data.data.list[0];
                    this.form = {
                        id: park.id,
                        name: park.name,
                        code: park.code,
                        secretKey: park.secretKey,
                        createdAt: formatDate(park.createdAt),
                        startTime: formatDate(park.startTime),
                        endTime: formatDate(park.endTime),
                        province: park.province,
                        city: park.city,
                        district: park.district,
                        industry: park.industry,
                        contact: park.contact,
                        contactPhone: park.contactPhone,
                        remark: park.remark
                    };
                } else {
                    ElMessage.warning('未找到车场信息');
                }
            } catch (error) {
                console.error('Load park info failed:', error);
            }
        },
        
        startEdit() {
            this.isEditing = true;
            // 保存原始数据，用于取消时恢复
            this.originalForm = { ...this.form };
        },
        
        cancelEdit() {
            this.isEditing = false;
            // 恢复原始数据
            if (this.originalForm) {
                this.form = { ...this.originalForm };
                this.originalForm = null;
            }
            this.$refs.formRef?.clearValidate();
        },
        
        async save() {
            try {
                await this.$refs.formRef.validate();
                
                // 只提交可编辑的字段
                const updateData = {
                    name: this.form.name,
                    province: this.form.province,
                    city: this.form.city,
                    district: this.form.district,
                    industry: this.form.industry,
                    contact: this.form.contact,
                    contactPhone: this.form.contactPhone,
                    remark: this.form.remark
                };
                
                const result = await request(`/parks/${this.form.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(updateData)
                });
                
                if (result.code === 0) {
                    ElMessage.success('保存成功');
                    this.isEditing = false;
                    this.originalForm = null;
                    // 重新加载数据
                    this.loadData();
                } else {
                    ElMessage.error(result.message || '保存失败');
                }
            } catch (error) {
                console.error('Save park info failed:', error);
            }
        }
    }
};
