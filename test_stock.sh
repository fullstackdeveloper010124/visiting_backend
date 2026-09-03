#!/bin/bash

echo "Logging in as superuser..."
SUPER_RES=$(curl -s -X POST -H "Content-Type: application/json" -d '{"email":"superuser@company.com","password":"admin123"}' http://localhost:5000/api/v1/auth/login)
SUPER_TOKEN=$(echo $SUPER_RES | jq -r '.data.token')

echo "Getting inventory..."
INV_RES=$(curl -s -H "Authorization: Bearer $SUPER_TOKEN" http://localhost:5000/api/v1/inventory)
# Find BC-PREM item ID
INV_ID=$(echo $INV_RES | jq -r '.data[] | select(.product.sku == "BC-PREM") | ._id')
echo "BC-PREM Inventory ID: $INV_ID"

echo "Setting stock to 500..."
ADJ_RES=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $SUPER_TOKEN" -d "{\"inventoryId\":\"$INV_ID\",\"quantity\":500,\"notes\":\"Test Update\"}" http://localhost:5000/api/v1/inventory/adjust-stock)
echo "Adjust stock response: $(echo $ADJ_RES | jq -r '.success')"

echo "Logging in as normal user..."
USER_RES=$(curl -s -X POST -H "Content-Type: application/json" -d '{"email":"user@company.com","password":"user123"}' http://localhost:5000/api/v1/auth/login)
USER_TOKEN=$(echo $USER_RES | jq -r '.data.token')

echo "Getting products..."
PROD_RES=$(curl -s -H "Authorization: Bearer $USER_TOKEN" http://localhost:5000/api/v1/products)
# Find BC-PREM product ID and stock
PROD_ID=$(echo $PROD_RES | jq -r '.data[] | select(.sku == "BC-PREM") | ._id')
PROD_STOCK=$(echo $PROD_RES | jq -r '.data[] | select(.sku == "BC-PREM") | .stock')
echo "BC-PREM Product ID: $PROD_ID"
echo "BC-PREM Product Stock: $PROD_STOCK"

echo "Placing order for 100 units..."
ORDER_DATA="{\"items\":[{\"product\":\"$PROD_ID\",\"quantity\":100,\"unitPrice\":45,\"subtotal\":4500,\"customization\":{}}],\"subtotal\":4500,\"tax\":360,\"shipping\":0,\"total\":4860,\"paymentStatus\":\"pending\"}"
ORDER_RES=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $USER_TOKEN" -d "$ORDER_DATA" http://localhost:5000/api/v1/orders)
echo "Order 1 success: $(echo $ORDER_RES | jq -r '.success')"

echo "Getting products again..."
PROD_RES2=$(curl -s -H "Authorization: Bearer $USER_TOKEN" http://localhost:5000/api/v1/products)
PROD_STOCK2=$(echo $PROD_RES2 | jq -r '.data[] | select(.sku == "BC-PREM") | .stock')
echo "BC-PREM Product Stock after order 1: $PROD_STOCK2"

echo "Placing order for 500 units (should fail)..."
ORDER_DATA2="{\"items\":[{\"product\":\"$PROD_ID\",\"quantity\":500,\"unitPrice\":45,\"subtotal\":22500,\"customization\":{}}],\"subtotal\":22500,\"tax\":1800,\"shipping\":0,\"total\":24300,\"paymentStatus\":\"pending\"}"
ORDER_RES2=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $USER_TOKEN" -d "$ORDER_DATA2" http://localhost:5000/api/v1/orders)
echo "Order 2 success: $(echo $ORDER_RES2 | jq -r '.success')"
echo "Order 2 error: $(echo $ORDER_RES2 | jq -r '.error')"

