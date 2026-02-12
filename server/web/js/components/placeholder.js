// 通用占位组件，用于尚未实现的菜单项，支持快速编辑菜单项标签/组件映射
const Placeholder = {
    props: ['title', 'itemIndex'],
    template: `
        <div class="placeholder-page">
            <h2>{{ title }}</h2>
            <p>功能开发中...</p>
            <el-button type="primary" size="small" @click="editItem" style="margin-top:12px;">编辑菜单</el-button>
        </div>
    `,
    methods: {
        editItem() {
            const newLabel = prompt('请输入新的菜单标签', this.title || '占位');
            if (newLabel === null) return; // 取消
            const newComponent = prompt('请输入组件名（留空表示占位）', '');
            if (typeof window.updateMenuItem === 'function') {
                window.updateMenuItem(this.itemIndex, { label: newLabel, component: newComponent || 'placeholder' });
                ElMessage.success('已更新菜单（仅保存在本地）');
            } else {
                ElMessage.error('无法更新：未初始化编辑功能');
            }
        }
    }
};
