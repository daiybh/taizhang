package handler

import (
	"net/http"

	"taizhang-server/internal/service"

	"github.com/gin-gonic/gin"
)

type PluginHandler struct {
	service *service.PluginService
}

func NewPluginHandler(service *service.PluginService) *PluginHandler {
	return &PluginHandler{service: service}
}

// Verify PC端插件验证
func (h *PluginHandler) Verify(c *gin.Context) {
	var req struct {
		ParkID    uint   `json:"park_id" binding:"required"`
		Timestamp int64  `json:"timestamp" binding:"required"`
		Signature string `json:"signature" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	park, err := h.service.Verify(req.ParkID, req.Timestamp, req.Signature)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, park)
}

// Sync 同步数据
func (h *PluginHandler) Sync(c *gin.Context) {
	var req struct {
		ParkID   uint        `json:"park_id" binding:"required"`
		DataType string      `json:"data_type" binding:"required"`
		Data     interface{} `json:"data" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.Sync(req.ParkID, req.DataType, req.Data); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "success"})
}
