#!/usr/bin/env bash
# ForgeLab API smoke test
#
# Usage:
#   cd backend
#   EMAIL=you@example.com PASSWORD=yourpass ./test-forgelab.sh
#
# Optional:
#   OTHER_USER_ID=<id of another user>   to test follow/unfollow
#   API=http://localhost:3000            to point at a different server

API=${API:-http://localhost:3000}
EMAIL=${EMAIL:?set EMAIL, e.g. EMAIL=you@example.com}
PASSWORD=${PASSWORD:?set PASSWORD}
BODY_FILE=$(mktemp)
FAILS=0
PASSES=0

trap 'rm -f "$BODY_FILE"' EXIT

pass() { PASSES=$((PASSES + 1)); echo "PASS  $1"; }
fail() { FAILS=$((FAILS + 1)); echo "FAIL  $1"; echo "      response: $BODY"; }

# Preflight: stop early if the server is not running
if ! curl -s -o /dev/null --max-time 5 "$API/announcement"; then
    echo "Backend is not reachable at $API"
    echo "Start it in another terminal: cd backend && node index.js start"
    exit 1
fi

# call METHOD PATH [TOKEN] [JSON_BODY]
# Sets STATUS (HTTP code) and BODY (response text)
call() {
    local args=(-s -o "$BODY_FILE" -w '%{http_code}' --max-time 15 -X "$1" "$API$2")
    [ -n "$3" ] && args+=(-H "Authorization: Bearer $3")
    [ -n "$4" ] && args+=(-H 'Content-Type: application/json' -d "$4")

    STATUS=$(curl "${args[@]}")
    BODY=$(cat "$BODY_FILE" 2>/dev/null)

    if [ "$STATUS" = "000" ]; then
        BODY="connection failed"
    fi
}

# expect EXPECTED_STATUS LABEL
expect() {
    if [ "$STATUS" = "$1" ]; then
        pass "$2 ($STATUS)"
        return 0
    fi
    fail "$2 expected $1, got $STATUS"
    return 1
}

# Remove a repo, ignoring the result (cleanup should never fail the run)
cleanup_repo() {
    [ -n "$1" ] && call DELETE "/repo/$1" "$TOKEN" >/dev/null 2>&1
}

echo "Testing ForgeLab at $API"
echo

# ---------- 1. Login ----------
call POST /login "" "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
if ! expect 200 "login"; then
    echo
    echo "Cannot continue without a token. Check EMAIL and PASSWORD."
    exit 1
fi

TOKEN=$(echo "$BODY" | jq -r '.token')
USER_ID=$(echo "$BODY" | jq -r '.userId')

# ---------- 2. Create a public repo ----------
NAME="test-$(date +%s)"
call POST /repo/create "$TOKEN" "{\"name\":\"$NAME\",\"description\":\"automated test\",\"visibility\":true}"
expect 201 "create public repo"
REPO=$(echo "$BODY" | jq -r '.repositoryId')

# ---------- 3. Tree is empty before any push ----------
call GET "/repo/$REPO/tree"
expect 200 "tree before push"
FILE_COUNT=$(echo "$BODY" | jq '.files | length')
if [ "$FILE_COUNT" = "0" ]; then
    pass "tree is empty before push"
else
    fail "tree should be empty, found $FILE_COUNT files"
fi

# ---------- 4. Public repo readable without a token ----------
call GET "/repo/$REPO/commits"
expect 200 "commits readable anonymously"

# ---------- 5. Star and unstar ----------
call POST "/repo/$REPO/star" "$TOKEN"
expect 200 "star repo"

call DELETE "/repo/$REPO/star" "$TOKEN"
expect 200 "unstar repo"

# ---------- 6. Private repo visibility ----------
call POST /repo/create "$TOKEN" "{\"name\":\"$NAME-private\",\"visibility\":false}"
expect 201 "create private repo"
PRIV=$(echo "$BODY" | jq -r '.repositoryId')

call GET "/repo/$PRIV/tree"
expect 404 "private repo hidden from anonymous viewer"

call GET "/repo/$PRIV/tree" "$TOKEN"
expect 200 "private repo visible to owner"

# ---------- 7. Follow and unfollow (optional) ----------
if [ -n "$OTHER_USER_ID" ]; then
    call POST "/user/$OTHER_USER_ID/follow" "$TOKEN"
    expect 200 "follow user"

    call DELETE "/user/$OTHER_USER_ID/follow" "$TOKEN"
    expect 200 "unfollow user"
else
    echo "SKIP  follow (set OTHER_USER_ID to test)"
fi

# ---------- 8. Activity heatmap data ----------
call GET "/userProfile/$USER_ID/activity?tz=Asia/Kolkata"
expect 200 "activity endpoint"

TOTAL=$(echo "$BODY" | jq '[.activity[]?.value] | add // 0')
if [ "$TOTAL" -ge 2 ] 2>/dev/null; then
    pass "activity counts today's repos (total $TOTAL)"
else
    fail "activity total is $TOTAL, expected at least 2 (the two repos created above)"
fi

# ---------- 9. Announcements are public ----------
call GET /announcement
expect 200 "announcements list"

# ---------- 10. Cleanup ----------
cleanup_repo "$REPO"
cleanup_repo "$PRIV"
echo "CLEAN delete test repos"

# ---------- Summary ----------
echo
echo "Passed: $PASSES   Failed: $FAILS"
if [ "$FAILS" -eq 0 ]; then
    echo "All checks passed."
else
    echo "Some checks failed. Read the FAIL lines above."
fi

exit "$FAILS"