// 车场表单对话框组件（新增/编辑）
const ParkFormDialog = {
    template: `
        <el-dialog
            :model-value="visible"
            :title="title"
            width="700px"
            @close="handleClose"
        >
            <el-form :model="form" :rules="rules" ref="formRef" label-width="140px">
                <el-form-item label="车场名称" prop="name">
                    <el-input v-model="form.name" placeholder="请输入车场名称" />
                </el-form-item>
                <el-form-item label="车场编号" prop="code">
                    <el-input v-model="form.code" placeholder="请输入车场编号" :disabled="mode === 'edit'" />
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
                <el-form-item label="联系人" prop="contact_name">
                    <el-input v-model="form.contact_name" placeholder="请输入联系人" />
                </el-form-item>
                <el-form-item label="联系电话" prop="contact_phone">
                    <el-input v-model="form.contact_phone" placeholder="请输入联系电话" />
                </el-form-item>
                <el-form-item label="开始时间" prop="start_time" v-if="mode === 'add'">
                    <el-date-picker v-model="form.start_time" type="date" placeholder="选择开始时间" style="width: 100%;" />
                </el-form-item>
                <el-form-item label="结束时间" prop="end_time" v-if="mode === 'add'">
                    <el-date-picker v-model="form.end_time" type="date" placeholder="选择结束时间" style="width: 100%;" />
                </el-form-item>
                <el-form-item label="备注" prop="remark">
                    <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="handleClose">取消</el-button>
                <el-button type="primary" @click="handleSubmit" :loading="loading">确定</el-button>
            </template>
        </el-dialog>
    `,
    
    props: {
        visible: {
            type: Boolean,
            default: false
        },
        mode: {
            type: String,
            default: 'add', // 'add' 或 'edit'
            validator: (value) => ['add', 'edit'].includes(value)
        },
        data: {
            type: Object,
            default: () => ({})
        }
    },
    
    data() {
        return {
            loading: false,
            form: {
                id: null,
                name: '',
                code: '',
                province: '',
                city: '',
                district: '',
                industry: '',
                contact_name: '',
                contact_phone: '',
                start_time: '',
                end_time: '',
                remark: ''
            },
            rules: {
                name: [{ required: true, message: '请输入车场名称', trigger: 'blur' }],
                code: [{ required: true, message: '请输入车场编号', trigger: 'blur' }],
                contact_name: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
                contact_phone: [
                    { required: true, message: '请输入联系电话', trigger: 'blur' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
                ]
            }
        };
    },
    
    computed: {
        title() {
            return this.mode === 'add' ? '新增车场' : '编辑车场';
        }
    },
    
    watch: {
        visible(val) {
            if (val) {
                this.initForm();
            } else {
                this.resetForm();
            }
        }
    },
    
    methods: {
        initForm() {
            if (this.mode === 'edit' && this.data) {
                // 编辑模式，填充数据
                this.form = { ...this.data };
            } else {
                // 新增模式，设置默认时间
                this.resetForm();
                const now = new Date();
                const oneYearLater = new Date();
                oneYearLater.setFullYear(now.getFullYear() + 1);
                this.form.start_time = now;
                this.form.end_time = oneYearLater;
            }
            // 清除验证
            this.$nextTick(() => {
                this.$refs.formRef?.clearValidate();
            });
        },
        
        resetForm() {
            this.form = {
                id: null,
                name: '',
                code: '',
                province: '',
                city: '',
                district: '',
                industry: '',
                contact_name: '',
                contact_phone: '',
                start_time: '',
                end_time: '',
                remark: ''
            };
            this.$refs.formRef?.resetFields();
        },
        
        handleClose() {
            this.$emit('update:visible', false);
            this.$emit('close');
        },
        
        async handleSubmit() {
            try {
                await this.$refs.formRef.validate();
                
                this.loading = true;
                
                const data = {
                    ...this.form,
                    start_time: formatDate(this.form.start_time),
                    end_time: formatDate(this.form.end_time)
                };
                
                let result;
                if (this.mode === 'add') {
                    result = await request('/parks', {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });
                } else {
                    result = await request(`/parks/${this.form.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(data)
                    });
                }
                
                if (result.code === 0) {
                    ElMessage.success(this.mode === 'add' ? '新增成功' : '编辑成功');
                    this.$emit('success');
                    this.handleClose();
                } else {
                    ElMessage.error(result.message || '保存失败');
                }
            } catch (error) {
                if (error.message) {
                    console.error('Save park failed:', error);
                }
            } finally {
                this.loading = false;
            }
        }
    }
};
