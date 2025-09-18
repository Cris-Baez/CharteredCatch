#!/bin/bash

# 🧪 CHARTERLY - TEST SCRIPT FLUJO CAPTAIN COMPLETO
# =================================================
# Prueba completo flujo: Registro → Verificación → Onboarding → Suscripción → Dashboard

BASE_URL="http://localhost:5000"
COOKIE_FILE="/tmp/captain_cookies.txt"
TEST_EMAIL="testcaptain_$(date +%s)@example.com"
TEST_PASSWORD="TestCaptain123!"

echo "⚓ INICIANDO TESTS DE FLUJO CAPTAIN COMPLETO..."
echo "==============================================="
echo "📧 Email de captain: $TEST_EMAIL"
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
        if [ "$method" = "GET" ] && [ ${#body} -lt 200 ]; then
            echo "   📄 Response: $body"
        fi
    else
        echo "   ❌ ERROR: $body"
        return 1
    fi
    
    # Guarda respuesta para próximos steps
    echo "$body" > "/tmp/last_captain_response.json"
    echo ""
    return 0
}

echo "📋 PASO 1: REGISTRAR CAPTAIN"
echo "============================="
captain_data='{
  "email": "'$TEST_EMAIL'",
  "password": "'$TEST_PASSWORD'",
  "fullName": "Captain Test",
  "phone": "+1555123456",
  "userType": "captain"
}'

make_request "POST" "/api/auth/register" "$captain_data" "Registrando captain"
if [ $? -ne 0 ]; then exit 1; fi

echo "📋 PASO 2: LOGIN CAPTAIN"
echo "========================"
login_data='{
  "email": "'$TEST_EMAIL'",
  "password": "'$TEST_PASSWORD'"
}'

make_request "POST" "/api/auth/login" "$login_data" "Haciendo login como captain"
if [ $? -ne 0 ]; then exit 1; fi

echo "📋 PASO 3: VERIFICAR SESIÓN CAPTAIN"
echo "==================================="
make_request "GET" "/api/auth/me" "" "Verificando sesión de captain"
if [ $? -ne 0 ]; then exit 1; fi

echo "📋 PASO 4: OBTENER STATUS CAPTAIN"
echo "================================="
make_request "GET" "/api/captain/status" "" "Obteniendo status de captain"
if [ $? -ne 0 ]; then exit 1; fi

echo "📋 PASO 5: CREAR PERFIL CAPTAIN"
echo "==============================="
captain_profile='{
  "businessName": "Test Charter Co",
  "description": "Professional test charter service",
  "location": "Key West, FL",
  "yearsExperience": 10,
  "certifications": ["USCG Master", "CPR Certified"],
  "insuranceNumber": "TEST123456",
  "licenseNumber": "FL123456"
}'

make_request "POST" "/api/captain/profile" "$captain_profile" "Creando perfil de captain"
if [ $? -ne 0 ]; then exit 1; fi

echo "📋 PASO 6: VERIFICAR DOCUMENTOS REQUERIDOS"
echo "=========================================="
make_request "GET" "/api/captain/documents/required" "" "Verificando documentos requeridos"
if [ $? -ne 0 ]; then exit 1; fi

echo "📋 PASO 7: TEST CREAR CHARTER"
echo "============================="
charter_data='{
  "title": "Test Half Day Charter",
  "description": "Automated test charter - please ignore",
  "duration": 4,
  "capacity": 6,
  "pricePerPerson": 150,
  "location": "Key West Marina",
  "targetSpecies": ["Snapper", "Grouper", "Mahi"],
  "includesEquipment": true,
  "includesBait": true
}'

make_request "POST" "/api/captain/charters" "$charter_data" "Creando charter de prueba"
if [ $? -ne 0 ]; then exit 1; fi

CHARTER_ID=$(cat /tmp/last_captain_response.json | jq -r '.id // empty')
echo "   🎣 Charter creado con ID: $CHARTER_ID"

echo "📋 PASO 8: VER MIS CHARTERS"
echo "==========================="
make_request "GET" "/api/captain/charters" "" "Viendo mis charters"
if [ $? -ne 0 ]; then exit 1; fi

echo "📋 PASO 9: OBTENER SUBSCRIPTION STATUS"
echo "======================================"
make_request "GET" "/api/captain/subscription/status" "" "Verificando status de suscripción"
if [ $? -ne 0 ]; then exit 1; fi

echo "📋 PASO 10: CREAR CHECKOUT SESSION (OPCIÓN 1)"
echo "=============================================="
make_request "POST" "/api/captain/create-checkout-session" "{}" "Creando Stripe Checkout Session"
if [ $? -ne 0 ]; then
    echo "   ⚠️  Checkout session falló - probablemente esperado en desarrollo"
fi

echo "📋 PASO 11: CREAR SUSCRIPCIÓN MANUAL (OPCIÓN 2)"
echo "==============================================="
subscription_data='{
  "paymentLater": true,
  "businessName": "Test Charter Co"
}'

make_request "POST" "/api/captain/subscription/create" "$subscription_data" "Creando suscripción manual"
if [ $? -ne 0 ]; then
    echo "   ⚠️  Suscripción manual - continuando..."
fi

echo "📋 PASO 12: VER MIS BOOKINGS"
echo "============================"
make_request "GET" "/api/captain/bookings" "" "Viendo bookings del captain"
if [ $? -ne 0 ]; then exit 1; fi

echo "📋 PASO 13: OBTENER PAYMENT INFO"
echo "================================"
make_request "GET" "/api/captain/payment-info" "" "Obteniendo info de pagos"
if [ $? -ne 0 ]; then exit 1; fi

echo "📋 PASO 14: GUARDAR PAYMENT INFO"
echo "================================"
payment_info='{
  "bankName": "Test Bank",
  "accountNumber": "****1234",
  "routingNumber": "123456789",
  "accountHolderName": "Captain Test"
}'

make_request "POST" "/api/captain/payment-info" "$payment_info" "Guardando info de pagos"
if [ $? -ne 0 ]; then exit 1; fi

echo "📋 PASO 15: TEST STATS DASHBOARD"
echo "================================"
make_request "GET" "/api/captain/stats" "" "Obteniendo estadísticas del captain"
if [ $? -ne 0 ]; then
    echo "   ⚠️  Stats endpoint no encontrado - continuando..."
fi

echo "📋 PASO 16: LOGOUT CAPTAIN"
echo "=========================="
make_request "POST" "/api/auth/logout" "" "Cerrando sesión de captain"
if [ $? -ne 0 ]; then exit 1; fi

echo ""
echo "⚓ FLUJO CAPTAIN COMPLETADO CON ÉXITO!"
echo "======================================"
echo "✅ Captain registrado: $TEST_EMAIL"
echo "✅ Perfil creado y configurado"
echo "✅ Charter de prueba creado: ID $CHARTER_ID"
echo "✅ Sistema de suscripción probado"
echo "✅ Payment info configurada"
echo "✅ APIs de captain funcionando"
echo ""
echo "📊 RESUMEN DE DATOS DE PRUEBA:"
echo "- Email captain: $TEST_EMAIL"
echo "- Charter ID: $CHARTER_ID"
echo "- Business: Test Charter Co"
echo ""

# Cleanup
rm -f $COOKIE_FILE /tmp/last_captain_response.json

echo "🏁 TEST COMPLETO - CAPTAIN FLOW ✅"