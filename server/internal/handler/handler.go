
package handler

import (
	"taizhang-server/internal/service"
)

type Handler struct {
	Park            *ParkHandler
	Renewal         *RenewalHandler
	Company         *CompanyHandler
	QRCode          *QRCodeHandler
	ExternalVehicle *ExternalVehicleHandler
	InternalVehicle *InternalVehicleHandler
	NonRoad         *NonRoadHandler
	User            *UserHandler
	Role            *RoleHandler
	Department      *DepartmentHandler
	MiniProgram     *MiniProgramHandler
	Plugin          *PluginHandler
}

func New(services *service.Services) *Handler {
	return &Handler{
		Park:            NewParkHandler(services.Park),
		Renewal:         NewRenewalHandler(services.Renewal),
		Company:         NewCompanyHandler(services.Company),
		QRCode:          NewQRCodeHandler(services.QRCode),
		ExternalVehicle: NewExternalVehicleHandler(services.ExternalVehicle),
		InternalVehicle: NewInternalVehicleHandler(services.InternalVehicle),
		NonRoad:         NewNonRoadHandler(services.NonRoad),
		User:            NewUserHandler(services.User),
		Role:            NewRoleHandler(services.Role),
		Department:      NewDepartmentHandler(services.Department),
		MiniProgram:     NewMiniProgramHandler(services.MiniProgram),
		Plugin:          NewPluginHandler(services.Plugin),
	}
}
