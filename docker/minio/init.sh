#!/bin/sh
# Inicializa el bucket del portal. Idempotente.
#
# NOTA sobre CORS: MinIO NO implementa la API de CORS por bucket
# (`mc cors set` responde "functionality is not implemented"). El CORS se
# configura a nivel de servidor con MINIO_API_CORS_ALLOW_ORIGIN, definida
# en docker-compose.yml sobre el servicio `minio`. Este script solo lo
# verifica; si falta, la subida directa desde el navegador fallaria.
set -e

echo ">> Conectando a MinIO..."
mc alias set local http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"

echo ">> Creando bucket '$MINIO_BUCKET' (si no existe)..."
mc mb --ignore-existing "local/$MINIO_BUCKET"

# Bucket PRIVADO a proposito. Todo acceso pasa por presigned URLs firmadas
# por NestJS tras validar permisos. Nada es publico.
echo ">> Forzando acceso privado..."
mc anonymous set none "local/$MINIO_BUCKET"

# Ciclo de vida: purga subidas multipart abandonadas.
echo ">> Configurando limpieza de subidas incompletas..."
mc ilm rule add --expire-delete-marker "local/$MINIO_BUCKET" 2>/dev/null || true

echo ">> Verificando CORS del servidor..."
if mc admin config get local api 2>/dev/null | grep -q "cors_allow_origin"; then
  mc admin config get local api 2>/dev/null | tr ' ' '\n' | grep "cors_allow_origin" || true
else
  echo "!! Aviso: no se pudo leer la configuracion de CORS del servidor."
fi

echo ">> MinIO listo. Bucket: $MINIO_BUCKET"
mc ls local/
