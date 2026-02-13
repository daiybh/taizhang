部署说明 — 台账服务 (server)

1) 生成发布包（在 `server/` 目录下运行）

```bash
chmod +x build_release.sh
./build_release.sh
```

生成文件示例：`taizhang-server-<version>-linux-amd64.tar.gz`，解压后目录结构类似：

- bin/taizhang-server
- config/*
- web/*

2) 在目标 Linux 主机上解压并部署

```bash
sudo useradd -r -s /sbin/nologin taizhang || true
sudo mkdir -p /opt/taizhang
sudo tar -xzf taizhang-server-<version>-linux-amd64.tar.gz -C /opt/taizhang
sudo mv /opt/taizhang/bin/taizhang-server /opt/taizhang/bin/taizhang-server
sudo chown -R taizhang:taizhang /opt/taizhang
```

3) systemd 服务（将模板文件复制到 `/etc/systemd/system/taizhang.service` 并启用）

```bash
sudo cp deploy/server.service.template /etc/systemd/system/taizhang.service
sudo systemctl daemon-reload
sudo systemctl enable --now taizhang.service
sudo journalctl -u taizhang.service -f
```

4) 使用 Docker

在服务器根目录 `server/` 下构建镜像：

```bash
docker build -t taizhang:latest .
docker run -p 8080:8080 --name taizhang -d taizhang:latest
```

注意：确保 `config/config.yaml` 中的数据库和端口配置在目标环境中可用。
