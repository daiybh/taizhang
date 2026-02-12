
# 台账系统后端服务

## 项目简介

这是一个基于Go语言开发的台账管理系统后端服务，支持车场管理、车辆管理、公司管理等功能。

## 功能模块

### 管理层
- 车场管理（增删改查、续费、下载）
- 续费记录（查询）

### 车场层
- 公司管理（增删改查）
- 二维码管理（厂外运输车辆、厂内运输车辆、非道路移动机械）
- 厂外运输车辆基本信息（增删改查、审核、下发）
- 厂内运输车辆基本信息（增删改查、下发）
- 非道路移动机械基本信息（增删改查、下发）
- 用户权限管理（角色管理、员工管理）
- 部门管理（增删改查）

### 车主端-小程序
- 扫码登记
- 车辆信息提交
- 第三方随车清单数据获取

### PC端插件
- 插件验证
- 数据同步

## 技术栈

- Go 1.21
- Gin Web框架
- GORM ORM框架
- MySQL数据库
- Viper配置管理

## 项目结构

```
server/
├── cmd/
│   └── main.go              # 程序入口
├── config/
│   └── config.yaml          # 配置文件
├── internal/
│   ├── config/              # 配置加载
│   ├── handler/             # HTTP处理器
│   ├── middleware/          # 中间件
│   ├── model/               # 数据模型
│   ├── repository/          # 数据访问层
│   └── service/             # 业务逻辑层
└── go.mod                   # Go模块文件
```

## 快速开始

### 环境要求

- Go 1.21+
- MySQL 5.7+

### 安装依赖

```bash
go mod download
```

### 配置

编辑 `config/config.yaml` 文件，设置数据库连接等配置：

```yaml
server:
  port: "8080"
  mode: "debug"

database:
  dsn: "root:password@tcp(localhost:3306)/taizhang?charset=utf8mb4&parseTime=True&loc=Local"

thirdparty:
  park_id: "20260202"
  base_url: "http://cloudserver.ddpark.fun:9898/api"

oss:
  endpoint: "oss-cn-beijing.aliyuncs.com"
  access_key_id: "your_access_key_id"
  access_key_secret: "your_access_key_secret"
  bucket_name: "your_bucket_name"
```

### 运行

```bash
go run cmd/main.go
```

### 编译

```bash
go build -o taizhang-server cmd/main.go
```

## API文档

### 管理层API

#### 车场管理
- POST /api/v1/parks - 创建车场
- GET /api/v1/parks - 查询车场列表
- GET /api/v1/parks/:id - 获取车场详情
- PUT /api/v1/parks/:id - 更新车场信息
- DELETE /api/v1/parks/:id - 删除车场
- POST /api/v1/parks/:id/renew - 车场续费
- GET /api/v1/parks/:id/download - 下载车场信息

#### 续费记录
- GET /api/v1/renewals - 查询续费记录

### 车场层API

#### 公司管理
- POST /api/v1/companies - 创建公司
- GET /api/v1/companies - 查询公司列表
- GET /api/v1/companies/:id - 获取公司详情
- PUT /api/v1/companies/:id - 更新公司信息
- DELETE /api/v1/companies/:id - 删除公司

#### 二维码管理
- GET /api/v1/qrcodes/external-vehicle - 获取厂外运输车辆二维码
- POST /api/v1/qrcodes/external-vehicle/update - 更新厂外运输车辆二维码
- GET /api/v1/qrcodes/internal-vehicle - 获取厂内运输车辆二维码
- POST /api/v1/qrcodes/internal-vehicle/update - 更新厂内运输车辆二维码
- GET /api/v1/qrcodes/non-road - 获取非道路移动机械二维码
- POST /api/v1/qrcodes/non-road/update - 更新非道路移动机械二维码

#### 厂外运输车辆
- POST /api/v1/external-vehicles - 创建车辆
- GET /api/v1/external-vehicles - 查询车辆列表
- GET /api/v1/external-vehicles/:id - 获取车辆详情
- PUT /api/v1/external-vehicles/:id - 更新车辆信息
- DELETE /api/v1/external-vehicles/:id - 删除车辆
- POST /api/v1/external-vehicles/audit - 审核车辆
- POST /api/v1/external-vehicles/dispatch - 下发车辆

#### 厂内运输车辆
- POST /api/v1/internal-vehicles - 创建车辆
- GET /api/v1/internal-vehicles - 查询车辆列表
- GET /api/v1/internal-vehicles/:id - 获取车辆详情
- PUT /api/v1/internal-vehicles/:id - 更新车辆信息
- DELETE /api/v1/internal-vehicles/:id - 删除车辆
- POST /api/v1/internal-vehicles/dispatch - 下发车辆

#### 非道路移动机械
- POST /api/v1/non-road - 创建机械
- GET /api/v1/non-road - 查询机械列表
- GET /api/v1/non-road/:id - 获取机械详情
- PUT /api/v1/non-road/:id - 更新机械信息
- DELETE /api/v1/non-road/:id - 删除机械
- POST /api/v1/non-road/dispatch - 下发机械

#### 用户权限
- POST /api/v1/users - 创建用户
- GET /api/v1/users - 查询用户列表
- GET /api/v1/users/:id - 获取用户详情
- PUT /api/v1/users/:id - 更新用户信息
- DELETE /api/v1/users/:id - 删除用户

#### 角色管理
- POST /api/v1/roles - 创建角色
- GET /api/v1/roles - 查询角色列表
- GET /api/v1/roles/:id - 获取角色详情
- PUT /api/v1/roles/:id - 更新角色信息
- DELETE /api/v1/roles/:id - 删除角色

#### 部门管理
- POST /api/v1/departments - 创建部门
- GET /api/v1/departments - 查询部门列表
- GET /api/v1/departments/:id - 获取部门详情
- PUT /api/v1/departments/:id - 更新部门信息
- DELETE /api/v1/departments/:id - 删除部门

### 车主端小程序API

- POST /api/v1/mini-program/scan - 扫码登记
- POST /api/v1/mini-program/vehicle - 提交车辆信息
- POST /api/v1/mini-program/get-car-data - 获取第三方随车清单数据

### PC端插件API

- POST /api/v1/plugin/verify - 插件验证
- POST /api/v1/plugin/sync - 数据同步

## 性能考虑

系统设计支持以下场景：
- 500个车场
- 1000万数据

## 许可证

MIT License
