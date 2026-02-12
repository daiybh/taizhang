
package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"taizhang-server/internal/model"
	"taizhang-server/internal/service"
)

type MiniProgramHandler struct {
	service *service.MiniProgramService
}

func NewMiniProgramHandler(service *service.MiniProgramService) *MiniProgramHandler {
	return &MiniProgramHandler{service: service}
}

// Scan 扫码处理
func (h *MiniProgramHandler) Scan(c *gin.Context) {
	var req struct {
		QRCode string `json:"qrcode" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.service.Scan(req.QRCode)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// SubmitVehicle 提交车辆信息
func (h *MiniProgramHandler) SubmitVehicle(c *gin.Context) {
	var vehicle model.ExternalVehicle
	if err := c.ShouldBindJSON(&vehicle); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.SubmitVehicle(&vehicle); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, vehicle)
}

// GetCarData 获取第三方随车清单数据
func (h *MiniProgramHandler) GetCarData(c *gin.Context) {
	var req struct {
		Plate         string `json:"plate" binding:"required"`
		VIN           string `json:"vin" binding:"required"`
		EngineNumber  string `json:"engine_number" binding:"required"`
		VehicleType   string `json:"vehicle_type" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	data, err := h.service.GetCarData(req.Plate, req.VIN, req.EngineNumber, req.VehicleType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, data)
}
