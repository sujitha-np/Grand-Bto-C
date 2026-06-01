#!/bin/bash
URL="https://grandbakeryb2c.preview.gingertechnologies.app/api/customer/cart/add"
DATA="-F 'customer_id=3' -F 'product_id=4' -F 'quantity=1' -F 'preorder_date=2026-05-09' -H 'Accept: application/json'"

test_req() {
  echo "Testing: $1"
  eval "curl -s -X POST $URL $DATA $1"
  echo -e "\n"
}

test_req "-H 'Authorization: Bearer test'"
test_req "-F 'token=test'"
test_req "-F 'access_token=test'"
test_req "-F 'api_token=test'"
test_req "-F 'guest_token=test'"
test_req "-H 'guest_token: test'"
test_req "-H 'api_token: test'"
