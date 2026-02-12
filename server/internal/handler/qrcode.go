
package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"taizhang-server/internal/service"
)

type QRCodeHandler struct {
	service *service.QRCodeService
}

func NewQRCodeHandler(service *service.QRCodeService) *QRCodeHandler {
	return &QRCodeHandler{service: service}
}

func (h *QRCodeHandler) GetExternalVehicle(c *gin.Context) {
	parkID, _ := strconv.ParseUint(c.Query("park_id"), 10, 32)

	qrcode, err := h.service.GetByParkIDAndType(uint(parkID), "external-vehicle")
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, qrcode)
}

func (h *QRCodeHandler) UpdateExternalVehicle(c *gin.Context) {
	parkID, _ := strconv.ParseUint(c.Query("park_id"), 10, 32)

	qrcode, err := h.service.UpdateQRCode(uint(parkID), "external-vehicle")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, qrcode)
}

func (h *QRCodeHandler) GetInternalVehicle(c *gin.Context) {
	parkID, _ := strconv.ParseUint(c.Query("park_id"), 10, 32)

	qrcode, err := h.service.GetByParkIDAndType(uint(parkID), "internal-vehicle")
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, qrcode)
}

func (h *QRCodeHandler) UpdateInternalVehicle(c *gin.Context) {
	parkID, _ := strconv.ParseUint(c.Query("park_id"), 10, 32)

	qrcode, err := h.service.UpdateQRCode(uint(parkID), "internal-vehicle")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, qrcode)
}

func (h *QRCodeHandler) GetNonRoad(c *gin.Context) {
	parkID, _ := strconv.ParseUint(c.Query("park_id"), 10, 32)

	qrcode, err := h.service.GetByParkIDAndType(uint(parkID), "non-road")
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, qrcode)
}

func (h *QRCodeHandler) UpdateNonRoad(c *gin.Context) {
	parkID, _ := strconv.ParseUint(c.Query("park_id"), 10, 32)

	qrcode, err := h.service.UpdateQRCode(uint(parkID), "non-road")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, qrcode)
}
