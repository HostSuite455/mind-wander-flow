$headers = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    'Content-Type' = 'application/json'
    'Prefer' = 'return=representation'
}

$properties = @(
    @{nome = "Appartamento con terrazza nel cuore di SIENA"; host_id = "user1"; city = "Siena"; status = "active"; max_guests = 4}
    @{nome = "Via esterna di Fontebranda"; host_id = "user1"; city = "Siena"; status = "active"; max_guests = 2}
    @{nome = "Viale Sardegna"; host_id = "user1"; city = "Siena"; status = "active"; max_guests = 6}
    @{nome = "Vicolo del leone"; host_id = "user1"; city = "Siena"; status = "active"; max_guests = 3}
    @{nome = "Palazzo Angelica"; host_id = "user1"; city = "Siena"; status = "active"; max_guests = 8}
)

$body = $properties | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:54321/rest/v1/properties" -Method POST -Headers $headers -Body $body
    Write-Host "Properties created successfully:"
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Error creating properties:"
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody"
    }
}