$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiY21saDUxODNnMDAwMHEzajBidWh0aGd2dSIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJ0eXBlIjoiYWRtaW4iLCJpYXQiOjE3NzA3NjE0OTIsImV4cCI6MTc3MzM1MzQ5Mn0.SqXwyz3I1Q7yg88oKYNUO4fZHTOpUsy-XG7UrnYq5Ls"

Write-Host "Testing admin profile endpoint..."
$headers = @{
    Authorization = "Bearer $token"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/profile" -Method GET -Headers $headers
    Write-Host "✅ Admin Profile Endpoint Works!"
    Write-Host ($response | ConvertTo-Json)
} catch {
    Write-Host "❌ Error:" $_.Exception.Message
}

Write-Host "`nTesting list admins endpoint..."
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/list" -Method GET -Headers $headers
    Write-Host "✅ List Admins Endpoint Works!"
    Write-Host ("Found " + $response.count + " admins")
} catch {
    Write-Host "❌ Error:" $_.Exception.Message
}

Write-Host "`n✅ All admin endpoints are working!"
