package handler

import (
	"strconv"

	"taizhang-server/internal/response"
	"taizhang-server/internal/service"

	"github.com/gin-gonic/gin"
)

type RenewalHandler struct {
	service *service.RenewalService
}

func NewRenewalHandler(service *service.RenewalService) *RenewalHandler {
	return &RenewalHandler{service: service}
}

func (h *RenewalHandler) List(c *gin.Context) {
	parkName := c.Query("parkName")
	parkCode := c.Query("parkCode")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	records, total, err := h.service.List(parkName, parkCode, page, pageSize)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.SuccessPage(c, records, int64(total), page, pageSize)
}
