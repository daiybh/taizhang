
package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"taizhang-server/internal/service"
)

type RenewalHandler struct {
	service *service.RenewalService
}

func NewRenewalHandler(service *service.RenewalService) *RenewalHandler {
	return &RenewalHandler{service: service}
}

func (h *RenewalHandler) List(c *gin.Context) {
	parkName := c.Query("park_name")
	parkCode := c.Query("park_code")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	records, total, err := h.service.List(parkName, parkCode, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  records,
		"total": total,
		"page":  page,
		"page_size": pageSize,
	})
}
