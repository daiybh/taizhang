-- =====================================================
-- 台账系统数据库创建脚本
-- =====================================================
-- 数据库: taizhang
-- 字符集: utf8mb4
-- 排序规则: utf8mb4_unicode_ci
-- =====================================================

-- 创建数据库
DROP DATABASE IF EXISTS taizhang;
CREATE DATABASE taizhang 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE taizhang;

-- =====================================================
-- 1. 车场表 (Parks)
-- =====================================================
CREATE TABLE parks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '车场ID',
  name VARCHAR(100) NOT NULL COMMENT '车场名称',
  code VARCHAR(50) NOT NULL UNIQUE COMMENT '车场代码',
  secret_key VARCHAR(32) NOT NULL COMMENT '秘钥',
  start_time DATETIME COMMENT '开始时间',
  end_time DATETIME COMMENT '结束时间',
  province VARCHAR(50) COMMENT '省份',
  city VARCHAR(50) COMMENT '城市',
  district VARCHAR(50) COMMENT '区县',
  industry VARCHAR(50) COMMENT '行业',
  remark TEXT COMMENT '备注',
  contact_name VARCHAR(50) COMMENT '联系人名称',
  contact_phone VARCHAR(20) COMMENT '联系人电话',
  login_account VARCHAR(5) NOT NULL COMMENT '登录账号',
  login_password VARCHAR(100) NOT NULL COMMENT '登录密码(bcrypt加密)',
  login_url VARCHAR(200) COMMENT '登录URL',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_code (code),
  INDEX idx_name (name),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='车场表';

