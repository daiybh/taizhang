const { createApp } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;

// 重定向检查由页面头部的早期脚本负责（index.html 中使用 replace）

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

// 异步初始化：先尝试从 JSON 加载菜单定义，再创建并挂载应用
async function initApp() {
    let fetchedMenu = null;
    try {
        const resp = await fetch('/web/js/menu-items.json', { cache: 'no-cache' });
        if (resp.ok) fetchedMenu = await resp.json();
    } catch (e) {
        console.warn('无法加载 menu-items.json，使用回退菜单定义', e);
    }

    // 本地覆盖支持（便于快速迭代，保存在 localStorage）
    let override = null;
   // try { override = JSON.parse(localStorage.getItem('menuItemsOverride') || 'null'); } catch (e) { override = null; }

    const defaultMenu = {
        admin: [
            { index: '1-1', label: '车场管理', component: 'park-management' },
            { index: '1-2', label: '续费记录', component: 'renewal-records' }
        ],
        park: [
            { index: '2-1', label: '车场信息', component: 'park-info' },
            { index: '2-2', label: '公司管理', component: 'company-management' },
            { index: '2-3', label: '厂外运输车辆', component: 'external-vehicle-management' },
            { index: '2-4', label: '厂内运输车辆', component: 'internal-vehicle-management' },
            { index: '2-5', label: '非道路移动机械', component: 'nonroad-management' },
            { index: '2-6', label: '二维码管理', component: 'placeholder' },
            { index: '2-7', label: '用户权限', component: 'placeholder' },
            { index: '2-8', label: '部门管理', component: 'placeholder' }
        ]
    };

    const menuItemsInitial = override || fetchedMenu || defaultMenu;

    // 根据菜单项动态收集需要注册的组件（从静态对象映射到实际组件对象）
     const componentRegistry = {};

    // 优先使用页面脚本通过 window.__component_registry__ 注册的组件（解决脚本加载顺序问题）
    try {
        console.log('Attempting to register components from window.__component_registry__');
        if (window && window.__component_registry__) {
            // 遍历 window.__component_registry__ 中的组件，注册到 componentRegistry 中
            console.log('Found window.__component_registry__:', Object.keys(window.__component_registry__));
            for (const name of Object.keys(window.__component_registry__)) {
                console.log(`Registering component from window.__component_registry__: ${name}`);
                componentRegistry[name] = window.__component_registry__[name];
            }
        }
    } catch (e) {
        console.warn('使用 window.__component_registry__ 优先注册组件失败，使用静态映射', e);
    }
    
    const componentsToRegister = {};
    try {
        const allItems = [...(menuItemsInitial.admin || []), ...(menuItemsInitial.park || [])];
        for (const it of allItems) {
                console.log(`Registering component for menu item ${it.label}: ${it.component}`);
            if (it && it.component && window.__component_registry__[it.component]) {
                console.log(`aaaa Registering component for menu item ${it.label}: ${it.component}`);
                componentsToRegister[it.component] = window.__component_registry__[it.component];
            }
        }
    } catch (e) {
        console.warn('构建组件注册表时出错，回退为默认组件集', e);
    }

    // 确保占位组件始终注册
    componentsToRegister['placeholder'] = Placeholder;

    app = createApp({
        data() {
            return {
                currentUser: sessionStorage.getItem('username') || 'admin',
                userRole: sessionStorage.getItem('userRole') || 'admin',
                activeMenu: 'welcome',
                menuItems: menuItemsInitial
            };
        },

        computed: {
            currentPageTitle() {
                const all = [...this.menuItems.admin, ...this.menuItems.park];
                const found = all.find(i => i.index === this.activeMenu);
                return found ? found.label : '';
            }
        },

        methods: {
            handleMenuSelect(index) { this.activeMenu = index; },
            handleLogout() {
                ElMessageBox.confirm('确定要退出登录吗？', '提示', {
                    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
                }).then(() => {
                    try { sessionStorage.removeItem('username'); sessionStorage.removeItem('userRole'); sessionStorage.removeItem('parkCode'); sessionStorage.removeItem('authenticated'); sessionStorage.removeItem('parkId'); sessionStorage.removeItem('parkName'); } catch (e) {}
                    ElMessage.success('退出成功');
                    window.location.replace('/web/login.html');
                }).catch(() => {});
            }
        },

        components: componentsToRegister
    }).use(ElementPlus);

    // 注册所有 Element Plus 图标
    for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
        app.component(key, component);
    }

    // 挂载并获取根组件实例，用于后续在页面中更新 menuItems
    const vm = app.mount('#app');

    // 暴露更新函数，允许占位组件或其他调试工具修改菜单（并保存到 localStorage）
    window.updateMenuItem = function(itemIndex, updates) {
        try {
            const lists = ['admin', 'park'];
            for (const k of lists) {
                const idx = vm.menuItems[k].findIndex(i => i.index === itemIndex);
                if (idx >= 0) {
                    vm.menuItems[k][idx] = { ...vm.menuItems[k][idx], ...updates };
                    // 触发视图更新（Vue 3 响应式直接赋值应生效）
                    localStorage.setItem('menuItemsOverride', JSON.stringify(vm.menuItems));
                    return true;
                }
            }
        } catch (e) {
            console.error('updateMenuItem failed', e);
        }
        return false;
    };
}

initApp();
