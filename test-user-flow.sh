#!/bin/bash

# 🧪 CHARTERLY - TEST SCRIPT FLUJO USUARIO REGULAR
# ================================================
# Prueba completo flujo: Registro → Browse → Booking → Mensaje

BASE_URL="http://localhost:5000"
COOKIE_FILE="/tmp/user_cookies.txt"
TEST_EMAIL="testuser_$(date +%s)@example.com"
TEST_PASSWORD="TestUser123!"

echo "🚀 INICIANDO TESTS DE FLUJO USUARIO REGULAR..."
echo "==============================================="
echo "📧 Email de prueba: $TEST_EMAIL"
echo ""

# Limpia cookies anteriores
rm -f $COOKIE_FILE

# Helper function para hacer requests con cookies
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo "🔄 $description..."
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -b $COOKIE_FILE -c $COOKIE_FILE "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method -b $COOKIE_FILE -c $COOKIE_FILE \
                   -H "Content-Type: application/json" \
                   -d "$data" "$BASE_URL$endpoint")
    fi
    
    body=$(echo "$response" | head -n -1)
    status=$(echo "$response" | tail -n 1)
    
    echo "   Status: $status"
    if [ "$status" -ge 200 ] && [ "$status" -lt 300 ]; then
        echo "   ✅ SUCCESS"
    else
        echo "   ❌ ERROR: $body"
        return 1
    fi
    
    # Guarda respuesta para próximos steps
    echo "$body" > "/tmp/last_response.json"
    echo ""
    return 0
}

echo "📋 PASO 1: REGISTRAR USUARIO"
echo "=============================="
user_data='{
  "email": "'$TEST_EMAIL'",
  "password": "'$TEST_PASSWORD'",
  "fullName": "Test User",
  "phone": "+1234567890"
}'

make_request "POST" "/api/auth/local/register" "$user_data" "Registrando usuario"
if [ $? -ne 0 ]; then exit 1; fi

echo "📋 PASO 2: LOGIN USUARIO"
echo "========================="
login_data='{
  "email": "'$TEST_EMAIL'",
  "password": "'$TEST_PASSWORD'"
}'

make_request "POST" "/api/auth/local/login" "$login_data" "Haciendo login"
if [ $? -ne 0 ]; then exit 1; fi

echo "📋 PASO 3: VERIFICAR SESIÓN"
echo "============================="
make_request "GET" "/api/auth/user" "" "Verificando sesión actual"
if [ $? -ne 0 ]; then exit 1; fi

echo "📋 PASO 4: BROWSE CHARTERS"
echo "==========================="
make_request "GET" "/api/charters" "" "Obteniendo lista de charters"
if [ $? -ne 0 ]; then exit 1; fi

# Extraer primer charter ID
CHARTER_ID=$(cat /tmp/last_response.json | jq -r '.[0].id // empty')
if [ -z "$CHARTER_ID" ]; then
    echo "❌ No se encontraron charters para testear"
    exit 1
fi

echo "   🎣 Charter ID para testing: $CHARTER_ID"

echo "📋 PASO 5: VER DETALLE CHARTER"
echo "==============================="
make_request "GET" "/api/charters/$CHARTER_ID" "" "Viendo detalle del charter"
if [ $? -ne 0 ]; then exit 1; fi

echo "📋 PASO 6: OBTENER CAPTAIN INFO"
echo "================================"
make_request "GET" "/api/captains" "" "Obteniendo lista de captains"
if [ $? -ne 0 ]; then exit 1; fi

# Extraer primer captain ID
CAPTAIN_ID=$(cat /tmp/last_response.json | jq -r '.[0].id // empty')
echo "   👨‍✈️ Captain ID para testing: $CAPTAIN_ID"

echo "📋 PASO 7: CREAR BOOKING"
echo "========================="
booking_date=$(date -d "+7 days" +"%Y-%m-%dT12:00:00.000Z")
booking_data='{
  "charterId": '$CHARTER_ID',
  "tripDate": "'$booking_date'",
  "guests": 4,
  "message": "Test booking from automated script - please ignore"
}'

make_request "POST" "/api/bookings" "$booking_data" "Creando booking"
if [ $? -ne 0 ]; then exit 1; fi

# Extraer booking ID
BOOKING_ID=$(cat /tmp/last_response.json | jq -r '.id // empty')
echo "   📅 Booking ID creado: $BOOKING_ID"

echo "📋 PASO 8: VER MIS BOOKINGS"
echo "============================"
make_request "GET" "/api/bookings/me" "" "Viendo mis bookings"
if [ $? -ne 0 ]; then exit 1; fi

echo "📋 PASO 9: ENVIAR MENSAJE"
echo "=========================="
message_data='{
  "bookingId": '$BOOKING_ID',
  "message": "Hola! Este es un mensaje de prueba del script automatizado."
}'

make_request "POST" "/api/messages" "$message_data" "Enviando mensaje al captain"
if [ $? -ne 0 ]; then exit 1; fi

echo "📋 PASO 10: VER MENSAJES"
echo "========================="
make_request "GET" "/api/messages/booking/$BOOKING_ID" "" "Viendo mensajes del booking"
if [ $? -ne 0 ]; then exit 1; fi

echo "📋 PASO 11: LOGOUT"
echo "=================="
make_request "POST" "/api/auth/logout" "" "Cerrando sesión"
if [ $? -ne 0 ]; then exit 1; fi

echo ""
echo "🎉 FLUJO USUARIO COMPLETADO CON ÉXITO!"
echo "======================================="
echo "✅ Usuario registrado: $TEST_EMAIL"
echo "✅ Login/logout funcionando"
echo "✅ Browse charters operativo"
echo "✅ Booking creado: ID $BOOKING_ID"
echo "✅ Sistema de mensajes funcionando"
echo "✅ APIs respondiendo correctamente"
echo ""
echo "📊 RESUMEN DE DATOS DE PRUEBA:"
echo "- Charter ID: $CHARTER_ID"
echo "- Captain ID: $CAPTAIN_ID"  
echo "- Booking ID: $BOOKING_ID"
echo "- Email: $TEST_EMAIL"
echo ""

# Cleanup
rm -f $COOKIE_FILE /tmp/last_response.json

echo "🏁 TEST COMPLETO - USUARIO REGULAR ✅"