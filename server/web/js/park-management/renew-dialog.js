// 车场续费对话框组件
const ParkRenewDialog = {
    template: `
        <el-dialog
            :model-value="visible"
            title="车场续费"
            width="500px"
            @close="handleClose"
        >
            <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
                <el-form-item label="车场名称">
                    <el-input v-model="parkName" disabled />
                </el-form-item>
                <el-form-item label="当前结束时间">
                    <el-input :value="currentEndTime" disabled />
                </el-form-item>
                <el-form-item label="续费时长" prop="duration">
                    <el-select v-model="form.duration" placeholder="请选择续费时长" style="width: 100%;">
                        <el-option label="1个月" :value="1" />
                        <el-option label="3个月" :value="3" />
                        <el-option label="6个月" :value="6" />
                        <el-option label="1年" :value="12" />
                        <el-option label="2年" :value="24" />
                        <el-option label="3年" :value="36" />
                    </el-select>
                </el-form-item>
                <el-form-item label="续费后结束时间">
                    <el-input :value="newEndTime" disabled />
                </el-form-item>
                <el-form-item label="备注" prop="remark">
                    <el-input 
                        v-model="form.remark" 
                        type="textarea" 
                        :rows="3" 
                        placeholder="请输入续费备注（选填）" 
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="handleClose">取消</el-button>
                <el-button type="primary" @click="handleSubmit" :loading="loading">确定续费</el-button>
            </template>
        </el-dialog>
    `,
    
    props: {
        visible: {
            type: Boolean,
            default: false
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
                duration: 12, // 默认续费1年
                remark: ''
            },
            rules: {
                duration: [{ required: true, message: '请选择续费时长', trigger: 'change' }]
            }
        };
    },
    
    computed: {
        parkName() {
            return this.data?.name || '';
        },
        
        currentEndTime() {
            if (!this.data?.endTime) return '';
            return formatDate(this.data.endTime);
        },
        
        newEndTime() {
            if (!this.data?.endTime || !this.form.duration) return '';
            
            const endDate = new Date(this.data.endTime);
            endDate.setMonth(endDate.getMonth() + this.form.duration);
            return formatDate(endDate);
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
            this.form.duration = 12; // 重置为默认值
            this.form.remark = '';
            // 清除验证
            this.$nextTick(() => {
                this.$refs.formRef?.clearValidate();
            });
        },
        
        resetForm() {
            this.form = {
                duration: 12,
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
                
                const result = await request(`/parks/${this.data.id}/renew`, {
                    method: 'POST',
                    body: JSON.stringify({
                        duration: this.form.duration,
                        remark: this.form.remark
                    })
                });
                
                if (result.code === 0) {
                    ElMessage.success('续费成功');
                    this.$emit('success');
                    this.handleClose();
                } else {
                    ElMessage.error(result.message || '续费失败');
                }
            } catch (error) {
                if (error.message) {
                    console.error('Renew park failed:', error);
                }
            } finally {
                this.loading = false;
            }
        }
    }
};
