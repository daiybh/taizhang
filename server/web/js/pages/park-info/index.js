// 车场信息组件（移动到 js/pages/park-info）
const ParkInfo = {
    template: `
        <div>
            <div class="page-header">
                <h2>车场信息</h2>
                <p>查看并编辑当前车场信息</p>
            </div>
            <div class="page-content">
                <el-form :model="park" label-width="120px">
                    <el-form-item label="车场名称">
                        <el-input v-model="park.name" :disabled="!isEditing" />
                    </el-form-item>
                    <el-form-item label="车场编号">
                        <el-input v-model="park.code" :disabled="true" />
                    </el-form-item>
                    <el-form-item label="联系人">
                        <el-input v-model="park.contact_name" :disabled="!isEditing" />
                    </el-form-item>
                    <el-form-item label="联系电话">
                        <el-input v-model="park.contact_phone" :disabled="!isEditing" />
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="toggleEdit">{{ isEditing ? '保存' : '编辑' }}</el-button>
                    </el-form-item>
                </el-form>
            </div>
        </div>
    `,

    data() { return { park: {}, isEditing: false }; },

    mounted() { this.loadPark(); },

    methods: {
        async loadPark() { try { const data = await request('/parks/me'); if (data.code === 0) this.park = data.data || {}; } catch (error) { console.error('Load park info failed:', error); } },
        async toggleEdit() { if (this.isEditing) { try { const payload = { name: this.park.name, contact_name: this.park.contact_name, contact_phone: this.park.contact_phone }; const result = await request(`/parks/${this.park.id}`, { method: 'PUT', body: JSON.stringify(payload) }); if (result.code === 0) { ElMessage.success('保存成功'); this.isEditing = false; } } catch (error) { console.error('Save park failed:', error); } } else { this.isEditing = true; } }
    }
};
