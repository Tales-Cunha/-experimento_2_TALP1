#!/bin/bash

# Configuration
DATA_DIR="$(pwd)/data"
TEST_BASE_URL="http://localhost:3001"
HEALTH_CHECK_URL="${TEST_BASE_URL}/api/health"
MAX_RETRIES=30
RETRY_INTERVAL=1

echo "--- Starting SAMS Test Pipeline ---"

# 1. Start backend server via Docker
echo "Checking backend status..."
if ! curl -s "$HEALTH_CHECK_URL" > /dev/null; then
    echo "Backend is not reachable. Starting Docker containers..."
    mkdir -p "$DATA_DIR"
    docker compose up -d
else
    echo "Backend is already running."
fi

# 2. Wait for health check
echo "Waiting for backend to be healthy at $HEALTH_CHECK_URL..."
COUNT=0
until $(curl --output /dev/null --silent --head --fail "$HEALTH_CHECK_URL"); do
    if [ $COUNT -eq $MAX_RETRIES ]; then
        echo "Error: Backend failed to become healthy after $MAX_RETRIES seconds."
        exit 1
    fi
    printf '.'
    sleep $RETRY_INTERVAL
    COUNT=$((COUNT + 1))
done
echo -e "\nBackend is UP and healthy!"

# 3. Run Unit Tests
echo -e "\n--- Running Unit Tests ---"
UNIT_OUTPUT=$(npm run test:unit 2>&1)
UNIT_EXIT_CODE=$?
echo "$UNIT_OUTPUT"

# 4. Run Acceptance Tests
echo -e "\n--- Running Acceptance Tests ---"
# Ensure DATA_DIR is exported for the Cucumber hooks
export DATA_DIR="$DATA_DIR"
ACC_OUTPUT=$(npm run test:acceptance 2>&1)
ACC_EXIT_CODE=$?
echo "$ACC_OUTPUT"

# 5. Summary and Exit
echo -e "\n--- Test Execution Summary ---"

# Parse unit test counts
UNIT_TOTAL=$(echo "$UNIT_OUTPUT" | grep -oP '\d+(?= passed)' | head -1)
# Parse acceptance scenario counts
ACC_TOTAL=$(echo "$ACC_OUTPUT" | grep -oP '\d+(?= scenarios? \()' | grep -oP '\d+' | head -1)
if [ -z "$ACC_TOTAL" ]; then
    # Fallback for different cucumber output format
    ACC_TOTAL=$(echo "$ACC_OUTPUT" | grep -oP '\d+(?= scenarios? passed)' | head -1)
fi

# Fallbacks for zeros
UNIT_TOTAL=${UNIT_TOTAL:-0}
ACC_TOTAL=${ACC_TOTAL:-0}

echo "Unit tests passed: $UNIT_TOTAL"
echo "Acceptance scenarios passed: $ACC_TOTAL"

if [ $UNIT_EXIT_CODE -eq 0 ] && [ $ACC_EXIT_CODE -eq 0 ]; then
    echo -e "\nSUCCESS: All tests passed!"
    exit 0
else
    echo -e "\nFAILURE: One or more test suites failed."
    exit 1
fi
