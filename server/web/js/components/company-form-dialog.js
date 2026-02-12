// 公司表单对话框组件（已移动到 js/components）
const CompanyFormDialog = {
    template: `
        <el-dialog
            :model-value="visible"
            :title="title"
            width="600px"
            @close="handleClose"
        >
            <el-form :model="form" :rules="rules" ref="formRef" label-width="140px">
                <el-form-item label="公司名称" prop="name">
                    <el-input v-model="form.name" placeholder="请输入公司名称" />
                </el-form-item>
                <el-form-item label="联系人" prop="contact_name">
                    <el-input v-model="form.contact_name" placeholder="请输入联系人" />
                </el-form-item>
                <el-form-item label="联系电话" prop="contact_phone">
                    <el-input v-model="form.contact_phone" placeholder="请输入联系电话" />
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
        visible: { type: Boolean, default: false },
        mode: { type: String, default: 'add' },
        data: { type: Object, default: () => ({}) }
    },

    data() {
        return {
            loading: false,
            form: { id: null, name: '', contact_name: '', contact_phone: '', remark: '' },
            rules: {
                name: [{ required: true, message: '请输入公司名称', trigger: 'blur' }],
                contact_name: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
                contact_phone: [
                    { required: true, message: '请输入联系电话', trigger: 'blur' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
                ]
            }
        };
    },

    computed: { title() { return this.mode === 'add' ? '新增公司' : '编辑公司'; } },

    watch: { visible(val) { if (val) this.initForm(); else this.resetForm(); } },

    methods: {
        initForm() {
            if (this.mode === 'edit' && this.data) this.form = { ...this.data };
            else this.resetForm();
            this.$nextTick(() => this.$refs.formRef?.clearValidate());
        },

        resetForm() { this.form = { id: null, name: '', contact_name: '', contact_phone: '', remark: '' }; this.$refs.formRef?.resetFields(); },

        handleClose() { this.$emit('update:visible', false); this.$emit('close'); },

        async handleSubmit() {
            try {
                await this.$refs.formRef.validate();
                this.loading = true;
                const data = { ...this.form };
                let result;
                if (this.mode === 'add') result = await request('/companies', { method: 'POST', body: JSON.stringify(data) });
                else result = await request(`/companies/${this.form.id}`, { method: 'PUT', body: JSON.stringify(data) });

                if (result.code === 0) {
                    ElMessage.success(this.mode === 'add' ? '新增成功' : '编辑成功');
                    this.$emit('success');
                    this.handleClose();
                } else {
                    ElMessage.error(result.message || '保存失败');
                }
            } catch (error) {
                console.error('Save company failed:', error);
            } finally { this.loading = false; }
        }
    }
};
