#!/bin/bash
cd packages/client/src/pages

echo "=== COMPLETE UI VALIDATION (58 PAGES) ==="
echo ""

# Count pages with text-primary icons
echo "✅ Pages with text-primary icons:"
grep -r "text-primary" . --include="*.tsx" | cut -d: -f1 | sort -u | wc -l | xargs echo "  Total:"

# Count pages with pb-3 cards
echo ""
echo "✅ Pages with pb-3 cards:"
grep -r "pb-3" . --include="*.tsx" | cut -d: -f1 | sort -u | wc -l | xargs echo "  Total:"

# Check Client Portal pages
echo ""
echo "📱 CLIENT PORTAL (7 pages):"
client_portal_pages=(
  "client-portal/ClientDashboard.tsx"
  "client-portal/Bookings.tsx"
  "client-portal/BookingDetail.tsx"
  "client-portal/ClientProjects.tsx"
  "client-portal/ClientInvoices.tsx"
  "client-portal/PaymentHistory.tsx"
  "client-portal/Profile.tsx"
)

for page in "${client_portal_pages[@]}"; do
  if [ -f "$page" ]; then
    if grep -q 'className=".*pt-2.*pb-4.*px-2' "$page"; then
      echo "  ✅ $page"
    else
      echo "  ⚠️  $page - Check container"
    fi
  fi
done

# Check Super Admin pages
echo ""
echo "🛡️  SUPER ADMIN (4 pages):"
superadmin_pages=(
  "SuperAdmin.tsx"
  "superadmin/Services.tsx"
  "superadmin/Database.tsx"
  "superadmin/Logs.tsx"
)

for page in "${superadmin_pages[@]}"; do
  if [ -f "$page" ]; then
    if grep -q 'className=".*pt-2.*pb-4.*px-2' "$page"; then
      echo "  ✅ $page"
    else
      echo "  ⚠️  $page - Check container"
    fi
  fi
done

# Check Public/Auth pages
echo ""
echo "🔓 PUBLIC/AUTH (4 pages):"
public_pages=(
  "Login.tsx"
  "Register.tsx"
  "client-portal/ClientLogin.tsx"
  "auth/MagicLinkVerify.tsx"
)

for page in "${public_pages[@]}"; do
  if [ -f "$page" ]; then
    if grep -q 'className=".*pt-6' "$page"; then
      echo "  ✅ $page (centered)"
    else
      echo "  ⚠️  $page - Check pt-6"
    fi
  fi
done

echo ""
echo "=== SUMMARY ==="
total_pages=$(find . -name "*.tsx" -type f | wc -l)
echo "Total .tsx files: $total_pages"
echo "Expected: 58 pages harmonized"
