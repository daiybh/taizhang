package handler

import (
	"net/http"
	"strconv"

	"taizhang-server/internal/model"
	"taizhang-server/internal/response"
	"taizhang-server/internal/service"

	"github.com/gin-gonic/gin"
)

type ParkHandler struct {
	service *service.ParkService
}

func NewParkHandler(service *service.ParkService) *ParkHandler {
	return &ParkHandler{service: service}
}

func (h *ParkHandler) Create(c *gin.Context) {
	var park model.Park
	if err := c.ShouldBindJSON(&park); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	if err := h.service.Create(&park); err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.SuccessWithMessage(c, "新增成功", park)
}

func (h *ParkHandler) List(c *gin.Context) {
	name := c.Query("name")
	code := c.Query("code")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	parks, total, err := h.service.List(name, code, page, pageSize)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.SuccessPage(c, parks, int64(total), page, pageSize)
}

func (h *ParkHandler) Get(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	park, err := h.service.GetByID(uint(id))
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	response.Success(c, park)
}

func (h *ParkHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	if err := h.service.Update(uint(id), updates); err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.SuccessWithMessage(c, "更新成功", nil)
}

func (h *ParkHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	if err := h.service.Delete(uint(id)); err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.SuccessWithMessage(c, "删除成功", nil)
}

func (h *ParkHandler) Renew(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	var req struct {
		Duration int `json:"duration"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	park, err := h.service.Renew(uint(id), req.Duration)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.SuccessWithMessage(c, "续费成功", park)
}

func (h *ParkHandler) DownloadInfo(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	loginURL := c.DefaultQuery("login_url", "http://www.xxx.com")
	info, err := h.service.DownloadInfo(uint(id), loginURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Type", "text/plain; charset=utf-8")
	c.Header("Content-Disposition", "attachment; filename=park_info.txt")
	c.String(http.StatusOK, info)
}
