const { createApp } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;

// 如果没有登录信息则重定向到登录页（明确使用 /web/login.html）
if (!sessionStorage.getItem('username') && location.pathname !== '/web/login.html') {
    window.location.href = '/web/login.html';
}

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
            // 用户信息从 sessionStorage 读取（由登录页写入）
            currentUser: sessionStorage.getItem('username') || 'admin',
            userRole: sessionStorage.getItem('userRole') || 'admin', // admin: 管理层, park: 车场层

            // 当前激活的菜单
            activeMenu: 'welcome'
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
        }
    },
    
    methods: {
        // 菜单选择
        handleMenuSelect(index) {
            this.activeMenu = index;
        },
        
        // 退出登录
        handleLogout() {
            ElMessageBox.confirm('确定要退出登录吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                // 清除登录信息并跳转到登录页
                try { sessionStorage.removeItem('username'); sessionStorage.removeItem('userRole'); sessionStorage.removeItem('parkCode'); sessionStorage.removeItem('authenticated'); } catch (e) {}
                ElMessage.success('退出成功');
                window.location.href = '/web/login.html';
            }).catch(() => {});
        }
    },
    
    // 注册组件
    components: {
        'park-management': ParkManagement,
        'renewal-records': RenewalRecords,
        'park-info': ParkInfo,
        'company-management': CompanyManagement,
        'external-vehicle-management': ExternalVehicleManagement
    }
}).use(ElementPlus);

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}

app.mount('#app');
