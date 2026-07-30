package http

import (
	"net/http"

	"ferreteria/internal/config"
)

// Movement endpoints exposed by this router:
//   POST /api/movements        record an income or expense entry
//   GET /api/movements         list movements of a period
//   PUT /api/movements/{id}    edit an existing movement
//   DELETE /api/movements/{id} cancel a movement as a soft delete
func registerMovementRoutes(
	mux *http.ServeMux,
	settings config.Config,
	dependencies *dependencies,
) {
	collection := http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		switch request.Method {
		case http.MethodPost:
			handleCreateMovement(dependencies)(writer, request)
		case http.MethodGet:
			handleListMovement(dependencies)(writer, request)
		default:
			writeError(writer, http.StatusMethodNotAllowed, "method not allowed")
		}
	})

	item := http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		switch request.Method {
		case http.MethodPut:
			handleEditMovement(dependencies)(writer, request)
		case http.MethodDelete:
			handleCancelMovement(dependencies)(writer, request)
		default:
			writeError(writer, http.StatusMethodNotAllowed, "method not allowed")
		}
	})

	_ = settings
	mux.Handle("/api/movements", withAuth(dependencies.tokens, collection))
	mux.Handle("/api/movements/", withAuth(dependencies.tokens, item))
}
