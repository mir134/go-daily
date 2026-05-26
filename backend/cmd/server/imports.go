package main

import (
	_ "github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
	_ "go.uber.org/zap"
	_ "gopkg.in/yaml.v3"
	_ "gorm.io/driver/sqlite"
	_ "gorm.io/gorm"
)