-- =====================================================
-- 2. 角色表 (Roles) - 必须先创建（被users表外键引用）
-- =====================================================
CREATE TABLE roles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '角色ID',
  park_id BIGINT UNSIGNED NOT NULL COMMENT '车场ID',
  name VARCHAR(50) NOT NULL COMMENT '角色名称',
  description TEXT COMMENT '描述',
  permissions JSON COMMENT '权限配置',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  FOREIGN KEY (park_id) REFERENCES parks(id) ON DELETE CASCADE,
  INDEX idx_park_id (park_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- =====================================================
-- 3. 部门表 (Departments) - 必须先创建（被users表外键引用）
-- =====================================================
CREATE TABLE departments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '部门ID',
  park_id BIGINT UNSIGNED NOT NULL COMMENT '车场ID',
  name VARCHAR(50) NOT NULL COMMENT '部门名称',
  description TEXT COMMENT '描述',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  FOREIGN KEY (park_id) REFERENCES parks(id) ON DELETE CASCADE,
  INDEX idx_park_id (park_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='部门表';

-- =====================================================
-- 4. 用户表 (Users)
-- =====================================================
CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
  park_id BIGINT UNSIGNED NOT NULL COMMENT '车场ID',
  role_id BIGINT UNSIGNED NOT NULL COMMENT '角色ID',
  department_id BIGINT UNSIGNED COMMENT '部门ID',
  
  username VARCHAR(50) NOT NULL COMMENT '用户名',
  password VARCHAR(100) NOT NULL COMMENT '密码(bcrypt加密)',
  name VARCHAR(50) COMMENT '真实姓名',
  phone VARCHAR(20) COMMENT '电话',
  email VARCHAR(100) COMMENT '邮箱',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  FOREIGN KEY (park_id) REFERENCES parks(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  
  UNIQUE KEY uk_username_park (username, park_id),
  INDEX idx_park_id (park_id),
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- =====================================================
-- 5. 公司表 (Companies)
-- =====================================================
CREATE TABLE companies (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '公司ID',
  park_id BIGINT UNSIGNED NOT NULL COMMENT '车场ID',
  name VARCHAR(100) NOT NULL COMMENT '公司名称',
  contact_name VARCHAR(50) COMMENT '联系人名称',
  contact_phone VARCHAR(20) COMMENT '联系人电话',
  remark TEXT COMMENT '备注',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  FOREIGN KEY (park_id) REFERENCES parks(id) ON DELETE CASCADE,
  INDEX idx_park_id (park_id),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公司表';

-- =====================================================
-- 6. 续费记录表 (Renewal Records)
-- =====================================================
CREATE TABLE renewal_records (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '续费记录ID',
  park_id BIGINT UNSIGNED NOT NULL COMMENT '车场ID',
  old_end_time DATETIME COMMENT '原结束时间',
  new_end_time DATETIME COMMENT '新结束时间',
  duration INT COMMENT '续费时长(月)',
  renewal_time DATETIME COMMENT '续费时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  
  FOREIGN KEY (park_id) REFERENCES parks(id) ON DELETE CASCADE,
  INDEX idx_park_id (park_id),
  INDEX idx_renewal_time (renewal_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='续费记录表';

-- =====================================================
-- 7. 二维码配置表 (QR Codes)
-- =====================================================
CREATE TABLE qr_codes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '二维码ID',
  park_id BIGINT UNSIGNED NOT NULL COMMENT '车场ID',
  type VARCHAR(20) NOT NULL COMMENT '类型: external-vehicle, internal-vehicle, non-road',
  content TEXT NOT NULL COMMENT '二维码内容',
  is_enabled BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  fields_config JSON COMMENT '字段配置',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  FOREIGN KEY (park_id) REFERENCES parks(id) ON DELETE CASCADE,
  INDEX idx_park_id (park_id),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='二维码配置表';

-- =====================================================
-- 8. 厂外运输车辆表 (External Vehicles)
-- =====================================================
CREATE TABLE external_vehicles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '车辆ID',
  park_id BIGINT UNSIGNED NOT NULL COMMENT '车场ID',
  company_id BIGINT UNSIGNED COMMENT '公司ID',
  
  -- 基本信息
  license_plate VARCHAR(20) COMMENT '车牌号',
  plate_color VARCHAR(20) COMMENT '车牌颜色',
  vehicle_type VARCHAR(50) COMMENT '车辆类型',
  vin VARCHAR(17) COMMENT '车辆识别码',
  register_date VARCHAR(20) COMMENT '登记日期',
  brand_model VARCHAR(100) COMMENT '品牌型号',
  fuel_type VARCHAR(20) COMMENT '燃料类型',
  emission_standard VARCHAR(20) COMMENT '排放标准',
  usage_nature VARCHAR(50) COMMENT '使用性质',
  
  -- 发动机信息
  engine_number VARCHAR(50) COMMENT '发动机号',
  engine_model VARCHAR(50) COMMENT '发动机型号',
  engine_manufacturer VARCHAR(100) COMMENT '发动机制造商',
  
  -- 质量信息
  total_mass DECIMAL(10, 2) COMMENT '总质量',
  curb_mass DECIMAL(10, 2) COMMENT '整备质量',
  approved_load_mass DECIMAL(10, 2) COMMENT '核定载质量',
  max_towing_mass DECIMAL(10, 2) COMMENT '准牵引总质量',
  
  -- 其他信息
  phone VARCHAR(20) COMMENT '电话',
  is_obd_enabled BOOLEAN DEFAULT TRUE COMMENT '是否启用OBD',
  address VARCHAR(200) COMMENT '住址',
  issue_date VARCHAR(20) COMMENT '签发日期',
  owner VARCHAR(100) COMMENT '所有人',
  
  -- 运输信息
  fleet_name VARCHAR(100) COMMENT '车队名称',
  inbound_cargo_name VARCHAR(100) COMMENT '进货名称',
  inbound_cargo_weight DECIMAL(10, 2) COMMENT '进货重量',
  outbound_cargo_name VARCHAR(100) COMMENT '出货名称',
  outbound_cargo_weight DECIMAL(10, 2) COMMENT '出货重量',
  
  -- 照片
  vehicle_photo VARCHAR(500) COMMENT '车辆照片',
  driving_license_photo VARCHAR(500) COMMENT '行驶证照片',
  vehicle_list_photo VARCHAR(500) COMMENT '车辆清单照片',
  
  -- 审核与下发
  audit_status VARCHAR(20) DEFAULT 'unaudited' COMMENT '审核状态: audited, unaudited',
  dispatch_status VARCHAR(20) DEFAULT 'undispatched' COMMENT '下发状态: dispatched, undispatched',
  network_status VARCHAR(20) COMMENT '网络状态',
  dispatch_count INT DEFAULT 0 COMMENT '下发次数',
  dispatch_time DATETIME COMMENT '下发时间',
  
  -- 版本控制（用于乐观锁）
  version INT DEFAULT 0 COMMENT '版本号',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  FOREIGN KEY (park_id) REFERENCES parks(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
  
  INDEX idx_park_id (park_id),
  INDEX idx_company_id (company_id),
  INDEX idx_license_plate (license_plate),
  INDEX idx_vin (vin),
  INDEX idx_audit_status (audit_status),
  INDEX idx_dispatch_status (dispatch_status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='厂外运输车辆表';

-- =====================================================
-- 9. 厂内运输车辆表 (Internal Vehicles)
-- =====================================================
CREATE TABLE internal_vehicles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '车辆ID',
  park_id BIGINT UNSIGNED NOT NULL COMMENT '车场ID',
  
  -- 基本信息
  environmental_code VARCHAR(50) COMMENT '环保代码',
  vin VARCHAR(17) COMMENT '车辆识别码',
  production_date VARCHAR(20) COMMENT '生产日期',
  license_plate VARCHAR(20) COMMENT '车牌号',
  register_date VARCHAR(20) COMMENT '登记日期',
  brand_model VARCHAR(100) COMMENT '品牌型号',
  fuel_type VARCHAR(20) COMMENT '燃料类型',
  emission_standard VARCHAR(20) COMMENT '排放标准',
  usage_nature VARCHAR(50) COMMENT '使用性质',
  owner VARCHAR(100) COMMENT '所有人',
  vehicle_type VARCHAR(50) COMMENT '车辆类型',
  plate_color VARCHAR(20) COMMENT '车牌颜色',
  
  -- 发动机信息
  engine_number VARCHAR(50) COMMENT '发动机号',
  local_environmental_code VARCHAR(50) COMMENT '本地环保代码',
  
  -- 质量信息
  approved_load_mass DECIMAL(10, 2) COMMENT '核定载质量',
  max_towing_mass DECIMAL(10, 2) COMMENT '准牵引总质量',
  
  -- 其他信息
  address VARCHAR(200) COMMENT '住址',
  issue_date VARCHAR(20) COMMENT '签发日期',
  
  -- 照片
  vehicle_list_photo VARCHAR(500) COMMENT '车辆清单照片',
  driving_license_photo VARCHAR(500) COMMENT '行驶证照片',
  vehicle_photo VARCHAR(500) COMMENT '车辆照片',
  
  -- 联网与下发
  network_status VARCHAR(20) COMMENT '网络状态',
  dispatch_status VARCHAR(20) DEFAULT 'undispatched' COMMENT '下发状态',
  dispatch_time DATETIME COMMENT '下发时间',
  
  -- 版本控制（用于乐观锁）
  version INT DEFAULT 0 COMMENT '版本号',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  FOREIGN KEY (park_id) REFERENCES parks(id) ON DELETE CASCADE,
  
  INDEX idx_park_id (park_id),
  INDEX idx_environmental_code (environmental_code),
  INDEX idx_vin (vin),
  INDEX idx_license_plate (license_plate),
  INDEX idx_dispatch_status (dispatch_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='厂内运输车辆表';

-- =====================================================
-- 10. 非道路移动机械表 (Non-Road Machineries)
-- =====================================================
CREATE TABLE non_road_machineries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '机械ID',
  park_id BIGINT UNSIGNED NOT NULL COMMENT '车场ID',
  
  -- 基本信息
  environmental_code VARCHAR(50) COMMENT '环保代码',
  production_date VARCHAR(20) COMMENT '生产日期',
  license_plate VARCHAR(20) COMMENT '号牌',
  emission_standard VARCHAR(20) COMMENT '排放标准',
  fuel_type VARCHAR(20) COMMENT '燃料类型',
  machinery_type VARCHAR(50) COMMENT '机械类型',
  pin VARCHAR(50) COMMENT '机械识别码',
  machinery_model VARCHAR(100) COMMENT '机械型号',
  
  -- 发动机信息
  engine_model VARCHAR(50) COMMENT '发动机型号',
  engine_manufacturer VARCHAR(100) COMMENT '发动机制造商',
  engine_number VARCHAR(50) COMMENT '发动机号',
  engine_power DECIMAL(10, 2) COMMENT '发动机功率(kW)',
  
  -- 其他信息
  owner VARCHAR(100) COMMENT '所有人',
  environmental_info_number VARCHAR(50) COMMENT '环保信息编号',
  register_date VARCHAR(20) COMMENT '登记日期',
  machinery_manufacturer VARCHAR(100) COMMENT '机械制造商',
  local_environmental_code VARCHAR(50) COMMENT '本地环保代码',
  entry_date VARCHAR(20) COMMENT '进场日期',
  
  -- 照片
  whole_machine_photo VARCHAR(500) COMMENT '整机铭牌照片',
  engine_nameplate_photo VARCHAR(500) COMMENT '发动机铭牌照片',
  environmental_label_photo VARCHAR(500) COMMENT '环保标签照片',
  device_photo VARCHAR(500) COMMENT '设备照片',
  
  -- 下发
  dispatch_status VARCHAR(20) DEFAULT 'undispatched' COMMENT '下发状态',
  dispatch_time DATETIME COMMENT '下发时间',
  
  -- 版本控制（用于乐观锁）
  version INT DEFAULT 0 COMMENT '版本号',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  FOREIGN KEY (park_id) REFERENCES parks(id) ON DELETE CASCADE,
  
  INDEX idx_park_id (park_id),
  INDEX idx_environmental_code (environmental_code),
  INDEX idx_license_plate (license_plate),
  INDEX idx_pin (pin),
  INDEX idx_dispatch_status (dispatch_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='非道路移动机械表';

-- =====================================================
-- 11. PC端插件认证表 (Plugin Auth)
-- =====================================================
CREATE TABLE plugin_auths (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '认证ID',
  park_id BIGINT UNSIGNED NOT NULL COMMENT '车场ID',
  token VARCHAR(100) NOT NULL UNIQUE COMMENT '认证令牌',
  expires_at DATETIME NOT NULL COMMENT '过期时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  
  FOREIGN KEY (park_id) REFERENCES parks(id) ON DELETE CASCADE,
  
  INDEX idx_park_id (park_id),
  INDEX idx_token (token),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='PC端插件认证表';

-- =====================================================
-- 创建组合索引优化查询性能
-- =====================================================

-- 用户查询优化
CREATE INDEX idx_users_park_role ON users(park_id, role_id);
CREATE INDEX idx_users_park_department ON users(park_id, department_id);

-- 车辆状态和时间查询优化
CREATE INDEX idx_external_vehicles_dispatch_status ON external_vehicles(dispatch_status, dispatch_time);
CREATE INDEX idx_internal_vehicles_dispatch_status ON internal_vehicles(dispatch_status, dispatch_time);
CREATE INDEX idx_non_road_dispatch_status ON non_road_machineries(dispatch_status, dispatch_time);

-- 车辆搜索优化
CREATE INDEX idx_external_vehicles_search ON external_vehicles(license_plate, vin, owner);
CREATE INDEX idx_internal_vehicles_search ON internal_vehicles(license_plate, vin, owner);

-- =====================================================
-- 创建初始数据（可选）
-- =====================================================

-- 插入一个示例车场
-- INSERT INTO parks (name, code, secret_key, login_account, login_password)
-- VALUES ('示例车场', 'TEST001', 'secret_key_example', 'admin', 'hashed_password_here');

-- =====================================================
-- 脚本完成
-- =====================================================
-- 总表数: 11个
-- 总索引数: 20+个
-- 字符集: utf8mb4 (支持Emoji和特殊字符)
-- 存储引擎: InnoDB (支持事务和外键)
-- =====================================================
