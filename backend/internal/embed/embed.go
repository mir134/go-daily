package embed

import (
    "embed"
    "io/fs"
    "net/http"
)

//go:embed frontend/dist/*
var frontendFS embed.FS

// GetFS returns an http.FileSystem for serving the embedded frontend
func GetFS() (http.FileSystem, error) {
	subFS, err := fs.Sub(frontendFS, "frontend/dist")
	if err != nil {
		return nil, err
	}
	return http.FS(subFS), nil
}
