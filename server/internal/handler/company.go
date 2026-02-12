package handler

import (
	"strconv"

	"taizhang-server/internal/model"
	"taizhang-server/internal/response"
	"taizhang-server/internal/service"

	"github.com/gin-gonic/gin"
)

type CompanyHandler struct {
	service *service.CompanyService
}

func NewCompanyHandler(service *service.CompanyService) *CompanyHandler {
	return &CompanyHandler{service: service}
}

func (h *CompanyHandler) Create(c *gin.Context) {
	var company model.Company
	if err := c.ShouldBindJSON(&company); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	if err := h.service.Create(&company); err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.SuccessWithMessage(c, "新增成功", company)
}

func (h *CompanyHandler) List(c *gin.Context) {
	name := c.Query("name")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	companies, total, err := h.service.List(name, page, pageSize)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.SuccessPage(c, companies, int64(total), page, pageSize)
}

func (h *CompanyHandler) Get(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	company, err := h.service.GetByID(uint(id))
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	response.Success(c, company)
}

func (h *CompanyHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	// 先读取现有记录，防止部分字段被覆盖
	exist, err := h.service.GetByID(uint(id))
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	var payload model.Company
	if err := c.ShouldBindJSON(&payload); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	// 合并修改字段
	if payload.Name != "" {
		exist.Name = payload.Name
	}
	if payload.Remark != "" {
		exist.Remark = payload.Remark
	}
	// 更新联系信息
	if payload.ContactName != "" {
		exist.ContactName = payload.ContactName
	}
	if payload.ContactPhone != "" {
		exist.ContactPhone = payload.ContactPhone
	}

	if err := h.service.Update(exist); err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.SuccessWithMessage(c, "更新成功", exist)
}

func (h *CompanyHandler) Delete(c *gin.Context) {
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
